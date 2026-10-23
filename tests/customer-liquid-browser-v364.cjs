const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{
 const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;
 const launch=()=>chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?packed.args:['--no-sandbox']});
 let browser;try{for(const dogs of [1,2])for(const width of [320,360,390,430,844,1280]){
  browser=await launch();
  const height=width===844?390:844,context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block',userAgent:dogs===1?'Mozilla/5.0 (Linux; Android 14) Chrome/138':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url()),f=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);if(url.hostname==='inbox.fixture'&&fs.existsSync(f))await route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html'});else if(url.pathname.includes('/storage/'))await route.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=','base64'),contentType:'image/png'});else await route.fulfill({body:'[]',contentType:'application/json'});});
  await page.addInitScript(()=>{sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');Object.defineProperty(navigator,'serviceWorker',{value:undefined});window.__noticeFixture=[];window.__noticeReads=[];window.__calls=[];window.fetch=async(url,opts={})=>{window.__calls.push(String(url));let data=[];if(String(url).includes('portal_announcements?'))data=window.__noticeFixture;if(String(url).includes('portal_announcement_dismissals?')){if(opts.method==='POST')window.__noticeReads.push(JSON.parse(opts.body).announcement_id);else data=window.__noticeReads.map(announcement_id=>({announcement_id}));}return {ok:true,status:200,json:async()=>data,text:async()=>JSON.stringify(data),headers:{get:()=>''}};};});
  await page.goto('https://inbox.fixture/');await page.waitForTimeout(400);
  await page.evaluate(dogs=>{queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'synthetic-browser'},access_token:'fixture',expires_at:Date.now()/1000+3600};state.selectedDogId=1;state.data={profile:{status:'active',intro_guide_eligible:false,privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:Array.from({length:dogs},(_,i)=>({id:i+1,name:i?'Iris':'Bella',sex:i?'male':'female',default_entry_type:'single',photo_path:'fixture/dog',share_name_photo_at:'2026-01-01'})),messages:[],conversation_id:7,vaccinations:Array.from({length:dogs},(_,i)=>['rabies','infectious','kennel_cough'].map(vaccination_type=>({dog_id:i+1,vaccination_type,valid_until:'2099-12-31'}))).flat(),vaccination_proofs:Array.from({length:dogs},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),dog_onboarding:Array.from({length:dogs},(_,i)=>({dog_id:i+1,details_prompt_answered_at:'2026-01-01'})),passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}};showApp();renderAll();loading(false);window.__customerOnboardingCompleteV75=true;return loadAnnouncements(true);},dogs);
  assert.equal(await page.locator('#designTicket').count(),0,'no single entry card in the DOM');
  const nav=await page.locator('.bottom-nav').boundingBox();
  for(const sex of ['female','male']){
   await page.evaluate(sex=>{state.data.dogs[0].sex=sex;renderDog();},sex);
   const style=await page.locator('#bookingDogProfile').evaluate(el=>({frame:getComputedStyle(el).borderColor,width:getComputedStyle(el).borderWidth,bg:getComputedStyle(el).backgroundColor}));
   assert.equal(style.frame,'rgb(255, 255, 255)');assert.equal(style.width,'3px');
   if(dogs===1)assert.equal(style.bg,sex==='male'?'rgb(220, 236, 251)':'rgb(249, 222, 237)');
   const name=await page.locator(dogs===1?'#bookingDogName':'.dual-dog-name-v241').first().evaluate(el=>({stroke:getComputedStyle(el).webkitTextStrokeWidth,color:getComputedStyle(el).color,size:getComputedStyle(el).fontSize}));assert.equal(name.stroke,'0px');assert(name.color!=='rgb(255, 255, 255)');
  }
  const panel=await page.locator(dogs===1?'.dog-overview-content':'.dual-dog-info-v254').first().evaluate((el,single)=>({border:getComputedStyle(el).borderLeftWidth,blur:getComputedStyle(el,single?'::before':null).backdropFilter}),dogs===1);if(dogs===1)assert.equal(panel.border,'0px');assert.equal(panel.blur,'blur(4px)');
  for(const status of ['active','queued']){
   await page.evaluate(status=>{state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:status==='queued'?0:6,status,valid_until:'2099-12-31'}];renderPassSummary();renderDog();},status);
   assert(await page.locator('#designTicket').isVisible());assert((await page.locator('#designTicket').textContent()).includes('10'));assert.equal(await page.locator('.design-paws>span').count(),10);
  }
  assert(await page.locator('#customerInboxV363').isVisible(),'inbox remains visible after pass changes');
  await page.waitForTimeout(80);if(width===390)await page.screenshot({path:'/tmp/liquid-v364-overview-'+dogs+'.png'});
  await page.evaluate(()=>{state.data.passes=[];renderPassSummary();renderDog();state.data.dogs[0].name='Alexandriana Veľmi dlhé meno';renderDog();});assert.equal(await page.locator('#designTicket').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long name no horizontal overflow');
  await page.evaluate(()=>{bratislavaClockV95=()=>({date:'2099-01-01'});bratislavaToday=()=> '2099-01-01';state.data.availability={days:Array.from({length:15},(_,i)=>({date:'2099-01-'+String(5+i+Math.floor(i/5)*2).padStart(2,'0'),available:8,capacity:10,occupied:2,bookings_open:true,dogs:[]}))};window.openBookingPickerV37();});await page.waitForTimeout(100);
  assert(await page.locator('#designMyBookings').isVisible());assert(await page.locator('#bookingPickerDaysV37').isVisible());assert.equal(await page.locator('#bookingPickerV37').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 177, 124)');
  const bounds=await page.locator('#bookingPickerDaysV37').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert(bounds.scroll<=bounds.width+1);
  await page.waitForTimeout(80);if(width===390)await page.screenshot({path:'/tmp/liquid-v364-reservations-'+dogs+'.png'});
  await page.evaluate(()=>window.closeBookingPickerV305());
  await page.evaluate(()=>{window.__noticeFixture=[{id:1,active:true,title:'Zbierka',body:'Synthetic full article',valid_from:'2020-01-01'}];return loadAnnouncements(true);});
  await page.locator('#customerAnnouncementsV363').click();await page.locator('[data-announcement-id="1"]').click();
  const heading=await page.locator('#customerBulletinArticleV229 h2').boundingBox(),close=await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').boundingBox();assert(Math.abs(heading.y+heading.height/2-close.y-close.height/2)<1,'article heading aligns with X');
  await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(80);await page.locator('#customerBulletinHistoryV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(80);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});assert(await page.evaluate(()=>matchMedia('(prefers-reduced-transparency:reduce)').matches));
  const fallback=await page.locator('#designNearest').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter}));assert.equal(fallback.blur,'none');assert.equal(fallback.bg,'rgb(255, 249, 243)');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});await page.evaluate(()=>{for(const sheet of document.styleSheets){for(let i=sheet.cssRules.length-1;i>=0;i--){const r=sheet.cssRules[i];if(r instanceof CSSSupportsRule&&r.cssText.includes('--liquid-surface-v364'))sheet.deleteRule(i);}}});const unsupported=await page.locator('#designNearest').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter}));assert.equal(unsupported.blur,'none');assert.equal(unsupported.bg,'rgb(255, 249, 243)');
  assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);assert.deepEqual(errors,[]);console.log('PASS Liquid browser 1/2 sex/long name/no single/active+queued/75%+header/calendar/fallback/nav',dogs,width);await context.close();await browser.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
