const ALLOWED_ORIGINS = new Set([
  "https://chvostikovo.sk",
  "https://www.chvostikovo.sk",
  "https://chvostikovopsiaskolka.github.io",
]);

const INTERACTION_EVENTS = new Set([
  "phone_click",
  "explore_daycare",
  "inquiry_cta",
  "form_start",
  "form_attempt",
  "form_submit",
  "form_error",
  "success_conditions_click",
  "success_pricing_click",
]);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

type Json = Record<string, unknown>;

function response(origin: string, status: number, body: Json) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function text(value: unknown, max: number) {
  const v = String(value ?? "").trim();
  return v ? v.slice(0, max) : null;
}

function browserInfo(uaRaw: string) {
  const ua = uaRaw || "";

  let browser_context = "external_browser";
  if (/Instagram/i.test(ua)) browser_context = "instagram_in_app";
  else if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(ua)) browser_context = "facebook_in_app";
  else if (/Messenger|MESSENGER/i.test(ua)) browser_context = "messenger_in_app";
  else if (ua.includes("Line/") || /Twitter|Snapchat|TikTok/i.test(ua)) browser_context = "other_in_app";

  let browser_family = "other";
  if (/EdgiOS/i.test(ua) || ua.includes("Edg/")) browser_family = "edge";
  else if (/FxiOS/i.test(ua) || ua.includes("Firefox/")) browser_family = "firefox";
  else if (/CriOS/i.test(ua) || ua.includes("Chrome/")) browser_family = "chrome";
  else if (ua.includes("Safari/") && ua.includes("Version/")) browser_family = "safari";

  let device_type = "other";
  if (/iPad|Tablet/i.test(ua)) device_type = "tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(ua)) device_type = "mobile";
  else if (/Macintosh|Windows NT|X11|Linux x86_64/i.test(ua)) device_type = "desktop";

  return { browser_context, browser_family, device_type };
}

function classifySource(input: Json) {
  const utmSource = String(input.utm_source || "").toLowerCase();
  const utmMedium = String(input.utm_medium || "").toLowerCase();
  const referrerHost = String(input.referrer_host || "").toLowerCase();
  const hasFbclid = input.has_fbclid === true;

  const sourceTokens = utmSource.split(/[^a-z0-9]+/).filter(Boolean);
  const hasSourceToken = (values: string[]) => sourceTokens.some((token) => values.includes(token));
  const paidMedium = ["paid", "cpc", "ppc", "paid_social", "social_paid"].some((value) => utmMedium.includes(value));
  const isHost = (domain: string) => referrerHost === domain || referrerHost.endsWith("." + domain);
  const isGoogleHost =
    referrerHost === "google.com" ||
    referrerHost.endsWith(".google.com") ||
    referrerHost.startsWith("google.") ||
    referrerHost.startsWith("www.google.");

  const isInstagramSource = hasSourceToken(["instagram", "ig"]);
  const isFacebookSource = hasSourceToken(["facebook", "fb"]);
  const isMetaSource = isInstagramSource || isFacebookSource || hasSourceToken(["meta"]);
  const isGoogleSource = hasSourceToken(["google"]);
  const isBingSource = hasSourceToken(["bing"]);

  if (isHost("chvostikovo.sk") || isHost("chvostikovopsiaskolka.github.io")) return "internal_navigation";

  if (isMetaSource && paidMedium) return "meta_paid";
  if (isGoogleSource && paidMedium) return "google_paid";
  if (isBingSource && paidMedium) return "bing_paid";

  if (utmSource && !paidMedium) {
    if (isInstagramSource) return "instagram_organic";
    if (isFacebookSource || hasSourceToken(["meta"])) return "facebook_organic";
    if (isGoogleSource) return "google_organic";
    if (isBingSource) return "bing_organic";
    if (hasSourceToken(["tiktok"])) return "tiktok_organic";
    if (hasSourceToken(["youtube"])) return "youtube_organic";
    if (hasSourceToken(["linkedin"])) return "linkedin_organic";
    if (hasSourceToken(["threads"])) return "threads_organic";
    if (hasSourceToken(["reddit"])) return "reddit_organic";
    if (hasSourceToken(["pinterest"])) return "pinterest_organic";
  }

  if (hasFbclid) return "meta_paid";

  if (isHost("instagram.com")) return "instagram_organic";
  if (isHost("facebook.com") || isHost("fb.com")) return "facebook_organic";
  if (isGoogleHost) return "google_organic";
  if (isHost("bing.com")) return "bing_organic";
  if (isHost("search.yahoo.com") || isHost("yahoo.com")) return "yahoo_organic";
  if (isHost("duckduckgo.com")) return "duckduckgo_organic";
  if (isHost("ecosia.org")) return "ecosia_organic";
  if (isHost("seznam.cz")) return "seznam_organic";
  if (isHost("search.brave.com")) return "brave_organic";
  if (isHost("startpage.com")) return "startpage_organic";
  if (isHost("qwant.com")) return "qwant_organic";
  if (isHost("yandex.com") || isHost("yandex.ru")) return "yandex_organic";
  if (isHost("tiktok.com")) return "tiktok_organic";
  if (isHost("youtube.com") || isHost("youtu.be")) return "youtube_organic";
  if (isHost("linkedin.com")) return "linkedin_organic";
  if (isHost("threads.net")) return "threads_organic";
  if (isHost("reddit.com")) return "reddit_organic";
  if (isHost("pinterest.com")) return "pinterest_organic";
  if (isHost("x.com") || isHost("twitter.com")) return "x_organic";

  if (utmSource) return "utm_other";
  if (referrerHost) return "referral";
  return "direct";
}

const ERROR_STAGES = new Set(["frontend_validation", "phone_normalization", "zod_validation", "payload", "network", "backend_http", "backend_response"]);
const FORM_PATHS = new Set(["/", "/psia-skolka-kosice", "/psia-skolka-pre-steniatka", "/strazenie-psov-kosice", "/en/dog-daycare-kosice"]);

async function notifyFormError(input: Json, path: string, attemptId: string | null) {
  const page = path.split(/[?#]/)[0]!.replace(/\/$/, "") || "/";
  const [source = "", suppliedStage = "", rawStatus] = String(input.event_source || "").split(":");
  if (!FORM_PATHS.has(page) || !/^[a-z_]{1,80}$/.test(source)) return "invalid_diagnostic";
  const stage = ERROR_STAGES.has(suppliedStage) ? suppliedStage : "frontend_validation";
  const numericStatus = Number(rawStatus);
  const status = Number.isInteger(numericStatus) && numericStatus >= 100 && numericStatus <= 599 ? numericStatus : null;
  const id = attemptId || crypto.randomUUID();
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
  try {
    const reservation = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_website_form_error_alert`, {
      method: "POST", headers,
      body: JSON.stringify({ p_attempt_id: id, p_path: page, p_form_source: source, p_error_stage: stage, p_http_status: status }),
    });
    if (!reservation.ok) { console.error("form alert reservation failed", reservation.status); return "failed"; }
    const reserved = await reservation.json();
    if (reserved !== "reserved") return reserved;
    const apiKey = Deno.env.get("RESEND_API_KEY");
    let deliveryStatus = "failed";
    let resendId: string | null = null;
    if (apiKey) {
      let databaseCheck = "Nepodarilo sa overiť uloženie v DB.";
      if (attemptId) {
        try {
          const saved = await fetch(`${SUPABASE_URL}/rest/v1/web_form_submissions?raw_payload-%3E%3Eform_attempt_id=eq.${id}&select=id&limit=1`, { headers, signal: AbortSignal.timeout(5000) });
          if (saved.ok) {
            const rows = await saved.json();
            databaseCheck = rows.length ? `V DB už je uložený záznam ID ${rows[0].id}.` : "V čase kontroly v DB nebol záznam s týmto ID pokusu.";
          }
        } catch { /* A failed DB check must not hide the original error alert. */ }
      }
      const email = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `form-error/${id}` },
        body: JSON.stringify({
          from: Deno.env.get("NOTIFY_FROM") ?? "Chvostíkovo web <onboarding@resend.dev>",
          to: [Deno.env.get("NOTIFY_TO") ?? "chvostikovo.psiaskolka@gmail.com"],
          subject: `${input.utm_source === "qa" ? "[TEST monitoringu] " : ""}Chvostíkovo: odoslanie webového formulára zlyhalo`,
          text: [
            "Návštevník stlačil Odoslať a formulár zobrazil chybu.",
            `Čas: ${new Date().toLocaleString("sk-SK", { timeZone: "Europe/Bratislava" })}`,
            `Formulár: ${source}`, `Stránka: https://chvostikovo.sk${page}`,
            `Krok zlyhania: ${stage}`, ...(status ? [`HTTP stav: ${status}`] : []),
            `ID pokusu: ${id}`, databaseCheck, "",
            "Toto je technické upozornenie, nie nový záujem alebo prihláška. Neobsahuje osobné údaje.",
            "Pri sieťovej chybe overte DB: požiadavka mohla byť uložená aj keď prehliadač nedostal odpoveď.",
            "Ochrana schránky: najviac 5 upozornení za 10 minút; všetky ďalšie chyby zostávajú zaznamenané.",
          ].join("\n"),
        }),
      });
      if (email.ok) {
        const receipt = await email.json();
        resendId = typeof receipt.id === "string" ? receipt.id : null;
        deliveryStatus = "sent";
      } else console.error("form alert email failed", email.status);
    } else console.error("form alert email configuration missing");
    const update = await fetch(`${SUPABASE_URL}/rest/v1/website_form_error_alerts?attempt_id=eq.${id}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ delivery_status: deliveryStatus, resend_id: resendId, sent_at: deliveryStatus === "sent" ? new Date().toISOString() : null }),
    });
    if (!update.ok) console.error("form alert receipt update failed", update.status);
    return deliveryStatus;
  } catch {
    // Never expose an exception or personal data and never break landing tracking.
    console.error("form alert failed");
    await fetch(`${SUPABASE_URL}/rest/v1/website_form_error_alerts?attempt_id=eq.${id}`, {
      method: "PATCH", headers, body: JSON.stringify({ delivery_status: "failed" }),
    }).catch(() => {});
    return "failed";
  }
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

  if (req.method !== "POST") return response(origin, 405, { ok: false, error: "method_not_allowed" });
  if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false, error: "origin_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_KEY) return response(origin, 500, { ok: false, error: "server_config" });

  try {
    const raw = await req.text();
    if (!raw || raw.length > 5000) return response(origin, 400, { ok: false, error: "invalid_body" });
    const input = JSON.parse(raw) as Json;

    const path = text(input.path, 500);
    if (!path || !path.startsWith("/")) return response(origin, 400, { ok: false, error: "invalid_path" });

    const language = input.language === "en" ? "en" : "sk";
    const navigationType = ["navigate","reload","back_forward","prerender","other"].includes(String(input.navigation_type))
      ? String(input.navigation_type)
      : null;

    const referrerHost = text(input.referrer_host, 253);
    const sourceChannel = classifySource(input);
    const { browser_context, browser_family, device_type } = browserInfo(req.headers.get("user-agent") || "");

    const sharedPayload = {
      path,
      language,
      source_channel: sourceChannel,
      utm_source: text(input.utm_source, 200),
      utm_medium: text(input.utm_medium, 200),
      utm_campaign: text(input.utm_campaign, 300),
      utm_content: text(input.utm_content, 300),
      utm_term: text(input.utm_term, 300),
      utm_id: text(input.utm_id, 200),
      has_fbclid: input.has_fbclid === true,
      referrer_host: referrerHost,
      browser_context,
      browser_family,
      device_type,
      navigation_type: navigationType,
    };

    const eventName = text(input.event_name, 80);
    if (eventName) {
      if (!INTERACTION_EVENTS.has(eventName)) {
        return response(origin, 400, { ok: false, error: "invalid_event_name" });
      }

      const metaClickHash = text(input.meta_click_hash, 64);
      if (metaClickHash && !/^[0-9a-f]{64}$/.test(metaClickHash)) {
        return response(origin, 400, { ok: false, error: "invalid_meta_click_hash" });
      }

      const interactionPayload = {
        ...sharedPayload,
        event_name: eventName,
        event_source: text(input.event_source, 200),
        meta_click_hash: metaClickHash,
      };

      const attemptId = typeof input.attempt_id === "string" ? input.attempt_id : null;
      if (attemptId && (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId) || !["form_attempt", "form_submit", "form_error"].includes(eventName))) {
        return response(origin, 400, { ok: false, error: "invalid_attempt_id" });
      }

      const insert = await fetch(`${SUPABASE_URL}/rest/v1/website_interaction_events`, {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...interactionPayload, ...(attemptId ? { attempt_id: attemptId } : {}) }),
      });

      if (!insert.ok && insert.status !== 409) {
        console.error("interaction insert failed", insert.status, await insert.text());
        return response(origin, 500, { ok: false, error: "insert_failed" });
      }

      const alertStatus = eventName === "form_error" ? await notifyFormError(input, path, attemptId) : undefined;
      return response(origin, 201, { ok: true, ...(alertStatus ? { alert_status: alertStatus } : {}) });
    }

    const insert = await fetch(`${SUPABASE_URL}/rest/v1/website_landing_events`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(sharedPayload),
    });

    if (!insert.ok) {
      console.error("landing insert failed", insert.status, await insert.text());
      return response(origin, 500, { ok: false, error: "insert_failed" });
    }

    return response(origin, 201, { ok: true });
  } catch (error) {
    console.error("landing event failed", error);
    return response(origin, 500, { ok: false, error: "server_error" });
  }
});
