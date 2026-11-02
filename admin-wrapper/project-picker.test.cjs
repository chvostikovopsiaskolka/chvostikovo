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
assert(html.includes('id="chooseChvostikovo"'));
assert.match(html, /<a id="chooseBellaris"[^>]+href="https:\/\/admin\.bellaris\.sk\/"[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
assert(!html.includes('id="bellarisDashboard"'), 'Embedded Bellaris dashboard must not mount');
assert(!html.includes('id="bellarisSplash"'), 'Embedded Bellaris loader must not mount');
assert(!html.includes('bellaris-admin.mjs'), 'Old separate Bellaris implementation must not load');
assert(!html.includes('bellaris-admin.css'), 'Old Bellaris styles must not load');
assert(html.includes('class="app-boot loading-screen loading-concept hidden"'));
assert(html.includes('html:has(#boot:not(.hidden))'));
assert(html.includes('20261014-admin-pwa-v111'));
const script = html.match(/<script id="admin-workspace-controller-v1">([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Original Chvostikovo boot controller remains');
assert(script.includes('const oldBootCanvas'), 'Preserve iOS login underlay correction');
assert(!script.includes('openBellarisMobile'));
assert(!script.includes("chooseBellaris').addEventListener"));
new vm.Script(script);

async function simulate(href) {
  let fetched = 0, registered = 0, written = '';
  const elements = {};
  for (const id of ['projectPicker', 'boot', 'chooseChvostikovo', 'bootText']) {
    elements[id] = {
      hidden: false, listeners: {}, textContent: '',
      classList: {added: [], removed: [], add(...values){this.added.push(...values)}, remove(...values){this.removed.push(...values)}},
      addEventListener(type, fn){this.listeners[type] = fn;}
    };
  }
  const theme = {value: '#ffffff', setAttribute(name, value){assert.equal(name, 'content');this.value = value;}};
  const doc = {
    getElementById(id){return elements[id] || null;},
    querySelector(selector){return selector === 'meta[name="theme-color"]' ? theme : null;},
    open(){}, write(value){written = value;}, close(){}
  };
  vm.runInNewContext(script, {
    document: doc, navigator: {serviceWorker: {register(){registered++;return Promise.resolve();}}},
    window: {location: {href}}, URL,
    fetch: async (url, options) => {
      fetched++;
      assert.equal(url, 'https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/chvostikovo-frontend?v=20261014-admin-pwa-v111');
      assert.equal(options.cache, 'no-store');
      return {ok: true, text: async () => '<html><style>html:has(#appBoot),body:has(#appBoot){background:#fff!important}</style>Chvostíkovo admin unchanged</html>'};
    }
  }, {timeout: 1500});
  await new Promise(setImmediate);
  return {elements, theme, get fetched(){return fetched}, get registered(){return registered}, get written(){return written}, click(){return elements.chooseChvostikovo.listeners.click()}, async flush(){await new Promise(setImmediate)}};
}
(async () => {
  const launcher = await simulate('https://chvostikovo-app.vercel.app/');
  assert.equal(launcher.fetched, 0, 'No database request before explicit Chvostikovo selection');
  assert.equal(launcher.registered, 1, 'Existing service worker retained');
  assert.equal(launcher.theme.value, '#ffffff');
  launcher.click();
  await launcher.flush();
  assert.equal(launcher.fetched, 1);
  assert.equal(launcher.elements.projectPicker.hidden, true);
  assert.equal(launcher.theme.value, '#fffaf5');
  assert(launcher.written.includes('Chvostíkovo admin unchanged'));
  assert(launcher.written.includes('html:has(#appBoot:not(.hidden))'));
  launcher.click();
  assert.equal(launcher.fetched, 1, 'Double tap cannot restart loading');

  for (const href of [
    'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',
    'https://chvostikovo-app.vercel.app/?tab=chat',
    'https://chvostikovo-app.vercel.app/#push'
  ]) {
    const direct = await simulate(href);
    await direct.flush();
    assert.equal(direct.fetched, 1, 'Existing push/deep links bypass launcher');
  }
  const listeners = {};let opened = '';
  vm.runInNewContext(sw, {
    self: {location: {origin: 'https://chvostikovo-app.vercel.app'}, addEventListener(type, fn){listeners[type] = fn;},
      clients: {matchAll: async () => [], openWindow: async url => {opened = url;}}}, URL
  });
  async function clickPush(url) {
    let pending;
    listeners.notificationclick({notification:{data:{url},close(){}},waitUntil(promise){pending = promise;}});
    await pending;return opened;
  }
  assert.equal(await clickPush('/'), 'https://chvostikovo-app.vercel.app/?workspace=chvostikovo');
  assert.equal(await clickPush('/?tab=reservations'), 'https://chvostikovo-app.vercel.app/?tab=reservations');
  console.log('PASS: Bellaris external-only, Chvostikovo boot, admin icons, push/deep links');
})().catch(error => {console.error(error);process.exitCode = 1;});
