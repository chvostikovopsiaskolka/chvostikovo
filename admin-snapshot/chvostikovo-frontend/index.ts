const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env');

    const snap = await fetch(
      `${supabaseUrl}/rest/v1/frontend_snapshots?key=eq.stable-v10-clean&select=html&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      }
    );
    if (!snap.ok) throw new Error(`Snapshot ${snap.status}: ${await snap.text()}`);

    const rows = await snap.json();
    const html = rows?.[0]?.html || '';

    const required = [
      'Chvostíkovo',
      'Týždenný prehľad',
      'overviewTodayLabel',
      'ADMIN_PUSH_PUBLIC_KEY',
      'pendingDogRequestsHtml',
      'portal_approve_booking',
    ];
    for (const marker of required) {
      if (!html.includes(marker)) throw new Error(`Invalid clean snapshot: ${marker}`);
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    return new Response(
      `Chvostíkovo frontend error: ${e instanceof Error ? e.message : String(e)}`,
      {
        status: 500,
        headers: {
          ...CORS,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
});