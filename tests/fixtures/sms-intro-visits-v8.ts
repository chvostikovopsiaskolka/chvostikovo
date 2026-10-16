const EXPECTED_HASH = '48df85454b07413f890a5032a84dc63636b6c3380cec4202dcd2c1a1401be899';

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-sms-secret',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    if (req.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

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
    const query =
      `${supabaseUrl}/rest/v1/intro_visits?` +
      `visit_date=eq.${encodeURIComponent(date)}&` +
      'visit_time=not.is.null&owner_phone=not.is.null&' +
      'select=id,dog_name,owner_phone,visit_date,visit_time&order=visit_time.asc,id.asc';

    const response = await fetch(query, { headers, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Intro visits ${response.status}: ${await response.text()}`);
    }

    const rows = await response.json();
    const result = rows
      .filter((row: any) =>
        String(row.owner_phone || '').trim() &&
        String(row.visit_time || '').trim()
      )
      .map((row: any) => ({
        intro_visit_id: row.id,
        dog_name: String(row.dog_name || '').trim() || 'u nás',
        phone: String(row.owner_phone).trim(),
        date: row.visit_date,
        time: String(row.visit_time).slice(0, 5),
      }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
});
