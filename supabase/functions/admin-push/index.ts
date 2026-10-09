import webpush from "npm:web-push@3.6.7";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-push-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
let VAPID_PUBLIC_KEY = "";
let VAPID_PRIVATE_KEY = "";
let WEBHOOK_SECRET = "";

type Json = Record<string, unknown>;


function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Database ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

let pushRuntimeReady = false;
async function ensurePushRuntime() {
  if (pushRuntimeReady) return;
  const cfg = await rest("rpc/admin_push_runtime_config", {
    method: "POST",
    body: "{}",
  });
  VAPID_PUBLIC_KEY = String(cfg?.vapid_public_key || "");
  VAPID_PRIVATE_KEY = String(cfg?.vapid_private_key || "");
  WEBHOOK_SECRET = String(cfg?.webhook_secret || "");
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !WEBHOOK_SECRET) {
    throw new Error("Push runtime configuration missing");
  }
  webpush.setVapidDetails("mailto:info@chvostikovo.sk", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  pushRuntimeReady = true;
}

async function requireUser(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new Error("Najprv sa prihláste.");
  const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: authorization },
  });
  if (!auth.ok) throw new Error("Prihlásenie vypršalo.");
  const user = await auth.json();
  return String(user.id);
}

async function requireStaff(req: Request) {
  const userId = await requireUser(req);
  const rows = await rest(`staff?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=user_id`);
  if (!Array.isArray(rows) || !rows.length) throw new Error("Nemáte oprávnenie.");
  return userId;
}

async function messageForWebhook(body: Json) {
  const table = String(body.table || "");
  const record = (body.record && typeof body.record === "object" ? body.record : {}) as Json;
  const id = String(record.id || Date.now());

  if (table === "web_form_submissions") {
    const application = record.form_type === "application";
    const owner = String(record.owner_name || "Nový kontakt");
    const dog = String(record.dog_name || "");

    if (!application) {
      const openLeads = await rest("web_form_submissions?form_type=eq.lead&status=eq.new&select=id");
      const count = Math.max(1, Array.isArray(openLeads) ? openLeads.length : 1);
      const title = count === 1
        ? "Máte 1 nový záujem"
        : count >= 2 && count <= 4
          ? `Máte ${count} nové záujmy`
          : `Máte ${count} nových záujmov`;
      return {
        title,
        body: owner,
        tag: `web-form-${id}`,
      };
    }

    return {
      title: "Nová prihláška psa",
      body: dog ? `${owner} · ${dog}` : owner,
      tag: `web-form-${id}`,
    };
  }

  if (table === "customer_booking_requests") {
    const dogRows = await rest(`dogs?id=eq.${encodeURIComponent(String(record.dog_id || ""))}&select=name&limit=1`);
    const dogName = Array.isArray(dogRows) && dogRows[0]?.name ? String(dogRows[0].name) : "Psík";
    const date = String(record.reservation_date || "");
    if (record.status === "approved") {
      return {
        title: "Rezervácia bola schválená",
        body: `Rezervácia na ${date ? date.split("-").reverse().join(".") : ""} bola schválená. Pozrite si, kto bude v ten deň s vaším psíkom v škôlke.`,
        tag: `booking-approved-${id}`,
        recipientUserId: String(record.user_id || ""),
        audience: "customer",
      };
    }
    if (record.taxi_change_status === "pending") {
      const taxi = record.requested_taxi_mode === "pickup_dropoff"
        ? "vyzdvihnutie aj dovoz (+10 €)"
        : "vyzdvihnutie ráno / dovoz domov (+5 €)";
      return {
        title: "Zmena taxi čaká na schválenie",
        body: `${dogName}${date ? ` · ${date.split("-").reverse().join(".")}` : ""} · ${taxi}`,
        tag: `taxi-change-${id}`,
      };
    }
    if (record.status === "cancelled") {
      const reason = String(record.cancellation_reason || "").trim();
      return {
        title: "Rezervácia bola zrušená zákazníkom",
        body: `${dogName}${date ? ` · ${date.split("-").reverse().join(".")}` : ""}${reason ? ` · Dôvod: ${reason}` : ""}`,
        tag: `booking-cancelled-${id}`,
      };
    }
    return {
      title: "Nová rezervácia čaká na schválenie",
      body: `${dogName}${date ? ` · ${date.split("-").reverse().join(".")}` : ""}`,
      tag: `booking-${id}`,
    };
  }

  if (table === "customer_pass_requests") {
    const dogRows = await rest(`dogs?id=eq.${encodeURIComponent(String(record.dog_id || ""))}&select=name&limit=1`);
    const dogName = Array.isArray(dogRows) && dogRows[0]?.name ? String(dogRows[0].name) : "Psík";
    return {
      title: "Záujem o permanentku",
      body: `${dogName} má záujem o ďalšiu 10-vstupovú permanentku.`,
      tag: `pass-interest-${id}`,
    };
  }

  if (table === "customer_profiles") {
    const name = String(record.full_name || record.email || "Nový majiteľ");
    return {
      title: "Nový majiteľ čaká na priradenie",
      body: name,
      tag: `customer-${String(record.user_id || id)}`,
    };
  }

  if (table === "portal_notifications") {
    return {
      title: String(record.push_title || record.title || "Chvostíkovo"),
      body: String(record.push_body || record.body || "Máte nové upozornenie."),
      tag: `portal-${id}`,
      recipientUserId: String(record.recipient_user_id || ""),
      audience: "customer",
    };
  }

  return null;
}


function bratislavaParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>;
}

function adminTaxiLabel(mode: unknown) {
  const value = String(mode || "").trim().toLowerCase();
  if (["pickup_dropoff", "do/zo", "do-zo"].includes(value)) return "do/zo";
  if (["pickup", "do", "one_way"].includes(value)) return "do";
  return value && value !== "none" ? value : "";
}

async function dispatchAdminDailySummary(body: Json) {
  const now = bratislavaParts();
  const day = `${now.year}-${now.month}-${now.day}`;
  const force = body.force === true;

  if (!force && (now.hour !== "06" || now.minute !== "15")) {
    return { sent: 0, removed: 0, ignored: true, reason: "outside_0615" };
  }

  if (!force) {
    const existing = await rest(`admin_daily_push_log?day=eq.${encodeURIComponent(day)}&select=day&limit=1`);
    if (Array.isArray(existing) && existing.length) {
      return { sent: 0, removed: 0, ignored: true, reason: "already_sent" };
    }
  }

  const reservations = await rest(
    `reservations?reservation_date=eq.${encodeURIComponent(day)}&status=eq.booked&select=id,dog_id,taxi_mode,taxi_service`
  );
  const rows = Array.isArray(reservations) ? reservations : [];
  const dogIds = [...new Set(rows.map((row) => Number(row.dog_id)).filter((id) => Number.isFinite(id) && id > 0))];
  const dogs = dogIds.length
    ? await rest(`dogs?id=in.(${dogIds.join(",")})&select=id,name`)
    : [];
  const dogNames = new Map((Array.isArray(dogs) ? dogs : []).map((dog) => [Number(dog.id), String(dog.name || "Psík")]));

  const taxiRows = rows
    .map((row) => ({
      name: dogNames.get(Number(row.dog_id)) || "Psík",
      mode: adminTaxiLabel(row.taxi_mode || row.taxi_service),
    }))
    .filter((row) => row.mode);

  const dogCount = rows.length;
  const taxiText = taxiRows.length
    ? ` Taxi: ${taxiRows.map((row) => `${row.name} – ${row.mode}`).join(", ")}.`
    : "";
  const message = {
    title: "Dobré ráno z Chvostíkova 🐾",
    body: `Dnes máte v škôlke ${dogCount} psíkov.${taxiText} Prajeme pekný deň!`,
    tag: `admin-daily-summary-${day}`,
  };

  const subscriptions = await rest("admin_push_subscriptions?active=eq.true&select=id,endpoint,p256dh,auth");
  let sent = 0;
  let removed = 0;
  const payload = JSON.stringify({
    ...message,
    badge: "/notification-badge.png?v=20260917-push",
    data: { url: "/" },
  });

  for (const row of Array.isArray(subscriptions) ? subscriptions : []) {
    try {
      await webpush.sendNotification({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }, payload, { TTL: 21600, urgency: "normal" });
      sent += 1;
    } catch (error) {
      const status = Number((error as { statusCode?: number }).statusCode || 0);
      if (status === 404 || status === 410) {
        await rest(`admin_push_subscriptions?id=eq.${encodeURIComponent(String(row.id))}`, { method: "DELETE" });
        removed += 1;
      } else {
        console.error("Daily summary push failed", status, error instanceof Error ? error.message : String(error));
      }
    }
  }

  if (!force) {
    await rest("admin_daily_push_log?on_conflict=day", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        day,
        sent_at: new Date().toISOString(),
        sent_count: sent,
        dog_count: dogCount,
        taxi_count: taxiRows.length,
      }),
    });
  }

  return { sent, removed, ignored: false, day, dog_count: dogCount, taxi_count: taxiRows.length };
}

// Called only when a customer push is being sent, never by a polling loop.
async function customerUnreadBadgeCountV186(userId: string) {
  const conversations = await rest('portal_conversations?customer_user_id=eq.'
    + encodeURIComponent(userId) + '&select=id&limit=1') as Array<Json>;
  const conversationId = conversations.length ? Number(conversations[0].id) : null;
  const [messages, notices] = await Promise.all([
    conversationId
      ? rest('portal_messages?conversation_id=eq.' + conversationId
          + '&sender_role=eq.staff&read_at=is.null&select=id&limit=1000') as Promise<Array<Json>>
      : Promise.resolve([] as Array<Json>),
    rest('portal_notifications?recipient_user_id=eq.' + encodeURIComponent(userId)
      + '&read_at=is.null&select=notification_type,visible_from,visible_until&limit=1000') as Promise<Array<Json>>,
  ]);
  const todayParts = bratislavaParts();
  const today = todayParts.year + '-' + todayParts.month + '-' + todayParts.day;
  const excluded = new Set(['staff_message_customer','customer_message_admin','pass_request_admin',
    'pass_interest_registered','dog_approved','weekly_booking_reminder','weekly_booking_reminder_test']);
  const currentNotices = notices.filter(n => {
    if(excluded.has(String(n.notification_type || '')))return false;
    if(n.visible_from && String(n.visible_from) > today)return false;
    if(n.visible_until && String(n.visible_until) < today)return false;
    return true;
  });
  return messages.length + currentNotices.length;
}

async function dispatch(body: Json) {
  const message = await messageForWebhook(body);
  if (!message) return { sent: 0, removed: 0, ignored: true };
  const customer = message.audience === "customer";
  if (customer && !message.recipientUserId) return { sent: 0, removed: 0, ignored: true };
  const subscriptionTable = customer ? "portal_push_subscriptions" : "admin_push_subscriptions";
  const userFilter = customer ? `&user_id=eq.${encodeURIComponent(message.recipientUserId)}` : "";
  const rows = await rest(`${subscriptionTable}?active=eq.true${userFilter}&select=id,endpoint,p256dh,auth`);
  let sent = 0;
  let removed = 0;
  let badgeCount: number | null = null;
  if(customer && Array.isArray(rows) && rows.length) {
    try { badgeCount = await customerUnreadBadgeCountV186(String(message.recipientUserId)); }
    catch(error) { console.error('Customer unread badge query failed',error instanceof Error ? error.message : String(error)); }
  }
  const payload = JSON.stringify({
    ...message,
    ...(badgeCount === null ? {} : { badgeCount, badgeComputedAt: new Date().toISOString() }),
    badge: "/notification-badge.png?v=20260917-push",
    data: { url: "/" },
  });

  for (const row of Array.isArray(rows) ? rows : []) {
    try {
      await webpush.sendNotification({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }, payload, { TTL: 86400, urgency: "high" });
      sent += 1;
    } catch (error) {
      const status = Number((error as { statusCode?: number }).statusCode || 0);
      if (status === 404 || status === 410) {
        await rest(`${subscriptionTable}?id=eq.${encodeURIComponent(String(row.id))}`, { method: "DELETE" });
        removed += 1;
      } else {
        console.error("Push delivery failed", status, error instanceof Error ? error.message : String(error));
      }
    }
  }
  return { sent, removed, ignored: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return response({ error: "Server configuration missing" }, 500);

  try {
    await ensurePushRuntime();
    const body = await req.json().catch(() => ({})) as Json;
    if (req.headers.get("x-push-secret") === WEBHOOK_SECRET) {
      if (body.action === "daily_summary") return response(await dispatchAdminDailySummary(body));
      return response(await dispatch(body));
    }

    const audience = body.audience === "customer" ? "customer" : "admin";
    const userId = audience === "customer" ? await requireUser(req) : await requireStaff(req);
    const subscriptionTable = audience === "customer" ? "portal_push_subscriptions" : "admin_push_subscriptions";
    const action = String(body.action || "subscribe");
    if (action === "unsubscribe") {
      const endpoint = String(body.endpoint || "");
      if (endpoint) {
        await rest(`${subscriptionTable}?user_id=eq.${encodeURIComponent(userId)}&endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" });
      }
      return response({ ok: true, subscribed: false });
    }

    const subscription = (body.subscription && typeof body.subscription === "object" ? body.subscription : {}) as Json;
    const keys = (subscription.keys && typeof subscription.keys === "object" ? subscription.keys : {}) as Json;
    const endpoint = String(subscription.endpoint || "");
    const p256dh = String(keys.p256dh || "");
    const auth = String(keys.auth || "");
    if (!endpoint.startsWith("https://") || !p256dh || !auth) throw new Error("Neplatný push odber.");

    const saved = await rest(`${subscriptionTable}?on_conflict=endpoint`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        active: true,
        user_agent: String(req.headers.get("user-agent") || "").slice(0, 500),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    return response({ ok: true, subscribed: true, id: Array.isArray(saved) ? saved[0]?.id : null });
  } catch (error) {
    console.error(error);
    return response({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
