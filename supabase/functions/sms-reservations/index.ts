const EXPECTED_HASH = '48df85454b07413f890a5032a84dc63636b6c3380cec4202dcd2c1a1401be899';

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

function addMonths(dateText: string, months: number) {
  const [y, m, d] = dateText.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

function inList(values: number[]) {
  return `in.(${values.join(',')})`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, headers: Record<string, string>, label: string) {
  let lastError = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const r = await fetch(url, { headers, signal: controller.signal });
      const text = await r.text();
      if (r.ok) {
        try { return text ? JSON.parse(text) : []; }
        catch { throw new Error(`${label}: invalid JSON response`); }
      }
      lastError = `${label} ${r.status}: ${text}`;
      if (![502, 503, 504].includes(r.status) || attempt === 3) throw new Error(lastError);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      lastError = message.includes('AbortError') ? `${label}: request timeout` : message;
      if (attempt === 3) throw new Error(lastError);
    } finally {
      clearTimeout(timer);
    }
    await sleep(attempt === 1 ? 250 : 700);
  }
  throw new Error(lastError || `${label}: request failed`);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-sms-secret',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const secret = req.headers.get('x-sms-secret') || '';
    if (!secret || await sha256(secret) !== EXPECTED_HASH) {
      return new Response('Unauthorized', { status: 401, headers: CORS });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response('Invalid date', { status: 400, headers: CORS });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env');
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    // Keep the gateway calls intentionally simple. The previous nested
    // reservations -> dogs -> owners PostgREST embed intermittently returned 504.
    const reservationsUrl = `${supabaseUrl}/rest/v1/reservations?reservation_date=eq.${date}&status=eq.booked&select=id,reservation_date,dog_id,entry_type,pass_id,planned_entry_number,planned_pass_total,taxi_service,taxi_mode,taxi_amount&order=id.asc`;
    const rows = await fetchJsonWithRetry(reservationsUrl, headers, 'Reservations') as any[];

    if (!rows.length) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    const dogIds = [...new Set(rows.map(x => Number(x.dog_id)).filter(Boolean))];
    const dogs = dogIds.length
      ? await fetchJsonWithRetry(
          `${supabaseUrl}/rest/v1/dogs?id=${encodeURIComponent(inList(dogIds))}&select=id,name,sms_name,owner_id,visit_reminder_channel`,
          headers,
          'Dogs',
        ) as any[]
      : [];
    const dogMap = new Map<number, any>(dogs.map(d => [Number(d.id), d]));

    // Staff opts each dog in. Keep SMS when no active customer push recipient exists.
    const pushOwnerIds = [...new Set(dogs.filter(d => ['auto', 'push'].includes(d.visit_reminder_channel)).map(d => Number(d.owner_id)).filter(Boolean))];
    const pushOwners = new Set<number>();
    if (pushOwnerIds.length) {
      const links = await fetchJsonWithRetry(`${supabaseUrl}/rest/v1/customer_owner_links?owner_id=${encodeURIComponent(inList(pushOwnerIds))}&select=owner_id,user_id`, headers, 'Customer links') as any[];
      const userIds = [...new Set(links.map(link => String(link.user_id)))];
      if (userIds.length) {
        const filter = encodeURIComponent(`in.(${userIds.join(',')})`);
        const [profiles, subscriptions] = await Promise.all([
          fetchJsonWithRetry(`${supabaseUrl}/rest/v1/customer_profiles?user_id=${filter}&status=eq.active&select=user_id`, headers, 'Customer profiles'),
          fetchJsonWithRetry(`${supabaseUrl}/rest/v1/portal_push_subscriptions?user_id=${filter}&active=eq.true&select=user_id`, headers, 'Push recipients'),
        ]) as [any[], any[]];
        const activeProfiles = new Set(profiles.map(p => String(p.user_id)));
        const activePushUsers = new Set(subscriptions.map(p => String(p.user_id)));
        for (const link of links) if (activeProfiles.has(String(link.user_id)) && activePushUsers.has(String(link.user_id))) pushOwners.add(Number(link.owner_id));
      }
    }

    const ownerIds = [...new Set(dogs.map(d => Number(d.owner_id)).filter(Boolean))];
    const owners = ownerIds.length
      ? await fetchJsonWithRetry(
          `${supabaseUrl}/rest/v1/owners?id=${encodeURIComponent(inList(ownerIds))}&select=id,name,phone`,
          headers,
          'Owners',
        ) as any[]
      : [];
    const ownerMap = new Map<number, any>(owners.map(o => [Number(o.id), o]));

    const passIds = [...new Set(rows.map(x => Number(x.pass_id)).filter(Boolean))];
    const passMap = new Map<number, any>();
    if (passIds.length) {
      const passes = await fetchJsonWithRetry(
        `${supabaseUrl}/rest/v1/passes?id=${encodeURIComponent(inList(passIds))}&select=id,total_entries,used_entries,valid_from,valid_until,no_expiry,status`,
        headers,
        'Passes',
      ) as any[];
      for (const p of passes) passMap.set(Number(p.id), p);
    }

    const result = rows.filter((x: any) => {
      const dog = dogMap.get(Number(x.dog_id));
      return !(['auto', 'push'].includes(dog?.visit_reminder_channel) && pushOwners.has(Number(dog.owner_id)));
    }).map((x: any) => {
      const dog = dogMap.get(Number(x.dog_id));
      if (!dog) throw new Error(`Dog ${x.dog_id} not found`);
      const owner = ownerMap.get(Number(dog.owner_id));
      const p = x.pass_id != null ? passMap.get(Number(x.pass_id)) : null;
      const isPass = x.entry_type === 'pass' && !!p;
      const entryNumber = isPass ? Number(x.planned_entry_number || (Number(p.used_entries || 0) + 1)) : null;
      const passTotal = isPass ? Number(x.planned_pass_total || p.total_entries || 0) : null;
      let validUntil = isPass ? (p.valid_until || null) : null;
      if (isPass && !validUntil && !p.no_expiry) validUntil = addMonths(date, 2);

      return {
        reservation_id: x.id,
        date: x.reservation_date,
        dog_id: dog.id,
        dog_name: dog.name,
        sms_name: dog.sms_name || dog.name,
        phone: owner?.phone || '',
        entry_type: x.entry_type,
        pass_entry_number: entryNumber,
        pass_total: passTotal,
        pass_valid_until: validUntil,
        pass_no_expiry: !!p?.no_expiry,
        taxi_service: x.taxi_service || x.taxi_mode || 'none',
        taxi_amount: Number(x.taxi_amount || 0),
      };
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
});
