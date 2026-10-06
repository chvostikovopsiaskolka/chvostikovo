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

  if (isApplication) {
    lines.push(`Meno psa: ${String(payload.dog_name ?? '')}`);
    lines.push(`Plemeno a váha psa: ${String(payload.dog_breed ?? '')}`);
    lines.push(`Pohlavie psa: ${String(payload.dog_sex ?? '')}`);
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
    lines.push(`Viac o psíkovi: ${String(payload.dog_info ?? '')}`);
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

  try {
    const raw = await req.text();
    if (!raw || raw.length > 12_000) return response(origin, 400, { ok: false, error: 'invalid_body' });
    const input = JSON.parse(raw);

    // Hidden honeypot field: bots receive a harmless success without storing data.
    if (text(input.company || input.website, 200)) return response(origin, 200, { ok: true });

    const formType = text(input.form_type || input.formType, 20);
    const ownerName = text(input.owner_name ?? input.meno, 160);
    const phone = text(input.phone ?? input.telefon, 40);
    const consent = input.consent === true || text(input.consent, 10).toLowerCase() === 'true';
    if (!['lead', 'application'].includes(formType)) return response(origin, 400, { ok: false, error: 'invalid_form_type' });
    if (!ownerName || !/^\+\d{7,15}$/.test(phone) || !consent) return response(origin, 400, { ok: false, error: 'missing_required_fields' });

    const marketingConsent = input.marketing_consent === true;
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
      consent: true,
      source: 'chvostikovo.sk',
      source_ref: text(input.source_ref || '/', 500),
      raw_payload: storedRawPayload,
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
      const dogBreed = text(input.dog_breed_weight ?? input.dog_breed ?? input.plemeno, 200);
      const dogNeutered = yesNo(input.dog_neutered ?? input.kastrovana);
      const usage = text(input.interest_reason ?? input.usage_plan ?? input.duvod, 250);
      const dogInfo = text(input.dog_info ?? input.viac, 3000);
      if (!dogName || !dogSex || !dogAge || dogNeutered === null || !APPLICATION_USAGE.has(usage) || !dogInfo) {
        return response(origin, 400, { ok: false, error: 'missing_application_fields' });
      }
      payload = {
        ...payload,
        dog_name: dogName,
        dog_sex: dogSex,
        dog_age_text: dogAge,
        dog_breed: dogBreed || null,
        dog_neutered: dogNeutered,
        interest_reason: usage,
        dog_info: dogInfo,
      };
    }

    if (input.dry_run === true) return response(origin, 200, { ok: true, dry_run: true, form_type: formType });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase environment');
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    const since = new Date(Date.now() - 30_000).toISOString();
    const duplicate = await fetch(
      `${supabaseUrl}/rest/v1/web_form_submissions?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`,
      { headers, cache: 'no-store' },
    );
    if (!duplicate.ok) throw new Error(`Duplicate check failed: ${duplicate.status}`);
    if ((await duplicate.json()).length) return response(origin, 429, { ok: false, error: 'please_wait' });

    const insert = await fetch(`${supabaseUrl}/rest/v1/web_form_submissions`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    });
    if (!insert.ok) throw new Error(`Insert failed: ${insert.status} ${await insert.text()}`);

    await Promise.allSettled([
      sendNotificationEmail(payload, input),
      // Internal QA submissions must not become paid-ad conversions.
      input.traffic_source === 'qa' || /[?&]utm_source=qa(?:&|$)/.test(String(input.source_ref || ''))
        ? Promise.resolve()
        : sendMetaConversion(payload, input, req),
    ]);

    return response(origin, 201, { ok: true });
  } catch (error) {
    console.error(error);
    return response(origin, 500, { ok: false, error: 'server_error' });
  }
});
