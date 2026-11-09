const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{})
 try{
  for(const dogs of [1,2])for(const width of [320,390,430,844]){
   const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,dogs,width,engine.name());
   try{
    await page.evaluate(()=>{
      state.data.vaccinations=[];
      state.data.vaccination_proofs=[];
      openDogDetails('vaccinations',true);
    });
    const proof=await page.evaluate(()=>{
      const save=document.querySelector('#dogForm > button[type="submit"]');
      const later=document.querySelector('#dogVaccinationsLaterV413');
      const a=save.getBoundingClientRect(),b=later.getBoundingClientRect();
      const style=getComputedStyle(later);
      return {saveBottom:a.bottom,laterTop:b.top,buttonHeight:b.height,buttonWidth:b.width,
       gap:b.top-a.bottom,background:style.backgroundColor,border:style.borderTopColor,borderWidth:style.borderTopWidth,
       textColor:style.color,hidden:later.classList.contains('hidden'),mode:document.getElementById('dogDetailsModal').dataset.mode,
       overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert(!proof.hidden && proof.mode==='vaccinations',JSON.stringify(proof));
    assert(proof.gap>=4 && proof.gap<=10,'Compact button gap at '+width+': '+JSON.stringify(proof));
    assert(proof.buttonHeight>=44 && proof.buttonWidth>=150,'Touch target retained: '+JSON.stringify(proof));
    assert(proof.background==='rgba(0, 0, 0, 0)'||proof.background==='transparent','Empty background: '+JSON.stringify(proof));
    assert(proof.borderWidth==='2px'&&proof.border===proof.textColor,'Orange outline: '+JSON.stringify(proof));
    assert(!proof.overflow,'No horizontal overflow at '+width);
    await page.locator('#dogVaccinationsLaterV413').click();
    assert(await page.locator('#dogDetailsModal').isHidden(),'Defer action preserved');
    assert.deepEqual(errors,[]);
    console.log('PASS vaccination defer outline, gap and action',engine.name(),dogs,width);
   }finally{await context.close();}
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
