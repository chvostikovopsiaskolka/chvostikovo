const assert=require('node:assert/strict');
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const browser=await webkit.launch();
 try{
  for(const expanded of ['dog','settings','both']){
   const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,1,390,'webkit');
   await page.locator('#navDog').click();
   await page.evaluate(mode=>{
    document.querySelector('#menuDogGroup').open=mode==='dog'||mode==='both';
    document.querySelector('#menuSettingsGroup').open=mode==='settings'||mode==='both';
   },expanded);
   await page.waitForTimeout(200);
   const before=await page.evaluate(()=>{
    const nav=document.querySelector('.bottom-nav').getBoundingClientRect();
    const wallpaper=getComputedStyle(document.body,'::before');
    const body=getComputedStyle(document.body);
    const material=document.querySelector('.bottom-nav>.lg-v3-material');
    return {navTop:nav.top,navLeft:nav.left,navWidth:nav.width,navBottom:nav.bottom,
     bodyBackground:body.backgroundImage,wallpaperPosition:wallpaper.position,
     wallpaperImage:wallpaper.backgroundImage,wallpaperSize:wallpaper.backgroundSize,
     materialRenderer:material?.dataset.renderer,
     wallpaperRevision:document.getElementById('customer-lg-v3-wallpaper')?.dataset.liquidGlassRevision||''};
   });
   assert.equal(before.wallpaperPosition,'fixed','paw layer must be anchored to the viewport, not page scroll');
   assert.equal(before.bodyBackground,'none','no second, scrolling paw texture behind fixed layer');
   assert.match(before.wallpaperImage,/chvostikovo-paws-soft-v383/);
   assert.equal(before.wallpaperSize,'300px 430px');
   assert.equal(before.materialRenderer,'fallback','iOS expanding Menu must avoid GPU dock re-sampling');
   const remaining=await page.evaluate(()=>{
    const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    window.scrollTo(0,Math.max(0,height-innerHeight));
    return height-innerHeight;
   });
   assert(remaining>80,'long '+expanded+' menu must actually scroll');
   await page.waitForTimeout(160);
   const after=await page.evaluate(()=>{
    const r=document.querySelector('.bottom-nav').getBoundingClientRect();
    return {navTop:r.top,navLeft:r.left,navWidth:r.width,navBottom:r.bottom,
      scrollY,wallpaperRevision:document.getElementById('customer-lg-v3-wallpaper')?.dataset.liquidGlassRevision||''};
   });
   assert(after.scrollY>40,'menu document scrolled');
   for(const key of ['navTop','navLeft','navWidth','navBottom'])assert(Math.abs(before[key]-after[key])<2,key+' must remain visually fixed after scroll '+expanded);
   assert.equal(after.wallpaperRevision,before.wallpaperRevision,'fixed iOS wallpaper should not be re-rasterized on scroll');
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(100);
   const reset=await page.locator('.bottom-nav').boundingBox();
   assert(Math.abs(reset.y-before.navTop)<2,'dock returns to exact viewport position');
   assert.deepEqual(errors,[]);
   console.log('PASS iOS fixed Menu nav and paws',expanded,before,after);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
