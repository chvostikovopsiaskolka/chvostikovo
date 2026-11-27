const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fixture=require('./liquid-v3-fixture.cjs');
(async()=>{
for(const type of [chromium,webkit]){
const browser=await type.launch(type===chromium?{args:['--no-sandbox']}:{});
try{for(const width of [320,360,390,430,844]){
const {page,context,errors}=await fixture(browser,1,width,type.name());
await page.waitForSelector('.bottom-nav>.lg-v3-material',{state:'attached'});
const nav=page.locator('.bottom-nav'),before=await nav.boundingBox();
const style=await nav.locator(':scope>.lg-v3-material').evaluate(el=>({background:getComputedStyle(el).backgroundColor,image:getComputedStyle(el).backgroundImage,blur:getComputedStyle(el).backdropFilter,renderer:el.dataset.renderer}));
assert.equal(style.renderer,'fallback');assert.match(style.image,/linear-gradient/);assert.match(style.blur,/blur\(20px\)/);if(type===chromium)assert.equal(style.background,'rgba(255, 255, 255, 0.92)');assert.equal(await nav.evaluate(el=>getComputedStyle(el).borderTopLeftRadius),'19px');assert.equal(await page.locator('#navBookAddV220').evaluate(el=>getComputedStyle(el).borderTopLeftRadius),'13px');assert.equal(await nav.locator('.lg-v3-output').count(),0);
await page.evaluate(()=>{window.__noticeFixture=[{id:51,active:true,show_in_overview:true,title:'Syntetický oznam',body:'Obrázok pod lištou',valid_from:'2020-01-01'}];return loadAnnouncements(true)});
await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);assert.deepEqual(await nav.boundingBox(),before);
await page.locator('#navDog').click();await page.waitForTimeout(100);assert.deepEqual(await nav.boundingBox(),before);
assert.deepEqual(errors,[]);assert.equal(await page.locator('meta[name=theme-color]').getAttribute('content'),'#ffffff');
console.log('PASS dock milk/platform isolation/notice scroll/menu geometry',type.name(),width);
await context.close();}
}finally{await browser.close();}}
const manifest=require('node:fs').readFileSync('manifest.webmanifest','utf8');assert.equal(JSON.parse(manifest).background_color,'#ffffff');assert.equal(JSON.parse(manifest).theme_color,'#ffffff');
})().catch(e=>{console.error(e);process.exitCode=1});
