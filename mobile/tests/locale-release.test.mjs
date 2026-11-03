import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async path=>readFile(new URL(path,import.meta.url),'utf8');
test('native v409 embeds identical stable paws and SK/EN UI without runtime fetch or web service worker',async()=>{
  const [html,css,optics,locale,manifest,version]=await Promise.all([
    read('../www/index.html'),read('../www/customer-design.css'),
    read('../www/customer-liquid-optics.js'),read('../www/customer-locale-v409.js'),
    read('../www/mobile-build.json'),read('../../version.json')
  ]);
  const source=JSON.parse(manifest),release=JSON.parse(version);
  assert.equal(source.build,'v409');
  assert.equal(source.version,'2.0.82');
  assert.deepEqual([source.build,source.version],[release.build,release.version]);
  assert.equal(source.packageId,'sk.chvostikovo.app');
  assert(source.files['customer-locale-v409.js'],'English switch must be in bundle');
  assert(source.files['customer-design.css'],'Fixed paw wallpaper must be in bundle');
  assert(source.files['customer-liquid-optics.js'],'Stable auth renderer must be in bundle');
  assert(!source.files['sw.js'],'No PWA service worker inside Capacitor app');
  assert(html.indexOf('/native-runtime.js')<html.indexOf('/app.js?v=v409'));
  assert(html.indexOf('/customer-locale-v409.js?v=v409')<html.indexOf('/app.js?v=v409'));
  assert(html.includes('id="customerLocaleSwitchV408"'),'Login switch missing');
  assert(html.includes('id="customerLocaleInMenuV409"'),'Settings switch missing');
  assert(!html.includes('customerLocaleNoteV408'),'Old EN preview disclaimer must not return');
  assert(css.includes('html.customer-auth-glass-v386 body::before'));
  assert(css.includes('position:fixed;inset:0;display:block;pointer-events:none;z-index:0'));
  assert(css.includes('prefers-reduced-transparency:reduce'));
  assert(optics.includes("if(authVisible && el.matches('#authView>.auth-card'))"));
  assert(locale.includes("getLanguage: () => lang"));
  assert(locale.includes("document.getElementById('appView')"));
  assert(locale.includes("document.getElementById('customerGuideV358')"));
  assert(!locale.includes("English preview:"));
  const packaged=await read('../www/customer-locale-v409.js');
  const shared=await read('../../customer-locale-v409.js');
  assert.equal(packaged,shared,'Native SK/EN behavior must be byte-exact with production source');
});
