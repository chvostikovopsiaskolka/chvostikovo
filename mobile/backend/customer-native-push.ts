import { securityLimitV336, securityAccessV336 } from './security-v336.ts';
import { firebaseAccount } from './fcm.ts';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const base = Deno.env.get('SUPABASE_URL') || '', key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const authorization = req.headers.get('authorization') || '';
  if (!/^Bearer /i.test(authorization)) return reply({ error: 'Unauthenticated' }, 401);
  try {
    const auth = await fetch(base + '/auth/v1/user', { headers: { apikey: key, Authorization: authorization }, signal: AbortSignal.timeout(5000) });
    if (!auth.ok) return reply({ error: 'Unauthenticated' }, 401);
    const user = await auth.json();
    const denied = await securityAccessV336(req, base, key, cors); if (denied) return denied;
    const limited = await securityLimitV336(req, 'push_user', user.id, base, key, cors); if (limited) return limited;
    const raw = await req.text(); if (raw.length > 8192) return reply({ error: 'Too large' }, 413);
    const body = JSON.parse(raw), token = body.token;
    if (!['subscribe', 'unsubscribe'].includes(body.action) || body.platform !== 'android' || typeof token !== 'string' || !/^[A-Za-z0-9_:\-]{20,4096}$/.test(token)) return reply({ error: 'Invalid request' }, 400);
    if (body.action === 'subscribe' && !firebaseAccount()) return reply({ error: 'Native push not configured' }, 503);
    const unsubscribe = body.action === 'unsubscribe';
    const path = unsubscribe ? `portal_native_push_devices?user_id=eq.${encodeURIComponent(user.id)}&token=eq.${encodeURIComponent(token)}` : 'portal_native_push_devices?on_conflict=token';
    const response = await fetch(base + '/rest/v1/' + path, { method: unsubscribe ? 'DELETE' : 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, ...(unsubscribe ? {} : { body: JSON.stringify({ token, user_id: user.id, platform: 'android', updated_at: new Date().toISOString() }) }), signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Device persistence unavailable');
    return reply({ ok: true });
  } catch { return reply({ error: 'Native push unavailable' }, 503); }
});
