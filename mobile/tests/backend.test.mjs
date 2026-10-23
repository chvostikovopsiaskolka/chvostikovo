import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';
const result = await build({ entryPoints: [new URL('../backend/customer-native-push.ts', import.meta.url).pathname], bundle: true, write: false, format: 'iife', plugins: [{ name: 'access-fixture', setup(b) {
  b.onResolve({ filter: /security-v336\.ts$/ }, args => ({ path: args.path, namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const securityAccessV336=async()=>__fixture.denied?new Response("blocked",{status:403}):null;export const securityLimitV336=async()=>null;', loader: 'js' }));
} }] });
function fixture() {
  let handler; const calls = [];
  const ctx = { Request, Response, URLSearchParams, Uint8Array, TextEncoder, AbortSignal, Date, JSON, console,
    __fixture: { denied: false, auth: true, firebase: false },
    Deno: { env: { get: key => key === 'FIREBASE_SERVICE_ACCOUNT_JSON' ? ctx.__fixture.firebase ? JSON.stringify({ project_id: 'synthetic-project', client_email: 'synthetic@example.invalid', private_key: 'synthetic' }) : '' : key === 'SUPABASE_URL' ? 'https://synthetic.invalid' : 'synthetic-service' }, serve: fn => { handler = fn; } },
    fetch: async (url, opts) => { calls.push({ url, opts }); return String(url).endsWith('/auth/v1/user') ? new Response(JSON.stringify({ id: 'synthetic-user' }), { status: ctx.__fixture.auth ? 200 : 401 }) : new Response(null, { status: 204 }); }
  };
  vm.runInNewContext(result.outputFiles[0].text, ctx);
  const request = (body, authorization = 'Bearer synthetic') => handler(new Request('https://synthetic.invalid/native', { method: 'POST', headers: authorization ? { authorization } : {}, body: JSON.stringify(body) }));
  return { ctx, calls, request };
}
test('native endpoint rejects missing auth, revoked sessions, blocked accounts and invalid tokens', async () => {
  const f = fixture(), data = { action: 'subscribe', platform: 'android', token: 'synthetic-token-1234567890' };
  assert.equal((await f.request(data, '')).status, 401);
  f.ctx.__fixture.auth = false; assert.equal((await f.request(data)).status, 401);
  f.ctx.__fixture.auth = true; f.ctx.__fixture.denied = true; assert.equal((await f.request(data)).status, 403);
  f.ctx.__fixture.denied = false; assert.equal((await f.request({ ...data, token: 'bad' })).status, 400);
  assert(!f.calls.some(c => c.url.includes('portal_native_push_devices')));
});
test('unconfigured Firebase does not claim subscription success; unsubscribe remains owner-scoped', async () => {
  const f = fixture(), data = { action: 'subscribe', platform: 'android', token: 'synthetic-token-1234567890', user_id: 'attacker-selected-id' };
  assert.equal((await f.request(data)).status, 503);
  f.ctx.__fixture.firebase = true; assert.equal((await f.request(data)).status, 200);
  let call = f.calls.at(-1); assert.equal(JSON.parse(call.opts.body).user_id, 'synthetic-user');
  assert.equal((await f.request({ ...data, action: 'unsubscribe' })).status, 200);
  call = f.calls.at(-1); assert.match(call.url, /user_id=eq.synthetic-user/); assert.equal(call.opts.method, 'DELETE');
});
