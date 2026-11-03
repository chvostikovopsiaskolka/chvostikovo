import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async(path)=>readFile(new URL('../'+path,import.meta.url));
const root=async(path)=>readFile(new URL('../../'+path,import.meta.url));
test('Android AAB v410 packages bilingual customer interface without altering native security',async()=>{
  const release=JSON.parse((await read('www/version.json')).toString());
  const manifest=JSON.parse((await read('www/mobile-build.json')).toString());
  assert.equal(release.build,'v410');
  assert.equal(release.version,'2.0.83');
  assert.equal(manifest.build,release.build);
  for(const path of ['customer-locale-v409.js','customer-design.css','customer-liquid-optics.js','index.html','app.js']){
    const packaged=await read('www/'+path);
    assert.equal(createHash('sha256').update(packaged).digest('hex'),manifest.packagedFiles[path]);
    if(path!=='index.html')assert.deepEqual(packaged,await root(path));
  }
  const html=(await read('www/index.html')).toString();
  assert(html.indexOf('customer-locale-v409.js?v=v410')<html.indexOf('/app.js?v=v410'),'Locale before app');
  assert(html.includes('customerLocaleSwitchV408'),'SK/EN signup switch bundled');
  assert(html.includes('customerLocaleInMenuV409'),'SK/EN settings switch bundled');
  const optics=(await read('www/customer-liquid-optics.js')).toString();
  assert(optics.includes("root.classList.toggle('customer-ios-auth-v410',authVisible&&ios)"));
  assert(optics.includes("if(authVisible && ios && el.matches('#authView>.auth-card'))"),'iOS stabilizer only');
  const css=(await read('www/customer-design.css')).toString();
  assert(css.includes('html.customer-auth-glass-v386.customer-ios-auth-v410 body::before'));
  assert(!css.includes('html.customer-auth-glass-v386 body{background-color:#fff!important;background-image:none!important}'),'Android uses original liquid backdrop');
});
