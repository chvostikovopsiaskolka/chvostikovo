const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {PNG}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/pngjs');
const fixture=require('./liquid-v3-fixture.cjs');
const type=process.env.V3_ENGINE==='webkit'?webkit:chromium;
(async()=>{for(const [dogs,width] of [[1,320],[1,390],[2,390],[1,844]]){
 const browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM).args:['--no-sandbox']}:{});
 try{const {page,errors}=await fixture(browser,dogs,width,process.env.V389_FORCE_WEBGL?'webkit':type.name());
 await page.evaluate(()=>{
  const day=new Date(overviewClock().date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+((8-day.getUTCDay())%7||7));
  const at=n=>{const d=new Date(day);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
  state.data.availability.days=[0,1,2,3,4,7,8,9,10,11].map(n=>({date:at(n),available:8,capacity:10,bookings_open:true}));
  state.data.requests=[{id:1,reservation_id:1,dog_id:1,reservation_date:at(0),status:'approved',taxi_mode:'none',can_manage:true,entry_type:'single'}];
  state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:0,status:'active',valid_until:'2099-12-31'}];
  renderAll();
  // Ensure a long scrollable overview, like the customer's approved booking.
  document.querySelector('#bookingTab').style.minHeight='1400px';
 });
 const profile=page.locator(dogs===1?'.dog-overview-content':'.dual-dog-info-v254').first();
 await profile.locator(':scope>.lg-v3-material').waitFor({state:'attached'});
 await page.waitForTimeout(250);
 const nav=await page.locator('.bottom-nav').boundingBox();
 const photo=await page.locator('#bookingDogAvatar').elementHandle();
 if(type===webkit||process.env.V389_FORCE_WEBGL){
  await page.waitForFunction(()=>document.querySelector('.dog-overview-content>.lg-v3-material,.dual-dog-info-v254>.lg-v3-material')?.dataset.renderer==='webgl');
  const texture=await page.locator('.lg-v3-profile-source').count()?await page.locator('.lg-v3-profile-source').first().elementHandle():null;
  const raster=texture?await texture.evaluate(el=>el.dataset.liquidGlassRevision):null;
  // Move the profile without a document scroll event: this reproduces the
  // viewport-raster/compositor mismatch behind the reported white bands.
  const panel=profile.locator('..');
  if(texture){const r=await texture.evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();return{left:b.left-a.left,top:b.top-a.top,width:a.width-b.width,height:a.height-b.height};});assert(Math.abs(r.left-32)<1&&Math.abs(r.top-32)<1&&Math.abs(r.width-64)<1&&Math.abs(r.height-64)<1,'padded texture follows its own single/dual panel');}

  await panel.evaluate(el=>el.style.transform='translateY(65px)');await page.waitForTimeout(200);
  const png=PNG.sync.read(Buffer.from((await profile.locator('canvas[data-liquid-glass-webgl]').evaluate(el=>el.toDataURL())).split(',')[1],'base64'));
  const ratio=await profile.evaluate(el=>({w:el.offsetWidth,h:el.offsetHeight,dpr:Math.min(devicePixelRatio||1,3)}));
  const x=Math.round((20+ratio.w*.7)*ratio.dpr);let white=0,total=0;
  for(let y=Math.ceil(26*ratio.dpr);y<(14+ratio.h)*ratio.dpr;y++){const i=(y*png.width+x)*4;if(png.data[i+3]>200){total++;if(png.data[i]>235&&Math.abs(png.data[i]-png.data[i+1])<10)white++;}}
  assert(total>30);assert(white/total<.03,'profile GPU pixels must not turn into white viewport bands');
  await panel.evaluate(el=>el.style.removeProperty('transform'));
  for(const y of [30,70,110,40,0]){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(60);}
  assert(await texture.evaluate(el=>el.isConnected),'scroll reuses the local texture');
  assert.equal(await texture.evaluate(el=>el.dataset.liquidGlassRevision),raster,'ordinary scroll does not rerasterize profile');
 }
 assert(await photo.evaluate(el=>el===document.querySelector('#bookingDogAvatar')),'scroll preserves photo node');
 assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);
 assert((await page.evaluate(()=>customerLiquidV3Diagnostics())).peakContexts<=2);
 if(width===390){fs.mkdirSync('/tmp/chvo-v389-screenshots',{recursive:true});await page.screenshot({path:`/tmp/chvo-v389-screenshots/overview-${type.name()}-${dogs}.png`});}
 await page.locator('#navBookAddV220').click();
 await page.locator('#bookingPickerV37 .booking-day-v37:not(.disabled):not(.booked)').last().click();
 await page.locator('.design-selected-day').first().waitFor();
 const box=await page.locator('.design-selected-days').evaluate(el=>{const c=el.firstElementChild,r=el.getBoundingClientRect(),b=c.getBoundingClientRect(),s=getComputedStyle(c);return{left:b.left-r.left,top:b.top-r.top,bottom:el.scrollHeight-(c.offsetTop-el.offsetTop+c.offsetHeight),shadow:s.boxShadow};});
 assert(box.left>=9&&box.top>=7,'selected-day scrollport reserves room around rounded corners');assert(box.shadow.includes('16px'));
 assert(await page.locator('#designMyBookings .reserved-day-card-v37').first().evaluate(el=>getComputedStyle(el).boxShadow.includes('14px')),'approved card is separated by shadow');
 if(width===390)await page.screenshot({path:`/tmp/chvo-v389-screenshots/booking-${type.name()}-${dogs}.png`,fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS approved reservation/profile scroll/no white bands/selected corners/shadows',type.name(),dogs,width);
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
