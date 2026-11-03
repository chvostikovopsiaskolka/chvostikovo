const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('admin-wrapper/index.html', 'utf8');
const sw = fs.readFileSync('admin-wrapper/sw.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('admin-wrapper/manifest.webmanifest', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('admin-wrapper/vercel.json', 'utf8'));
const icon = fs.readFileSync('admin-wrapper/apple-touch-icon.png');

assert.equal(icon.subarray(1, 4).toString(), 'PNG');
assert.equal(icon.readUInt32BE(16), 180);
assert.equal(icon.readUInt32BE(20), 180);
assert(manifest.icons.every(icon => icon.src.startsWith('/admin-icon-')));
assert(!vercel.rewrites.some(rule => rule.source === '/apple-touch-icon.png'));
assert(!html.includes('id="projectPicker"'), 'Chvostikovo opens without workspace chooser');
assert(!html.includes('id="chooseChvostikovo"'));
assert(!html.includes('id="chooseBellaris"'));
assert(!html.includes('id="bellarisDashboard"'));
assert(!html.includes('id="bellarisSplash"'));
assert(!html.includes('bellaris-admin.mjs'));
assert(!html.includes('bellaris-admin.css'));
assert(html.includes('class="app-boot loading-screen loading-concept"'), 'Loading is visible from first paint');
assert(html.includes('html:has(#boot:not(.hidden))'));
assert(html.includes('#boot.loading-screen.loading-concept{position:fixed!important;inset:0!important;width:100%!important'));
assert(html.includes('#boot{padding:0!important;z-index:99999!important;width:100%!important;height:100vh!important;height:100dvh!important'));

assert(html.includes('20261014-admin-pwa-v111'));

const script = html.match(/<script id="admin-workspace-controller-v1">([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Direct boot controller exists');
assert(script.includes('const oldBootCanvas'), 'Preserve iOS login underlay correction');
assert(script.includes('void loadChvostikovo()'), 'Auto-boot on every launch');
new vm.Script(script);

async function simulate(href, failFirst = false) {
  let fetched = 0, registered = 0, written = '', actions, retry;
  const elements = {};
  const makeElement = () => ({
    hidden: false, listeners: {}, textContent: '', parentElement: {appendChild(child) { actions = child; }},
    classList: {added: [], removed: [],
      add(...values) { this.added.push(...values); },
      remove(...values) { this.removed.push(...values); }},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute() {}, remove() {},
    append(child) { retry = child; }
  });
  elements.boot = makeElement();
  elements.bootText = makeElement();
  const theme = {value: '#ffffff', setAttribute(name, value) {assert.equal(name, 'content'); this.value = value;}};
  const doc = {
    getElementById(id) {return id === 'chvoLoadActions' ? actions : elements[id] || null;},
    querySelector(selector) {return selector === 'meta[name="theme-color"]' ? theme : null;},
    createElement() {return makeElement();},
    open() {}, write(value) {written = value;}, close() {}
  };
  vm.runInNewContext(script, {
    document: doc,
    navigator: {serviceWorker: {register() {registered++; return Promise.resolve();}}},
    window: {location: {href}}, URL,
    fetch: async (url, options) => {
      fetched++;
      assert.equal(url, 'https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/chvostikovo-frontend?v=20261014-admin-pwa-v111');
      assert.equal(options.cache, 'no-store');
      if (failFirst && fetched === 1) return {ok: false, status: 503};
      return {ok: true, text: async () => '<html><style>html:has(#appBoot),body:has(#appBoot){background:#fff!important}</style>Chvostíkovo admin unchanged</html>'};
    }
  }, {timeout: 1500});
  return {
    theme, elements,
    get fetched() {return fetched;}, get registered() {return registered;},
    get written() {return written;}, get actions() {return actions;},
    clickRetry() {assert(retry); return retry.listeners.click();},
    async flush() {await new Promise(setImmediate); }
  };
}

(async () => {
  for (const href of [
    'https://chvostikovo-app.vercel.app/',
    'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',
    'https://chvostikovo-app.vercel.app/?workspace=bellaris',
    'https://chvostikovo-app.vercel.app/?tab=chat',
    'https://chvostikovo-app.vercel.app/#push'
  ]) {
    const direct = await simulate(href);
    await direct.flush();
    assert.equal(direct.fetched, 1, 'Every launch fetches admin exactly once');
    assert.equal(direct.registered, 1, 'Service worker retained');
    assert.equal(direct.theme.value, '#fffaf5');
    assert(direct.written.includes('Chvostíkovo admin unchanged'));
    assert(direct.written.includes('html:has(#appBoot:not(.hidden))'));
  }
  const failed = await simulate('https://chvostikovo-app.vercel.app/', true);
  await failed.flush();
  assert.equal(failed.fetched, 1);
  assert.equal(failed.actions.id, 'chvoLoadActions', 'Retry rendered after network failure');
  failed.clickRetry();
  await failed.flush();
  assert.equal(failed.fetched, 2);
  assert(failed.written.includes('Chvostíkovo admin unchanged'));
  const listeners = {}; let opened = '';
  vm.runInNewContext(sw, {
    self: {location: {origin: 'https://chvostikovo-app.vercel.app'},
      addEventListener(type, fn) {listeners[type] = fn;},
      clients: {matchAll: async () => [], openWindow: async url => {opened = url;}}}, URL
  });
  async function clickPush(url) {
    let pending;
    listeners.notificationclick({notification: {data: {url}, close() {}}, waitUntil(promise) {pending = promise;}});
    await pending;
    return opened;
  }
  assert.equal(await clickPush('/'), 'https://chvostikovo-app.vercel.app/?workspace=chvostikovo');
  assert.equal(await clickPush('/?tab=reservations'), 'https://chvostikovo-app.vercel.app/?tab=reservations');
  console.log('PASS: Chvostikovo direct boot, no Bellaris UI, loader/retry, admin icons, push/deep links');
})().catch(error => {console.error(error); process.exitCode = 1;});
