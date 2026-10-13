
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PIXEL_ID = Deno.env.get("META_PIXEL_ID") || "1592305991362085";
const API_VERSION = Deno.env.get("META_GRAPH_API_VERSION") || "v23.0";

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

async function requireStaff(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) throw new Error("Najprv sa prihláste.");

  const auth = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: authorization },
  });
  if (!auth.ok) throw new Error("Prihlásenie vypršalo.");
  const user = await auth.json();

  const rows = await rest(
    `staff?user_id=eq.${encodeURIComponent(String(user.id))}&active=eq.true&select=user_id&limit=1`,
  );
  if (!Array.isArray(rows) || !rows.length) throw new Error("Nemáte oprávnenie.");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00421")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 10) digits = "421" + digits.slice(1);
  if (!digits.startsWith("421") && digits.length === 9) digits = "421" + digits;
  return digits;
}

function eventNameForStage(stage: string) {
  if (stage === "qualified") return "QualifiedLead";
  if (stage === "converted") return "ConvertedLead";
  throw new Error("Neplatná CRM fáza.");
}

async function upsertLog(
  submissionId: number,
  eventName: string,
  eventId: string,
  status: "sent" | "skipped" | "failed",
  payload: Json,
) {
  await rest("meta_crm_event_log?on_conflict=submission_id,event_name", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      submission_id: submissionId,
      event_name: eventName,
      event_id: eventId,
      status,
      response: payload,
      updated_at: new Date().toISOString(),
    }),
  });
}

// Shared immediate delivery: same validation, marketing-consent and event ID
// for admin actions and authenticated automatic retries.
async function sendCrmStage(body: Json): Promise<Response> {
    const submissionId = Number(body.submission_id);
    const stage = String(body.stage || "");
    if (!Number.isInteger(submissionId) || submissionId <= 0) throw new Error("Chýba submission_id.");

    const eventName = eventNameForStage(stage);
    let eventId = `crm-${eventName.toLowerCase()}-${submissionId}`;

    const existing = await rest(
      `meta_crm_event_log?submission_id=eq.${submissionId}&event_name=eq.${encodeURIComponent(eventName)}&status=in.(sent,skipped)&select=id,status,event_id&limit=1`,
    );
    if (Array.isArray(existing) && existing.length) {
      return response({ ok: true, duplicate: true, status: existing[0].status, event_id: existing[0].event_id });
    }

    const rows = await rest(
      `web_form_submissions?id=eq.${submissionId}&select=id,form_type,owner_name,phone,email,source_ref,raw_payload,created_at&limit=1`,
    );
    if (!Array.isArray(rows) || !rows.length) throw new Error("Pôvodný webový formulár sa nenašiel.");

    const submission = rows[0] as Json;
    const raw = (submission.raw_payload && typeof submission.raw_payload === "object"
      ? submission.raw_payload
      : {}) as Json;


    // v5: one conversion per identical owner and stage, across forms.
    const same = (a:Json,b:Json) =>
      normalizePhone(a.phone).length>=10 && normalizePhone(a.phone)===normalizePhone(b.phone) &&
      ((a.email && b.email && String(a.email).trim().toLowerCase()===String(b.email).trim().toLowerCase()) ||
      ((!a.email || !b.email) && String(a.owner_name||"").trim().toLowerCase()===String(b.owner_name||"").trim().toLowerCase()));
    const rows=await rest(`web_form_submissions?phone=eq.${encodeURIComponent(String(submission.phone))}&select=id,phone,owner_name,email,created_at&order=created_at.asc&limit=100`);
    const linked=Array.isArray(rows)?rows.filter((a:Json)=>same(a,submission)):[submission];
    if(!linked.some(a=>Number(a.id)===submissionId))linked.push(submission);
    linked.sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")));
    eventId=`crm-${eventName.toLowerCase()}-${linked[0].id}`;
    if(linked.length>1){
      const prev=await rest(`meta_crm_event_log?submission_id=in.(${linked.map(a=>a.id).join(",")})&event_name=eq.${encodeURIComponent(eventName)}&status=eq.sent&select=event_id&limit=1`);
      if(Array.isArray(prev)&&prev.length)return response({ok:true,duplicate:true,linked:true,event_id:prev[0].event_id});
    }
    if (raw.marketing_consent !== true) {
      await upsertLog(submissionId, eventName, eventId, "skipped", { reason: "no_marketing_consent" });
      return response({ ok: true, skipped: "no_marketing_consent" });
    }

    const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");
    if (!token) throw new Error("META_CAPI_ACCESS_TOKEN chýba.");

    const userData: Json = {};
    const phone = normalizePhone(submission.phone);
    if (phone) userData.ph = [await sha256Hex(phone)];

    const email = String(submission.email || "").trim().toLowerCase();
    if (email) userData.em = [await sha256Hex(email)];

    const fbp = String(raw.meta_fbp || "").trim();
    const fbc = String(raw.meta_fbc || "").trim();
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const originalIp = String(raw.meta_client_ip || "").trim();
    const originalUa = String(raw.meta_user_agent || "").trim();
    if (originalIp) userData.client_ip_address = originalIp;
    if (originalUa) userData.client_user_agent = originalUa;

    const sourceRef = String(submission.source_ref || "/");
    const sourceUrl = sourceRef.startsWith("http")
      ? sourceRef
      : `https://chvostikovo.sk${sourceRef.startsWith("/") ? sourceRef : "/" + sourceRef}`;

    const metaBody: Json = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "system_generated",
          event_source_url: sourceUrl,
          user_data: userData,
          custom_data: {
            lead_event_source: "Chvostikovo CRM",
            event_source: "crm",
            funnel_stage: stage === "qualified" ? "intro_visit_created" : "became_client",
          },
        },
      ],
    };

    const testEventCode = Deno.env.get("META_CAPI_TEST_EVENT_CODE");
    if (testEventCode) metaBody.test_event_code = testEventCode;

    const metaRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaBody),
      },
    );

    const metaText = await metaRes.text();
    let metaJson: Json = {};
    try {
      metaJson = metaText ? JSON.parse(metaText) : {};
    } catch {
      metaJson = { raw: metaText };
    }

    if (!metaRes.ok) {
      await upsertLog(submissionId, eventName, eventId, "failed", {
        http_status: metaRes.status,
        meta: metaJson,
      });
      throw new Error(`Meta CAPI ${metaRes.status}`);
    }

    await upsertLog(submissionId, eventName, eventId, "sent", metaJson);
    console.info("Meta CRM CAPI accepted event", {
      submission_id: submissionId,
      event_name: eventName,
      event_id: eventId,
      events_received: metaJson.events_received ?? null,
    });

    return response({ ok: true, event_name: eventName, event_id: eventId, meta: metaJson });
}

async function retryUndeliveredCrm() {
  // Sources of truth are real admin CRM transitions, not website CTA events.
  const since = encodeURIComponent(new Date(Date.now() - 90*24*60*60*1000).toISOString());
  const [visits, converted, logs] = await Promise.all([
    rest(`intro_visits?source_submission_id=not.is.null&created_at=gte.${since}&select=source_submission_id,created_at&order=created_at.asc&limit=500`),
    rest(`web_form_submissions?status=eq.converted&converted_dog_id=not.is.null&created_at=gte.${since}&select=id,created_at&order=created_at.asc&limit=500`),
    rest("meta_crm_event_log?select=submission_id,event_name,status&limit=5000"),
  ]);
  const completed = new Set((Array.isArray(logs)?logs:[])
    .filter(x=>x.status==="sent"||x.status==="skipped")
    .map(x=>String(x.submission_id)+"|"+String(x.event_name)));
  const candidates = new Map<string,{submission_id:number,stage:string}>();
  for(const item of Array.isArray(visits)?visits:[]) {
    const id=Number(item.source_submission_id);
    if(Number.isSafeInteger(id)&&id>0&&!completed.has(id+"|QualifiedLead"))
      candidates.set(id+"|QualifiedLead",{submission_id:id,stage:"qualified"});
  }
  for(const item of Array.isArray(converted)?converted:[]) {
    const id=Number(item.id);
    if(Number.isSafeInteger(id)&&id>0&&!completed.has(id+"|ConvertedLead"))
      candidates.set(id+"|ConvertedLead",{submission_id:id,stage:"converted"});
  }
  let sent=0,skipped=0,failed=0;
  // Keep runs bounded so a transient Meta outage cannot exhaust Edge resources.
  for(const item of Array.from(candidates.values()).slice(0,25)) {
    try {
      const result=await sendCrmStage(item);
      const body=await result.json().catch(()=>({}));
      if(result.ok && body?.ok===true) {
        if(body.skipped || body.duplicate) skipped++; else sent++;
      } else { failed++; }
    } catch(e) {
      failed++;
      console.error("Meta CRM retry failed",item.submission_id,item.stage,String(e).slice(0,170));
    }
  }
  return {ok:true,pending:candidates.size,sent,skipped,failed};
}

Deno.serve(async(req: Request) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:CORS});
  if(req.method!=="POST") return response({error:"Method not allowed"},405);
  if(!SUPABASE_URL || !SERVICE_KEY) return response({error:"Server configuration missing"},500);
  try {
    const cronSecret=req.headers.get("x-chv-marketing-cron");
    if(cronSecret) {
      const authorized=await rest("rpc/verify_chv_marketing_cron_secret",{
        method:"POST",body:JSON.stringify({p_secret:cronSecret}),
      });
      if(authorized!==true) return response({error:"Not authorized"},403);
      return response(await retryUndeliveredCrm());
    }
    // Gateway JWT verification is disabled to support pg_cron; verify a
    // real Supabase Auth session and active staff record on every manual call.
    await requireStaff(req);
    const body=(await req.json().catch(()=>({}))) as Json;
    return await sendCrmStage(body);
  } catch(error) {
    console.error("Meta CRM event failed",error);
    return response({error:error instanceof Error?error.message:String(error)},400);
  }
});
