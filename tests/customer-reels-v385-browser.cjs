const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {PNG}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/pngjs');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;for(const mode of ['lens','reels'])for(const dogs of [1,2]){
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM).args:['--no-sandbox']}:{});
 try{const {page,context,errors}=await fixture(browser,dogs,390,type.name(),'?glass-material='+mode);
 await page.waitForFunction(mode=>customerLiquidV3Diagnostics().material===mode,mode);
 if(mode==='reels')await page.waitForFunction(()=>customerLiquidV3Diagnostics().turbulenceReady);
 const nav=await page.locator('.bottom-nav').boundingBox();await page.locator('#navDog').click();
 const material=page.locator('#menuDogGroup>summary>.lg-v3-material');await material.waitFor({state:'attached'});
 assert.equal(await page.locator('#menuTab').evaluate(el=>getComputedStyle(el,'::before').display),'none');
 assert(await page.locator('#menuDogGroup').evaluate(el=>getComputedStyle(el).boxShadow.includes('24px')));
 if(type===webkit&&mode==='reels')await page.waitForFunction(()=>document.querySelector('#menuDogGroup>summary>.lg-v3-material')?.dataset.renderer==='webgl',null,{timeout:15000});
 assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts<=2);
 assert.equal(await page.locator('.bottom-nav').evaluate(el=>getComputedStyle(el).filter),'none');
 if(dogs===1){fs.mkdirSync('/tmp/chvo-v385-screenshots',{recursive:true});await page.screenshot({path:`/tmp/chvo-v385-screenshots/menu-${mode}-${type.name()}.png`});}
 if(type===chromium&&mode==='reels'&&dogs===1){
   const old=await page.locator('body').getAttribute('style');await page.locator('body').evaluate(el=>el.style.setProperty('background-image','repeating-linear-gradient(90deg,#87414a 0 4px,#fff4e9 4px 8px)','important'));
   const a=PNG.sync.read(await material.screenshot());await material.evaluate(el=>el.style.backdropFilter='blur(3px) saturate(180%)');const b=PNG.sync.read(await material.screenshot());let changed=0;
   for(let i=0;i<a.data.length;i+=4)if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>12)changed++;
   assert(changed>50,'turbulence displacement must change actual backdrop pixels with identical blur');console.log('PASS isolated turbulence pixel difference',changed);
   await material.evaluate(el=>el.style.removeProperty('backdrop-filter'));await page.locator('body').evaluate((el,s)=>{if(s===null)el.removeAttribute('style');else el.setAttribute('style',s)},old);
 }
 await page.locator('#menuDogGroup>summary').click();assert(await material.isVisible());await page.locator('#menuDogGroup>summary').click();assert(await material.isVisible());
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);
 await page.locator('#navBooking').click();await page.waitForTimeout(100);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);assert.deepEqual(errors,[]);
 console.log('PASS reels comparison/menu/one wallpaper/outer shadow/nav',type.name(),mode,dogs);await context.close();
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exitCode=1});
