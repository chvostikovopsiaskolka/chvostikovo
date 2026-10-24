const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {PNG}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/pngjs');
const fixture=require('./liquid-v3-fixture.cjs');
const out=process.env.V3_SCREENSHOTS||'/tmp/chvo-v3-screenshots';fs.mkdirSync(out,{recursive:true});
const launch=type=>type.launch(type===chromium?{headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM).args:['--no-sandbox']}:{headless:true});
(async()=>{
 for(const type of process.env.V3_ENGINE==='webkit'?[webkit]:process.env.V3_ENGINE==='chromium'?[chromium]:[chromium,webkit]){
 let browser;const engine=type.name();
 try{for(const dogs of process.env.V3_LOW_CONTEXT?[1]:[1,2])for(const width of process.env.V3_LOW_CONTEXT?[390]:[320,360,390,430,844]){
 browser=await launch(type);const {page,context,errors}=await fixture(browser,dogs,width,engine);
 await page.evaluate(()=>{state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:6,status:'active',valid_until:'2099-12-31'}];renderPassSummary();renderDog();});await page.waitForTimeout(500);
 const nav=await page.locator('.bottom-nav').boundingBox();
 const diag=await page.evaluate(()=>window.customerLiquidV3Diagnostics?.());
 if(!process.env.V3_BASELINE){assert(diag);assert(diag.contexts<=2);assert(diag.mapGenerations<30);if(process.env.V3_LOW_CONTEXT){assert.equal(diag.contexts,0);assert.equal(diag.mapGenerations,0);}else if(engine==='webkit'){assert(diag.surfaces.some(s=>s.renderer==='webgl'),'WebKit must really render the WebGL output');assert(diag.contexts>=1&&diag.contexts<=2);}console.log('DIAGNOSTICS',engine,dogs,width,JSON.stringify(diag));}
 if(width===390)await page.screenshot({path:path.join(out,`${process.env.V3_LOW_CONTEXT?'fallback':process.env.V3_BASELINE?'before':'after'}-${engine}-${dogs}.png`),animations:'disabled'});
 for(const id of ['navDog','navBooking']){await page.locator('#'+id).click();await page.waitForTimeout(120);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'fixed dock survives tab switching');}
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(120);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'scroll does not reposition dock');
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(120);
 if(!process.env.V3_BASELINE&&engine==='chromium'&&width===390){
 // Pixel proof: compare the actual SVG backdrop lens to identical blur without
 // displacement. A supported CSS property alone is deliberately insufficient.
 const lens=page.locator('#designNearest>.lg-v3-material');
 const a=PNG.sync.read(await lens.screenshot());
 await lens.evaluate(el=>el.style.backdropFilter='blur(.65px) saturate(115%)');
 const b=PNG.sync.read(await lens.screenshot());
 await lens.evaluate(el=>el.style.removeProperty('backdrop-filter'));
 let changed=0;for(let i=0;i<a.data.length;i+=4)if(Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2])>6)changed++;
 assert(changed>30,'actual backdrop pixels must move with the lens');console.log('PASS SVG pixel refraction',dogs,changed);
 // Reduced transparency must release outputs and keep touchable sharp content.
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'},{name:'prefers-reduced-motion',value:'reduce'}]});await page.waitForTimeout(120);
 assert.equal(await page.locator('#designNearest>.lg-v3-material').evaluate(el=>getComputedStyle(el).backdropFilter),'none');assert.equal((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts,0);await cdp.detach();
 }
 if(!process.env.V3_BASELINE&&engine==='webkit'&&width===390&&!process.env.V3_LOW_CONTEXT){
  // Execute the SAME vendored WebGL optics over an explicit striped test source.
  // Compare scale20 with scale0 while keeping blur, material and content fixed.
  await page.evaluate(async()=>{
   const {createWebGLSurface}=await import('/vendor/simple-liquid-glass/webgl.js');
   const source=document.createElement('canvas');source.width=300;source.height=180;source.style.cssText='position:fixed;left:10px;top:30px;width:300px;height:180px';document.body.append(source);source.dataset.liquidGlassRevision='1';
   const c=source.getContext('2d');for(let x=0;x<300;x+=4){c.fillStyle=x%8?'#ffffee':'#123456';c.fillRect(x,0,4,180);}
   const panel=document.createElement('div');panel.id='v3-webgl-proof';panel.style.cssText='position:fixed;left:10px;top:30px;width:300px;height:180px;z-index:99999;overflow:hidden';document.body.append(panel);
   const opts={map:LiquidLens.makeDisplacementMap(300,180,24,18),scale:20,dispersion:0,specular:0,classic:false,neutralPoint:128/255,radius:24,blur:0,saturation:100};
   let active;const ready=new Promise(r=>active=r);const engine=createWebGLSurface(panel,panel,source,opts,status=>{if(status==='active')active();});await ready;
   window.__v3Proof={engine,source,panel,opts};
  });
  const proof=page.locator('#v3-webgl-proof');const a=PNG.sync.read(await proof.screenshot());
  await page.evaluate(()=>__v3Proof.engine.update({...__v3Proof.opts,scale:0}));await page.waitForTimeout(120);
  const b=PNG.sync.read(await proof.screenshot());let edge=0,centre=0;
  for(let y=25;y<a.height-25;y++)for(let x=2;x<a.width-2;x++){const i=(y*a.width+x)*4,d=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);if(d>15){if(x<20||x>a.width-20)edge++;else if(x>40&&x<a.width-40)centre++;}}
  assert(edge>100,'WebGL must bend pixels at the edge');assert(centre<20,'lens centre must remain identity');console.log('PASS WebKit actual WebGL edge pixels/identity centre',edge,centre);
  await page.evaluate(()=>{__v3Proof.engine.destroy();__v3Proof.source.remove();__v3Proof.panel.remove();delete window.__v3Proof;});
  // Deterministic lifecycle events: release GPU resources while backgrounded,
  // then rebuild once on foreground without changing the dock geometry.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts,0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(500);assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).contexts<=2);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);
 }

 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS actual runtime/nav/scroll/overflow',engine,dogs,width);
 await context.close();await browser.close();
 }}finally{await browser?.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
