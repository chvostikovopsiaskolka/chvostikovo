const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
  const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
  const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});
  try{
    for(const dogs of [1,2])for(const width of [320,360,390,430,480]){
      const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,dogs,width,engine.name());
      try{
        await page.evaluate(()=>openDogDetails('details',true));
        const measured=await page.evaluate(()=>{
          const label=document.querySelector('#dogDetailsModal label[for="dogWeight"]');
          const weight=document.getElementById('dogWeight').getBoundingClientRect();
          const breed=document.getElementById('dogBreed').getBoundingClientRect();
          const rect=label.getBoundingClientRect();
          return {text:label.textContent.trim(),display:getComputedStyle(label).display,nowrap:getComputedStyle(label).whiteSpace,
            scrollWidth:label.scrollWidth,clientWidth:label.clientWidth,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
            weight:{x:weight.x,y:weight.y,width:weight.width},breed:{x:breed.x,y:breed.y,width:breed.width},
            bodyOverflow:document.documentElement.scrollWidth>innerWidth};
        });
        assert(measured.text.includes('nepovinné'),JSON.stringify(measured));
        assert.equal(measured.display,'flex',JSON.stringify(measured));
        assert.equal(measured.nowrap,'nowrap',JSON.stringify(measured));
        assert(measured.scrollWidth<=measured.clientWidth+1,'No clipped label at '+width+': '+JSON.stringify(measured));
        assert(measured.weight.x>=measured.breed.x+measured.breed.width-1,'Inputs remain side by side at '+width);
        assert(Math.abs(measured.breed.y-measured.weight.y)<=2,'Inputs aligned at '+width+': '+JSON.stringify(measured));
        assert(!measured.bodyOverflow,'No page horizontal overflow at '+width);
        assert.deepEqual(errors,[]);
        console.log('PASS inline optional weight label',engine.name(),dogs,width);
      }finally{await context.close();}
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
