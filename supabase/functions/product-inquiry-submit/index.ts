const ALLOWED_ORIGINS = new Set([
  "https://chvostikovo.sk",
  "https://www.chvostikovo.sk",
  "https://chvostikovopsiaskolka.github.io",
]);

const STAND_SIZES = new Set(["small", "large"]);
const COLORS = new Set(["natural", "dark", "white", "custom"]);
const LETTER_COLORS = new Set(["light", "dark", "black", "custom"]);
const TARGET_SIZES = new Set(["small", "large"]);

const LABELS: Record<string, Record<string, string>> = {
  size: { small: "Menší", large: "Väčší" },
  color: { natural: "Svetlá", dark: "Tmavá", white: "Biela", custom: "Iná" },
  letter: { light: "Svetlé", dark: "Tmavé", black: "Čierne", custom: "Iné" },
  targetSize: { small: "Malý 25 × 25 cm", large: "Veľký 40 × 20 cm" },
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

  const configuration = inquiry.configuration ?? {};
  const createdAt = new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Bratislava",
  }).format(new Date(inquiry.created_at));

  let subject = "Nový produktový dopyt";
  let message: string[];

  if (inquiry.product_type === "target") {
    subject = "Nový dopyt: Target na cvičenie pre psov";
    message = [
      "Produkt: Target na cvičenie pre psov",
      `Meno zákazníka: ${inquiry.customer_name}`,
      `Telefón: ${inquiry.phone}`,
      `E-mail: ${inquiry.email}`,
      `Veľkosť: ${LABELS.targetSize[configuration.size] ?? configuration.size}`,
      `Požadovaná výška: ${configuration.height_cm ? `${configuration.height_cm} cm` : "štandardná 5 cm / podľa dohody"}`,
      `Poznámka: ${configuration.note || "bez poznámky"}`,
      `Súhlas so spracovaním osobných údajov: ${inquiry.consent === true ? "Áno" : "Nie"}`,
      `Súhlas so spracovaním osobných údajov: ${inquiry.consent === true ? "Áno" : "Nie"}`,
      `Dátum/čas dopytu: ${createdAt}`,
    ];
  } else {
    subject = "Nový dopyt: Drevený stojan na misky";
    message = [
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
    ];
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("NOTIFY_FROM") ?? "Chvostíkovo web <onboarding@resend.dev>",
      to: [Deno.env.get("NOTIFY_TO") ?? "chvostikovo.psiaskolka@gmail.com"],
      subject,
      text: message.join("\n"),
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
    const sourceRef = text(
      input.source_ref ||
        (productType === "target" ? "/target-na-cvicenie-pre-psov" : "/stojan-na-misky-pre-psa"),
      500,
    );
    const rawConfiguration = input.configuration ?? {};

    if (!isUuid(submissionId) || !["stand", "target"].includes(productType)) {
      return response(origin, 400, { ok: false, error: "invalid_product" });
    }
    if (!customerName || !/^\\+\\d{7,15}$/.test(phone) || !email.includes("@") || input.consent !== true) {
      return response(origin, 400, { ok: false, error: "missing_customer_fields" });
    }

    let configuration: Record<string, unknown>;

    if (productType === "target") {
      const size = text(rawConfiguration.size, 20);
      const note = text(rawConfiguration.note, 1000);
      const heightRaw = rawConfiguration.height_cm;
      const height = heightRaw === "" || heightRaw == null ? null : Number(heightRaw);

      if (!TARGET_SIZES.has(size)) {
        return response(origin, 400, { ok: false, error: "invalid_configuration" });
      }
      if (height !== null && (!Number.isFinite(height) || height < 3 || height > 60)) {
        return response(origin, 400, { ok: false, error: "invalid_configuration" });
      }

      configuration = {
        size,
        height_cm: height,
        note,
      };
    } else {
      const size = text(rawConfiguration.size, 20);
      const color = text(rawConfiguration.color, 20);
      const letterColor = text(rawConfiguration.letter_color, 20);
      const dogHeight = Number(rawConfiguration.dog_height_cm);
      const nameOnStand = text(rawConfiguration.name_on_stand, 40);

      if (
        !STAND_SIZES.has(size) ||
        !COLORS.has(color) ||
        !LETTER_COLORS.has(letterColor) ||
        !Number.isFinite(dogHeight) ||
        dogHeight < 10 ||
        dogHeight > 120
      ) {
        return response(origin, 400, { ok: false, error: "invalid_configuration" });
      }

      configuration = {
        size,
        color,
        dog_height_cm: dogHeight,
        name_on_stand: nameOnStand,
        letter_color: letterColor,
      };
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
          product_type: productType,
          customer_name: customerName,
          phone,
          email,
          status: "new",
          consent: true,
          configuration,
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
