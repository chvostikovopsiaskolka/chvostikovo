const ALLOWED_ORIGINS = new Set([
  "https://chvostikovo.sk",
  "https://www.chvostikovo.sk",
  "https://chvostikovopsiaskolka.github.io",
]);

const SIZES = new Set(["small", "large"]);
const COLORS = new Set(["natural", "dark", "white", "custom"]);
const LETTER_COLORS = new Set(["light", "dark", "black", "custom"]);

const LABELS: Record<string, Record<string, string>> = {
  size: { small: "Menší", large: "Väčší" },
  color: { natural: "Svetlá", dark: "Tmavá", white: "Biela", custom: "Iná" },
  letter: { light: "Svetlé", dark: "Tmavé", black: "Čierne", custom: "Iné" },
};

function text(value: unknown, max = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function response(origin: string, status: number, body: Record<string, unknown>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function sendNotificationEmail(inquiry: Record<string, any>) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("missing_resend_key");

  const configuration = inquiry.configuration;
  const createdAt = new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Bratislava",
  }).format(new Date(inquiry.created_at));

  const message = [
    "Produkt: Drevený stojan na misky",
    `Meno zákazníka: ${inquiry.customer_name}`,
    `Telefón: ${inquiry.phone}`,
    `E-mail: ${inquiry.email}`,
    `Rozmer: ${LABELS.size[configuration.size]}`,
    `Farba stojana: ${LABELS.color[configuration.color]}`,
    `Výška psíka: ${configuration.dog_height_cm} cm`,
    `Meno na stojane: ${configuration.name_on_stand || "bez mena"}`,
    `Farba písmen: ${LABELS.letter[configuration.letter_color]}`,
    `Dátum/čas dopytu: ${createdAt}`,
  ].join("\n");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("NOTIFY_FROM") ?? "Chvostíkovo web <onboarding@resend.dev>",
      to: [Deno.env.get("NOTIFY_TO") ?? "chvostikovo.psiaskolka@gmail.com"],
      subject: "Nový dopyt: Drevený stojan na misky",
      text: message,
    }),
  });
  const emailBody = await emailResponse.json().catch(() => ({}));
  if (!emailResponse.ok) {
    console.error("Resend failed", emailResponse.status, emailBody);
    throw new Error("email_failed");
  }

  return text(emailBody.id, 200) || null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  if (req.method !== "POST")
    return response(origin, 405, { ok: false, error: "method_not_allowed" });
  if (!ALLOWED_ORIGINS.has(origin))
    return response(origin, 403, { ok: false, error: "origin_not_allowed" });

  try {
    const raw = await req.text();
    if (!raw || raw.length > 12_000)
      return response(origin, 400, { ok: false, error: "invalid_body" });
    const input = JSON.parse(raw);

    if (text(input.company || input.website, 200)) return response(origin, 200, { ok: true });

    const submissionId = text(input.client_submission_id, 50);
    const productType = text(input.product_type, 50);
    const customerName = text(input.customer_name, 160);
    const phone = text(input.phone, 40);
    const email = text(input.email, 200).toLowerCase();
    const sourceRef = text(input.source_ref || "/stojan-na-misky-pre-psa", 500);
    const rawConfiguration = input.configuration ?? {};
    const size = text(rawConfiguration.size, 20);
    const color = text(rawConfiguration.color, 20);
    const letterColor = text(rawConfiguration.letter_color, 20);
    const dogHeight = Number(rawConfiguration.dog_height_cm);
    const nameOnStand = text(rawConfiguration.name_on_stand, 40);

    if (!isUuid(submissionId) || productType !== "stand") {
      return response(origin, 400, { ok: false, error: "invalid_product" });
    }
    if (!customerName || phone.length < 7 || !email.includes("@")) {
      return response(origin, 400, { ok: false, error: "missing_customer_fields" });
    }
    if (
      !SIZES.has(size) ||
      !COLORS.has(color) ||
      !LETTER_COLORS.has(letterColor) ||
      !Number.isFinite(dogHeight) ||
      dogHeight < 10 ||
      dogHeight > 120
    ) {
      return response(origin, 400, { ok: false, error: "invalid_configuration" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("missing_supabase_env");
    const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    const existingResponse = await fetch(
      `${supabaseUrl}/rest/v1/product_inquiries?client_submission_id=eq.${submissionId}&select=*`,
      { headers: authHeaders, cache: "no-store" },
    );
    if (!existingResponse.ok) throw new Error(`existing_lookup_${existingResponse.status}`);
    const [existing] = await existingResponse.json();

    let inquiry = existing;
    if (!inquiry) {
      const since = new Date(Date.now() - 20_000).toISOString();
      const duplicateResponse = await fetch(
        `${supabaseUrl}/rest/v1/product_inquiries?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
        { headers: authHeaders, cache: "no-store" },
      );
      if (!duplicateResponse.ok) throw new Error(`duplicate_lookup_${duplicateResponse.status}`);
      if ((await duplicateResponse.json()).length) {
        return response(origin, 429, { ok: false, error: "please_wait" });
      }

      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/product_inquiries`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          product_type: "stand",
          customer_name: customerName,
          phone,
          email,
          status: "new",
          configuration: {
            size,
            color,
            dog_height_cm: dogHeight,
            name_on_stand: nameOnStand,
            letter_color: letterColor,
          },
          source_ref: sourceRef,
          client_submission_id: submissionId,
        }),
      });
      if (!insertResponse.ok)
        throw new Error(`insert_${insertResponse.status}_${await insertResponse.text()}`);
      [inquiry] = await insertResponse.json();
    }

    if (!inquiry?.id) throw new Error("missing_inquiry_id");
    if (inquiry.email_sent_at) {
      return response(origin, 200, { ok: true, inquiry_id: inquiry.id, duplicate: true });
    }

    const providerId = await sendNotificationEmail(inquiry);
    const emailUpdateResponse = await fetch(
      `${supabaseUrl}/rest/v1/product_inquiries?id=eq.${inquiry.id}`,
      {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          email_sent_at: new Date().toISOString(),
          email_provider_id: providerId,
        }),
      },
    );
    if (!emailUpdateResponse.ok) {
      console.error(
        "Email marker update failed",
        emailUpdateResponse.status,
        await emailUpdateResponse.text(),
      );
    }

    return response(origin, 201, { ok: true, inquiry_id: inquiry.id });
  } catch (error) {
    console.error(error);
    const message = String(error instanceof Error ? error.message : error);
    if (message === "email_failed" || message === "missing_resend_key") {
      return response(origin, 502, { ok: false, error: "email_failed" });
    }
    return response(origin, 500, { ok: false, error: "server_error" });
  }
});
