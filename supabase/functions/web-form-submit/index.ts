// Deno and EdgeRuntime are supplied by the Supabase Edge runtime.

const ALLOWED_ORIGINS = new Set([
  'https://chvostikovo.sk',
  'https://www.chvostikovo.sk',
  'https://chvostikovopsiaskolka.github.io',
]);

const LEAD_INTERESTS = new Set([
  'Chcem sa dozvedieť viac o psej škôlke',
  'Mám záujem o pravidelné návštevy',
  'Potrebujem škôlku občas',
  'Potrebujem jednorazové stráženie',
  'Informačný formulár – záujem o psiu škôlku',
  'Mám záujem o škôlku pre šteniatko',
]);

const EN_LEAD_INTERESTS = new Set([
  'Regular daycare visits',
  'Occasional daycare',
  'One-off daytime care',
  'I just want more information',
]);

const APPLICATION_USAGE = new Set([
  'Pravidelne – 1 až 2× týždenne',
  'Pravidelne – 1× alebo viackrát týždenne',
  'Občas podľa potreby',
  'Jednorazové stráženie',
]);

function response(origin: string, status: number, body: Record<string, unknown>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  if (ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

function text(value: unknown, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function sex(value: unknown) {
  const v = text(value, 20).toLocaleLowerCase('sk');
  if (v === 'pes' || v === 'male') return 'male';
  if (v === 'fenka' || v === 'suka' || v === 'female') return 'female';
  return null;
}

function yesNo(value: unknown) {
  if (value === true || value === false) return value;
  const v = text(value, 10).toLocaleLowerCase('sk');
  if (v === 'áno' || v === 'ano' || v === 'true') return true;
  if (v === 'nie' || v === 'false') return false;
  return null;
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function normalizePhoneForMeta(value: unknown) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00421')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 10) digits = '421' + digits.slice(1);
  if (!digits.startsWith('421') && digits.length === 9) digits = '421' + digits;
  return digits;
}

function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
}

async function sendMetaConversion(
  payload: Record<string, unknown>,
  input: Record<string, unknown>,
  req: Request,
) {
  if (input.marketing_consent !== true) return;

  const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');
  if (!accessToken) {
    console.info('META_CAPI_ACCESS_TOKEN is missing; skipping Meta CAPI');
    return;
  }

  const eventId = text(input.meta_event_id, 200);
  if (!eventId) {
    console.warn('Meta CAPI skipped: missing meta_event_id');
    return;
  }

  const pixelId = Deno.env.get('META_PIXEL_ID') || '1592305991362085';
  const apiVersion = Deno.env.get('META_GRAPH_API_VERSION') || 'v23.0';
  const normalizedPhone = normalizePhoneForMeta(payload.phone);
  if (!normalizedPhone) {
    console.warn('Meta CAPI skipped: phone normalization failed');
    return;
  }

  const userData: Record<string, unknown> = {
    ph: [await sha256Hex(normalizedPhone)],
    client_user_agent: req.headers.get('user-agent') || '',
  };

  const ip = clientIp(req);
  if (ip) userData.client_ip_address = ip;

  const fbp = text(input.meta_fbp, 300);
  const fbc = text(input.meta_fbc, 500);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const sourceRef = text(payload.source_ref || '/', 500);
  const eventSourceUrl = sourceRef.startsWith('http')
    ? sourceRef
    : `https://chvostikovo.sk${sourceRef.startsWith('/') ? sourceRef : `/${sourceRef}`}`;

  const eventName = payload.form_type === 'application'
    ? 'CompleteRegistration'
    : 'Lead';

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: eventSourceUrl,
        user_data: userData,
        custom_data: {
          content_name: payload.form_type === 'application' ? 'prihlaska' : 'informacie',
          source: text(input.cta_source || '', 200),
        },
      },
    ],
  };

  const testEventCode = Deno.env.get('META_CAPI_TEST_EVENT_CODE');
  if (testEventCode) body.test_event_code = testEventCode;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`Meta CAPI failed [${res.status}]: ${await res.text()}`);
      return;
    }

    const result = await res.json();
    console.info('Meta CAPI accepted event', {
      event_name: eventName,
      event_id: eventId,
      events_received: result?.events_received ?? null,
    });
  } catch (error) {
    console.error('Meta CAPI request failed:', error);
  }
}

async function sendNotificationEmail(payload: Record<string, unknown>, input: Record<string, unknown>) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing');
    return;
  }

  const isApplication = payload.form_type === 'application';
  const isEnglishLead = !isApplication && String(payload.interest_reason ?? '').startsWith('EN ·');

  const subject = isApplication
    ? 'Nová prihláška do škôlky (web)'
    : isEnglishLead
      ? 'Nový záujem o škôlku EN (web)'
      : 'Nový záujem o škôlku (web)';

  const lines: string[] = [];

  lines.push(`Meno majiteľa: ${String(payload.owner_name ?? '')}`);
  lines.push(`Telefón: ${String(payload.phone ?? '')}`);
  if (!isApplication && payload.email) lines.push(`E-mail: ${String(payload.email)}`);

  if (isApplication) {
    lines.push(`Meno psa: ${String(payload.dog_name ?? '')}`);
    lines.push(`Plemeno psa: ${String(payload.dog_breed ?? '')}`);
    lines.push(`Váha psa: ${payload.dog_weight_kg == null ? 'neuvedené' : `${payload.dog_weight_kg} kg`}`);
    lines.push(`Pohlavie psa: ${(payload.dog_sex === 'male' ? 'Pes' : payload.dog_sex === 'female' ? 'Suka' : '—')}`);
    lines.push(`Vek psa: ${String(payload.dog_age_text ?? '')}`);
    lines.push(
      `Kastrovaný / sterilizovaná: ${
        payload.dog_neutered === true ? 'Áno' : 'Nie'
      }`,
    );
    lines.push(
      `Ako plánujete využívať škôlku?: ${String(
        payload.interest_reason ?? '',
      )}`,
    );
    if (payload.dog_allergies != null || payload.dog_temperament != null) {
      lines.push(`Alergie a zdravotné obmedzenia: ${String(payload.dog_allergies ?? '')}`);
      lines.push(`Povaha a ďalšie informácie: ${String(payload.dog_temperament ?? '')}`);
    } else {
      lines.push(`Viac o psíkovi: ${String(payload.dog_info ?? '')}`);
    }
    const dogs = (payload.raw_payload as { dogs?: Record<string, unknown>[] } | undefined)?.dogs;
    if (Array.isArray(dogs) && dogs.length === 2) {
      const dog = dogs[1];
      lines.push('');
      lines.push('--- 2. PSÍK (rovnaký majiteľ) ---');
      lines.push('Meno: ' + String(dog.dog_name ?? ''));
      lines.push('Plemeno: ' + String(dog.dog_breed ?? ''));
      lines.push('Váha: ' + String(dog.dog_weight_kg ?? '') + ' kg');
      lines.push('Pohlavie: ' + (dog.dog_sex === 'male' ? 'Pes' : 'Suka'));
      lines.push('Vek: ' + String(dog.dog_age_text ?? ''));
      lines.push('Kastrovaný / sterilizovaná: ' + (dog.dog_neutered === true ? 'Áno' : 'Nie'));
      lines.push('Alergie a zdravotné obmedzenia: ' + String(dog.dog_allergies ?? ''));
      lines.push('Povaha a ďalšie informácie: ' + String(dog.dog_temperament ?? ''));
    }

  } else {
    if (payload.dog_name) lines.push(`Meno psa: ${String(payload.dog_name)}`);
    lines.push(
      `O čo máte záujem?: ${String(payload.interest_reason ?? '')}`,
    );
  }

  lines.push('Súhlas so spracovaním osobných údajov: Áno');

  const formPage = String(payload.source_ref ?? '/');
  const trafficSource = text(input.traffic_source || '', 200);
  const trafficMedium = text(input.traffic_medium || '', 200);
  const landingPage = text(input.landing_page || '', 500);
  const campaign = text(input.utm_campaign || '', 300);
  const referrer = text(input.referrer || '', 1000);
  const ctaSource = text(input.cta_source || '', 200);

  lines.push('');
  lines.push('--- Zdroj návštevy ---');
  lines.push(`Stránka formulára: ${formPage}`);
  lines.push(`Zdroj návštevy: ${trafficSource || 'neuvedené'}`);
  lines.push(`Typ návštevy: ${trafficMedium || 'neuvedené'}`);
  if (ctaSource) lines.push(`CTA: ${ctaSource}`);
  if (landingPage) lines.push(`Prvá vstupná stránka: ${landingPage}`);
  if (campaign) lines.push(`Kampaň: ${campaign}`);
  if (referrer) lines.push(`Referrer: ${referrer}`);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:
          Deno.env.get('NOTIFY_FROM') ??
          'Chvostíkovo web <onboarding@resend.dev>',
        to: [
          Deno.env.get('NOTIFY_TO') ??
            'chvostikovo.psiaskolka@gmail.com',
        ],
        subject,
        text: lines.join('\n'),
      }),
    });

    if (!res.ok) {
      console.error(
        `Resend failed [${res.status}]: ${await res.text()}`,
      );
    }
  } catch (error) {
    console.error('Email notification failed:', error);
  }
}

async function sendPhoneCorrectionEmail(submissionId: number, phone: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('NOTIFY_FROM') ?? 'Chvostíkovo web <onboarding@resend.dev>',
        to: [Deno.env.get('NOTIFY_TO') ?? 'chvostikovo.psiaskolka@gmail.com'],
        subject: `Opravený telefón pri formulári #${submissionId}`,
        text: `Zákazník opravil telefón pri pôvodnom formulári #${submissionId}. Nové číslo: ${phone}. Nevytvárať ďalší lead. Ak bola SMS už odoslaná, ďalšia sa neposiela.`,
      }),
    });
    if (!res.ok) console.error('Lead correction email failed:', res.status);
  } catch (error) {
    console.error('Lead correction email unavailable:', error);
  }
}

async function notifyWebFormSms(submissionId: number) {
  let timeout;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const configRes = await fetch(supabaseUrl + '/rest/v1/rpc/get_web_form_sms_bridge_config', {
      method:'POST', headers:{apikey:serviceKey || '', Authorization:'Bearer ' + serviceKey, 'Content-Type':'application/json'},
      body:'{}', signal:AbortSignal.timeout(5000),
    });
    if (!configRes.ok) throw new Error('bridge config unavailable');
    const config = await configRes.json();
    if (!config) return;
    const {url,secret} = config;
    if (url !== 'https://script.google.com/macros/s/AKfycbyL32_wfNaM29Nnj2VCvCF1NfFkOd0LCtZ1EIHUD7c5BS2pcO6BAC2PqdPSYlle87eKaw/exec' || !secret) {
      throw new Error('invalid bridge configuration');
    }
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'web_form_sms', secret, submission_id:submissionId}),
      signal:controller.signal,
    });
    if (!res.ok) throw new Error('webhook HTTP error');
    const result = await res.json();
    if (result.ok !== true || result.disabled === true) throw new Error('webhook inactive/failed');
  } catch (_) {
    console.error('Web SMS webhook unavailable; outbox fallback will retry.');
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

// Recovery is operational contact storage, separate from analytics and conversions.
async function saveFormRecoveryV273(input: Record<string, unknown>, payload: Record<string, unknown> | null, stage: string): Promise<boolean> {
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const kind=payload?.form_type??input.form_type;if(!['lead','application'].includes(String(kind)))return false;
  const name=text(payload?.owner_name ?? input.owner_name,160),phone=text(payload?.phone ?? input.phone,40);
  if(!url||!key||input.consent!==true||!name||!/^\+[1-9]\d{6,14}$/.test(phone))return false;
  const id=String(input.form_attempt_id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return false;
  const dogs=Array.isArray((payload?.raw_payload as Record<string,unknown>)?.dogs)?(payload!.raw_payload as Record<string,unknown>).dogs as Array<Record<string,unknown>>:[];
  const clean=payload?Object.fromEntries(Object.entries(payload).filter(([k])=>!['raw_payload','status','source'].includes(k))):{};
  if(dogs.length)clean.dogs=dogs;
  const row={attempt_id:id,form_type:kind==='application'?'application':'lead',owner_name:name,phone,
    email:text(input.email,254)||null,dog_names:text(dogs.map(d=>text(d.dog_name,160)).join(' a ')||input.dog_name,330),
    interest_reason:text(payload?.interest_reason??input.interest_reason,300),source_ref:text(input.source_ref||'/',500),error_stage:stage,
    recovery_payload:clean};
  if(input.action==='recover_contact')try{
    const exists=await fetch(url+'/rest/v1/web_form_submissions?raw_payload->>form_attempt_id=eq.'+encodeURIComponent(id)+'&select=id&limit=1',{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(3000)});
    if(exists.ok&&(await exists.json()).length)return true;
  }catch{}
  try{const r=await fetch(url+'/rest/v1/web_form_recoveries_v273?on_conflict=attempt_id',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(row),signal:AbortSignal.timeout(4000)});return r.ok}catch{return false}
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false });
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') return response(origin, 405, { ok: false, error: 'method_not_allowed' });
  if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false, error: 'origin_not_allowed' });

  let recoveryInputV273: Record<string,unknown>|null=null;
  let recoverySavedV273=false;
  try {
    const raw = await req.text();
    // Two 3000-character fields plus compatibility summary and raw form labels.
    if (!raw || raw.length > 32_000) return response(origin, 400, { ok: false, error: 'invalid_body' });
    const input = JSON.parse(raw);

    if(input.action==='recover_contact'){
      if(input.dry_run===true)return response(origin,200,{ok:true,dry_run:true});
      const saved=await saveFormRecoveryV273(input,null,'client_failure');
      return response(origin,saved?202:503,{ok:saved,recovery_saved:saved});
    }

    if (input.action === 'correct_lead_phone') {
      const submissionId = Number(input.submission_id);
      const editToken = text(input.edit_token, 100);
      const updatedPhone = text(input.phone, 40);
      if (!Number.isSafeInteger(submissionId) || submissionId <= 0 ||
          !/^[0-9a-f-]{36}\.[0-9a-f-]{36}$/.test(editToken) ||
          !/^\+[1-9]\d{6,14}$/.test(updatedPhone)) {
        return response(origin, 400, { ok: false, error: 'invalid_phone_correction' });
      }
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase environment');
      const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/correct_web_lead_phone_once`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_submission_id: submissionId,
          p_token_hash: await sha256Hex(editToken),
          p_new_phone: updatedPhone,
        }),
      });
      if (!rpc.ok) throw new Error(`Phone correction RPC failed: ${rpc.status}`);
      const result = await rpc.json();
      if (result?.ok !== true) return response(origin, 403, { ok: false, error: 'correction_expired' });
      EdgeRuntime.waitUntil(sendPhoneCorrectionEmail(submissionId, updatedPhone));
      return response(origin, 200, { ok: true, sms_queued: result.sms_queued === true });
    }

    // Hidden honeypot field: bots receive a harmless success without storing data.
    if (text(input.company || input.website, 200)) return response(origin, 200, { ok: true });

    const formType = text(input.form_type || input.formType, 20);
    const ownerName = text(input.owner_name ?? input.meno, 160);
    const phone = text(input.phone ?? input.telefon, 40);
    const rawEmail = formType === 'lead' ? String(input.email ?? '').trim() : '';
    if (rawEmail.length > 254 || (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail))) {
      return response(origin, 400, { ok: false, error: 'invalid_email' });
    }
    const leadEmail = rawEmail.toLowerCase();
    const consent = input.consent === true || text(input.consent, 10).toLowerCase() === 'true';
    if (!['lead', 'application'].includes(formType)) return response(origin, 400, { ok: false, error: 'invalid_form_type' });
    if (!ownerName || !/^\+\d{7,15}$/.test(phone) || !consent) return response(origin, 400, { ok: false, error: 'missing_required_fields' });

    const marketingConsent = input.marketing_consent === true;
    const phoneEditToken = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const phoneEditHash = phoneEditToken ? await sha256Hex(phoneEditToken) : '';
    const storedRawPayload = marketingConsent
      ? {
          ...input,
          meta_client_ip: clientIp(req),
          meta_user_agent: text(req.headers.get('user-agent') || '', 500),
        }
      : input;

    let payload: Record<string, unknown> = {
      form_type: formType,
      status: 'new',
      owner_name: ownerName,
      phone,
      ...(formType === 'lead' && leadEmail ? { email: leadEmail } : {}),
      consent: true,
      source: 'chvostikovo.sk',
      source_ref: text(input.source_ref || '/', 500),
      raw_payload: phoneEditHash
        ? { ...storedRawPayload, _phone_edit_hash: phoneEditHash }
        : storedRawPayload,
    };

    if (formType === 'lead') {
      const rawInterest = text(input.interest_reason ?? input.zaujem, 250);
      const enPrefix = 'EN – Dog daycare enquiry | ';

      if (rawInterest.startsWith(enPrefix)) {
        const details = rawInterest.slice(enPrefix.length);
        const dogSeparator = ' | Dog: ';
        const separatorIndex = details.indexOf(dogSeparator);
        const choice = separatorIndex >= 0 ? details.slice(0, separatorIndex) : details;
        const dogName = separatorIndex >= 0 ? text(details.slice(separatorIndex + dogSeparator.length), 160) : '';

        if (!EN_LEAD_INTERESTS.has(choice)) return response(origin, 400, { ok: false, error: 'invalid_interest' });
        payload = {
          ...payload,
          interest_reason: `EN · ${choice}`,
          ...(dogName ? { dog_name: dogName } : {}),
        };
      } else {
        if (!LEAD_INTERESTS.has(rawInterest)) return response(origin, 400, { ok: false, error: 'invalid_interest' });
        payload = { ...payload, interest_reason: rawInterest };
      }
    } else {
      const dogName = text(input.dog_name ?? input.pes, 160);
      const dogSex = sex(input.dog_sex ?? input.pohlavie);
      const dogAge = text(input.dog_age_text ?? input.vek, 80);
      let dogBreed = text(input.dog_breed ?? input.plemeno ?? input.dog_breed_weight, 200);
      let dogWeight: number | null = null;
      if (input.dog_weight_kg != null) {
        const rawWeight = String(input.dog_weight_kg).trim().replace(/\s*kg\s*$/i, '').trim();
        if (!/^\d+(?:[.,]\d+)?$/.test(rawWeight)) return response(origin, 400, { ok: false, error: 'invalid_dog_weight' });
        dogWeight = Number(rawWeight.replace(',', '.'));
        if (!Number.isFinite(dogWeight) || dogWeight <= 0 || dogWeight > 150) return response(origin, 400, { ok: false, error: 'invalid_dog_weight' });
      } else if (input.dog_breed_weight != null) {
        // Older open browser tabs still submit the former combined field.
        const legacy = dogBreed.match(/^(.*?)(\d+(?:[.,]\d+)?)\s*kg\s*$/i);
        const weight = legacy ? Number(legacy[2].replace(',', '.')) : NaN;
        if (legacy && weight > 0 && weight <= 150) {
          dogBreed = legacy[1].replace(/[\s,;|\/-]+$/, '').replace(/\s+cca\.?$/i, '').replace(/[\s,;|\/-]+$/, '').trim();
          dogWeight = weight;
        }
      }
      const dogNeutered = yesNo(input.dog_neutered ?? input.kastrovana);
      const usage = text(input.interest_reason ?? input.usage_plan ?? input.duvod, 250);
      const splitCare = input.dog_allergies != null || input.dog_temperament != null || input.alergie != null || input.povaha != null;
      const allergiesInput = input.dog_allergies ?? input.alergie ?? '';
      const temperamentInput = input.dog_temperament ?? input.povaha;
      if (splitCare && (typeof allergiesInput !== 'string' || typeof temperamentInput !== 'string' || !temperamentInput.trim() || allergiesInput.trim().length > 3000 || temperamentInput.trim().length > 3000)) {
        return response(origin, 400, { ok: false, error: 'invalid_dog_care_fields' });
      }
      const dogAllergies = splitCare ? text(allergiesInput, 3000) : null;
      const dogTemperament = splitCare ? text(temperamentInput, 3000) : null;
      const dogInfo = splitCare
        ? `Alergie a zdravotné obmedzenia: ${dogAllergies}\n\nPovaha a ďalšie informácie: ${dogTemperament}`
        : text(input.dog_info ?? input.viac, 3000);
      if (!dogName || !dogSex || !dogAge || dogNeutered === null || !APPLICATION_USAGE.has(usage) || !dogInfo) {
        return response(origin, 400, { ok: false, error: 'missing_application_fields' });
      }
      const dogCount = Number(input.dog_count ?? input.dogCount ?? 1);
      if (dogCount !== 1 && dogCount !== 2) return response(origin, 400, { ok: false, error: 'invalid_dog_count' });
      let extraDog: Record<string, unknown> | null = null;
      if (dogCount === 2) {
        if (!Array.isArray(input.dogs) || input.dogs.length !== 2 ||
            !input.dogs[1] || typeof input.dogs[1] !== 'object' || Array.isArray(input.dogs[1])) {
          return response(origin, 400, { ok: false, error: 'missing_second_dog' });
        }
        const second = input.dogs[1] as Record<string, unknown>;
        const secondName = text(second.dog_name, 160), secondBreed = text(second.dog_breed, 200);
        const secondAge = text(second.dog_age_text, 80), secondSex = sex(second.dog_sex);
        const secondNeutered = yesNo(second.dog_neutered), secondUsage = usage;
        const secondAllergies = second.dog_allergies ?? '', secondTemperament = second.dog_temperament;
        const rawWeight = String(second.dog_weight_kg ?? '').trim().replace(/\s*kg\s*$/i, '').trim();
        const secondWeight = Number(rawWeight.replace(',', '.'));
        if (!secondName || !secondBreed || !secondAge || !secondSex || secondNeutered === null ||
            !APPLICATION_USAGE.has(secondUsage) || typeof secondAllergies !== 'string' ||
            typeof secondTemperament !== 'string' || !secondTemperament.trim() ||
            secondAllergies.length > 3000 || secondTemperament.length > 3000 ||
            !/^\d+(?:[.,]\d+)?$/.test(rawWeight) || !Number.isFinite(secondWeight) ||
            secondWeight <= 0 || secondWeight > 150) {
          return response(origin, 400, { ok: false, error: 'invalid_second_dog' });
        }
        extraDog = { dog_name: secondName, dog_breed: secondBreed, dog_weight_kg: secondWeight,
          dog_sex: secondSex, dog_age_text: secondAge, dog_neutered: secondNeutered,
          interest_reason: secondUsage, dog_allergies: text(secondAllergies, 3000),
          dog_temperament: text(secondTemperament, 3000) };
      }
      const applicationDogs = [{
        dog_name: dogName, dog_breed: dogBreed || null, dog_weight_kg: dogWeight,
        dog_sex: dogSex, dog_age_text: dogAge, dog_neutered: dogNeutered,
        interest_reason: usage, dog_allergies: dogAllergies || '',
        dog_temperament: dogTemperament || dogInfo,
      }, ...(extraDog ? [extraDog] : [])];
      // One submitted form = one stored lead, one SMS, one marketing conversion.
      // Database stores separate dog rows transactionally via existing trigger.
      payload.raw_payload = { ...storedRawPayload, dog_count: dogCount, dogs: applicationDogs };
      payload = {
        ...payload,
        dog_name: dogName,
        dog_sex: dogSex,
        dog_age_text: dogAge,
        dog_breed: dogBreed || null,
        dog_weight_kg: dogWeight,
        dog_neutered: dogNeutered,
        interest_reason: usage,
        dog_info: dogInfo,
        dog_allergies: dogAllergies,
        dog_temperament: dogTemperament,
      };
    }

    if (input.dry_run === true) return response(origin, 200, { ok: true, dry_run: true, form_type: formType });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase environment');
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    input.form_attempt_id=/^[0-9a-f-]{36}$/i.test(String(input.form_attempt_id||''))?input.form_attempt_id:crypto.randomUUID();
    recoveryInputV273=input;
    recoverySavedV273=await saveFormRecoveryV273(input,payload,'received');
    const since = new Date(Date.now() - 30_000).toISOString();
    const duplicate = await fetch(
      `${supabaseUrl}/rest/v1/web_form_submissions?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
      { headers, cache: 'no-store' },
    );
    if (!duplicate.ok) throw new Error(`Duplicate check failed: ${duplicate.status}`);
    if ((await duplicate.json()).length) return response(origin, 429, { ok: false, error: 'please_wait' });

    const insert = await fetch(`${supabaseUrl}/rest/v1/web_form_submissions`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    });
    if (!insert.ok) throw new Error(`Insert failed: ${insert.status} ${await insert.text()}`);
    // Trigger has persisted the SMS outbox in the same successful INSERT transaction.
    // Failure here must never turn a saved form into an error response.
    let savedSubmissionId: number | null = null;
    try {
      const saved = await insert.json();
      const submissionId = Number(saved?.[0]?.id);
      if (Number.isSafeInteger(submissionId) && submissionId > 0) {
        savedSubmissionId = submissionId;
        EdgeRuntime.waitUntil(notifyWebFormSms(submissionId));
      }
    } catch (_) {
      console.error('Web SMS dispatch could not start; saved outbox will retry.');
    }


    await Promise.allSettled([
      sendNotificationEmail(payload, input),
      // Internal QA submissions must not become paid-ad conversions.
      input.traffic_source === 'qa' || /[?&]utm_source=qa(?:&|$)/.test(String(input.source_ref || ''))
        ? Promise.resolve()
        : sendMetaConversion(payload, input, req),
    ]);

    return response(origin, 201, {
      ok: true,
      ...(savedSubmissionId && phoneEditToken
        ? { submission_id: savedSubmissionId, phone_edit_token: phoneEditToken }
        : {}),
    });
  } catch (error) {
    console.error(error);
    if(recoveryInputV273&&recoverySavedV273){
      const u=Deno.env.get('SUPABASE_URL'),k=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      try{await fetch(`${u}/rest/v1/web_form_recoveries_v273?attempt_id=eq.${recoveryInputV273.form_attempt_id}`,{method:'PATCH',headers:{apikey:k!,Authorization:`Bearer ${k}`,'Content-Type':'application/json'},body:JSON.stringify({error_stage:'server_error'})})}catch{}
    }
    return response(origin, 500, { ok: false, error: 'server_error', recovery_saved:recoverySavedV273 });
  }
});
