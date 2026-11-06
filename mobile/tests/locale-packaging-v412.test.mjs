import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const read=async path=>readFile(new URL('../'+path,import.meta.url));
const root=async path=>readFile(new URL('../../'+path,import.meta.url));

test('Android v412 / 2.0.85 packages current bilingual customer and EN daycare terms',async()=>{
  const release=JSON.parse((await read('www/version.json')).toString());
  const manifest=JSON.parse((await read('www/mobile-build.json')).toString());
  assert.equal(release.build,'v412');
  assert.equal(release.version,'2.0.85');
  assert.equal(manifest.build,release.build);
  assert.equal(manifest.version,release.version);
  assert.equal(manifest.packageId,'sk.chvostikovo.app');
  for(const path of ['customer-locale-v408.js','customer-locale-v409.js','customer-legal-en-v411.js','customer-design.css','customer-liquid-optics.js','index.html','app.js']){
    const packaged=await read('www/'+path);
    assert.equal(createHash('sha256').update(packaged).digest('hex'),manifest.packagedFiles[path],path);
    if(path!=='index.html')assert.deepEqual(packaged,await root(path),path);
  }
  const html=(await read('www/index.html')).toString();
  assert(html.indexOf('customer-locale-v409.js?v=v412')<html.indexOf('/app.js?v=v412'),'Locale before app');
  assert(html.indexOf('customer-legal-en-v411.js?v=v412')<html.indexOf('/app.js?v=v412'),'EN reading terms before app');
  assert(html.includes('customerLocaleSwitchV408'),'SK/EN login switch bundled');
  assert(html.includes('customerLocaleInMenuV409'),'SK/EN settings switch bundled');
  assert(html.includes('<option value="male">Pes</option>'),'Canonical SK gender label');
  assert(html.includes('<option value="female">Suka</option>'),'Canonical SK gender label');
  const terms=(await read('www/customer-legal-en-v411.js')).toString();
  assert(terms.includes('ChvostikovoLegalENV411'),'EN legal reading content exists');
  const optics=(await read('www/customer-liquid-optics.js')).toString();
  assert(optics.includes("root.classList.toggle('customer-ios-auth-v410',authVisible&&ios)"));
  assert(optics.includes("if(authVisible && ios && el.matches('#authView>.auth-card'))"),'Android liquid remains unchanged');
  const css=(await read('www/customer-design.css')).toString();
  assert(css.includes('html.customer-auth-glass-v386.customer-ios-auth-v410 body::before'));
  assert(!css.includes('html.customer-auth-glass-v386 body{background-color:#fff!important;background-image:none!important}'));
});
