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
const style=await nav.locator(':scope>.lg-v3-material').evaluate(el=>({milk:getComputedStyle(el).getPropertyValue('--lg-v3-milk').trim(),background:getComputedStyle(el).backgroundColor,overlay:getComputedStyle(el,'::after').backgroundColor}));
if(type===chromium){assert.equal(style.milk,'.92');assert.equal(style.background,'rgba(255, 255, 255, 0.92)');}else{assert.equal(style.milk,'');assert([style.background,style.overlay].includes('rgba(255, 255, 255, 0.24)'),'iOS original milk is painted on the material or WebGL overlay');}
await page.evaluate(()=>{window.__noticeFixture=[{id:51,active:true,show_in_overview:true,title:'Syntetický oznam',body:'Obrázok pod lištou',valid_from:'2020-01-01'}];return loadAnnouncements(true)});
await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);assert.deepEqual(await nav.boundingBox(),before);
await page.locator('#navDog').click();await page.waitForTimeout(100);assert.deepEqual(await nav.boundingBox(),before);
assert.deepEqual(errors,[]);assert.equal(await page.locator('meta[name=theme-color]').getAttribute('content'),'#ffffff');
console.log('PASS dock milk/platform isolation/notice scroll/menu geometry',type.name(),width);
await context.close();}
}finally{await browser.close();}}
const manifest=require('node:fs').readFileSync('manifest.webmanifest','utf8');assert.equal(JSON.parse(manifest).background_color,'#ffffff');assert.equal(JSON.parse(manifest).theme_color,'#ffffff');
})().catch(e=>{console.error(e);process.exitCode=1});
