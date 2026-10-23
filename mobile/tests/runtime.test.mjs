import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
const result = await build({ entryPoints: [new URL('../src/runtime.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', plugins: [{ name: 'native-device-fixture', setup(b) {
  b.onResolve({ filter: /^@capacitor\// }, args => ({ path: args.path, namespace: 'fixture' }));
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const Capacitor={isNativePlatform:()=>true};export const registerPlugin=()=>__device.updates;export const App=__device.app;export const PushNotifications=__device.push;', loader: 'js' }));
} }] });
function fixture() {
  const listeners = {}, store = new Map(), calls = [], navigations = [], set = [];
  let session = { user: { id: 'synthetic-owner' }, access_token: 'synthetic-access' };
  const dom = new EventTarget();
  const ctx = { crypto: webcrypto, TextEncoder, URL, URLSearchParams, AbortSignal, setTimeout, clearTimeout, Event, CustomEvent,
    document: Object.assign(dom, { visibilityState: 'visible', getElementById: () => null }), navigator: { onLine: true },
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    sessionStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) },
    location: { replace: value => navigations.push(value) },
    fetch: async (url, opts) => { calls.push({ url, ...opts }); return { ok: true }; },
    __device: { updates: { check: async () => ({ available: false }) }, app: {
      addListener: async (name, fn) => { listeners[name] = fn; }, getLaunchUrl: async () => ({ url: '' }), minimizeApp: async () => calls.push('minimize')
    }, push: {
      addListener: async (name, fn) => { listeners[name] = fn; }, checkPermissions: async () => ({ receive: 'granted' }),
      requestPermissions: async () => { calls.push('permission'); return { receive: 'granted' }; },
      register: async () => { calls.push('register'); queueMicrotask(() => listeners.registration({ value: 'synthetic-fcm-token-123456789' })); },
      unregister: async () => calls.push('unregister'), createChannel: async () => calls.push('channel')
    } }
  };
  ctx.window = ctx;
  vm.runInNewContext(result.outputFiles[0].text, ctx);
  const host = { getSession: () => session, ensureSession: async () => { calls.push('ensure-session'); return session; }, setPush: on => set.push(on), completePushPrompt: async () => calls.push('complete'), notify: () => {}, resume: () => calls.push('resume'), pause: () => calls.push('pause'), flush: () => calls.push('flush') };
  ctx.ChvoNative.attach(host);
  return { ctx, calls, listeners, store, navigations, set, logout: () => { session = null; } };
}
test('native push registers once, refreshes session before server, coalesces subscription and unregisters on logout', async () => {
  const f = fixture(); await f.ctx.ChvoNative.prepareLaunch();
  await Promise.all([f.ctx.ChvoNative.ensurePush(), f.ctx.ChvoNative.ensurePush()]);
  assert.equal(f.calls.filter(c => c === 'register').length, 1);
  assert.equal(f.calls.filter(c => typeof c === 'object' && JSON.parse(c.body).action === 'subscribe').length, 1);
  assert(f.calls.indexOf('ensure-session') < f.calls.findIndex(c => typeof c === 'object'));
  assert(!f.calls.includes('permission'), 'startup must not prompt for permissions');
  await f.ctx.ChvoNative.logout({ access_token: 'synthetic-access' }); f.logout();
  assert(f.calls.includes('unregister'));
  assert.equal(JSON.parse(f.calls.filter(c => typeof c === 'object').at(-1).body).action, 'unsubscribe');
});
test('native pause/resume uses shared lifecycle; back respects guarded dialogs', async () => {
  const f = fixture(); await f.ctx.ChvoNative.prepareLaunch();
  f.listeners.appStateChange({ isActive: false }); f.listeners.appStateChange({ isActive: true });
  assert(f.calls.includes('pause')); assert(f.calls.includes('flush')); assert(f.calls.includes('resume'));
  f.ctx.document.addEventListener('chvo-native-back', e => e.preventDefault(), { once: true });
  f.listeners.backButton(); assert(!f.calls.includes('minimize'));
  f.listeners.backButton(); assert(f.calls.includes('minimize'));
});
test('cold-start callback is consumed once without persisting raw auth tokens', async () => {
  const f = fixture();
  f.ctx.__device.app.getLaunchUrl = async () => ({ url: 'https://app.chvostikovo.sk/#access_token=secret-test-token&refresh_token=secret-test-refresh&type=recovery' });
  assert.equal(await f.ctx.ChvoNative.prepareLaunch(), true);
  assert.equal(await f.ctx.ChvoNative.prepareLaunch(), false);
  assert.equal(f.navigations.length, 1);
  assert(!JSON.stringify([...f.store]).includes('secret-test'));
  f.listeners.appUrlOpen({ url: 'https://evil.example/#access_token=synthetic' });
  await new Promise(r => setTimeout(r, 0)); assert.equal(f.navigations.length, 1);
});
test('explicit disable remains disabled on resume', async () => {
  const f = fixture(); await f.ctx.ChvoNative.prepareLaunch();
  await f.ctx.ChvoNative.enablePush(); await f.ctx.ChvoNative.togglePush();
  const count = f.calls.length;
  assert.equal(await f.ctx.ChvoNative.ensurePush(), false);
  assert.equal(f.calls.length, count);
});
