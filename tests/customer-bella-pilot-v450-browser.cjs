const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const engine=process.env.V3_ENGINE==='webkit'?webkit:chromium;
const pilot='synthetic-bella-owner',ordinary='synthetic-browser';
const hash=createHash('sha256').update(pilot).digest('hex');
const design=fs.readFileSync('customer-design.js','utf8');
assert.match(design,/BELLA_PILOT_ACCOUNT_SHA256_V450='[a-f0-9]{64}'/);
const syntheticDesign=design.replace(/BELLA_PILOT_ACCOUNT_SHA256_V450='[a-f0-9]{64}'/,"BELLA_PILOT_ACCOUNT_SHA256_V450='"+hash+"'");
(async()=>{
 let browser;try{
 browser=await engine.launch(engine===webkit?{headless:true}:{headless:true,args:['--no-sandbox']});
 for(const dogs of [1,2])for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
 const url=new URL(route.request().url()),f=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);
 if(url.hostname==='inbox.fixture'&&fs.existsSync(f))return route.fulfill({body:url.pathname==='/customer-design.js'?syntheticDesign:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':'text/html'});
 return route.fulfill({body:'[]',contentType:'application/json'});
 });
  await page.addInitScript(()=>{const NativeDate=Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[window.__calendarTestNowV442||NativeDate.now()]));}static now(){return window.__calendarTestNowV442?new NativeDate(window.__calendarTestNowV442).getTime():NativeDate.now();}};sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');Object.defineProperty(navigator,'serviceWorker',{value:undefined});window.__noticeFixture=[];window.__noticeReads=[];window.__calls=[];window.fetch=async(url,opts={})=>{window.__calls.push(String(url));let data=[];if(String(url).includes('portal_announcements?'))data=window.__noticeFixture;if(String(url).includes('portal_announcement_dismissals?')){if(opts.method==='POST')window.__noticeReads.push(JSON.parse(opts.body).announcement_id);else data=window.__noticeReads.map(announcement_id=>({announcement_id}));}return {ok:true,status:200,json:async()=>data,text:async()=>JSON.stringify(data),headers:{get:()=>''}};};});
  await page.goto('https://inbox.fixture/');await page.waitForTimeout(400);
  await page.evaluate(dogs=>{queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'synthetic-browser'},access_token:'fixture',expires_at:Date.parse('2100-01-01T00:00:00Z')/1000};state.selectedDogId=1;state.data={profile:{status:'active',intro_guide_eligible:false,privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:Array.from({length:dogs},(_,i)=>({id:i+1,name:i?'Iris':'Bella',sex:i?'male':'female',default_entry_type:'single',photo_path:'fixture/dog',photo_url:i?null:'https://inbox.fixture/storage/fixture-dog.png',share_name_photo_at:'2026-01-01'})),messages:[],conversation_id:7,vaccinations:Array.from({length:dogs},(_,i)=>['rabies','infectious','kennel_cough'].map(vaccination_type=>({dog_id:i+1,vaccination_type,valid_until:'2099-12-31'}))).flat(),vaccination_proofs:Array.from({length:dogs},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),dog_onboarding:Array.from({length:dogs},(_,i)=>({dog_id:i+1,details_prompt_answered_at:'2026-01-01'})),passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}};showApp();renderAll();loading(false);window.__customerOnboardingCompleteV75=true;return loadAnnouncements(true);},dogs);

 await page.evaluate(()=>{window.__calendarTestNowV442='2026-11-28T08:00:00.000Z';state.data.availability.days=Array.from({length:5},(_,i)=>({date:['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04'][i],capacity:11,occupied:[2,7,10,11,0][i],available:[9,4,1,0,11][i],bookings_open:i!==4}));state.data.passes=[{id:81,dog_id:1,status:'active',used_entries:3,total_entries:10,valid_from:'2026-11-03',valid_until:'2026-12-23'}];renderAll();});
 const count=()=>page.locator('#customerBellaPilotV450').count();
 const meter=page.locator('#designTicket .design-pass-meter-v452');
 assert.equal(await meter.count(),0,'ordinary account has no private pass meter');
 assert.equal(await page.locator('#designTicket .design-validity').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','ordinary date appearance unchanged');
 assert.equal(await count(),0,'ordinary account has no Bella');
 await page.evaluate(()=>{window.openBookingPickerV37();window.customerDesignRefreshCalendarV351()});
 assert.equal(await page.locator('.bella-capacity-v450').count(),dogs===2?2:3,'public strips only on days with enough places for selected dogs');
 const onePlace=page.locator('.booking-day-v37[data-date="2026-12-02"]');
 if(dogs===2){
   assert.equal(await page.locator('#bookingPickerDogV37').inputValue(),'both');
   assert.equal(await onePlace.getAttribute('data-full'),'true');
   assert.equal(await onePlace.locator('.bella-capacity-v450').count(),0);
   await page.locator('[data-compact-dog="1"]').click();
   assert.equal(await onePlace.locator('.bella-capacity-v450').count(),1,'one remaining place is available for one dog');
   await page.locator('[data-compact-dog="both"]').click();
   assert.equal(await onePlace.locator('.bella-capacity-v450').count(),0,'pair needs two places');
 }
 assert(Math.abs(parseFloat(await page.locator('.booking-day-v37[data-date="2026-11-30"] .bella-capacity-v450>i').evaluate(el=>el.style.width))-200/11)<.01);
 await page.evaluate(()=>{window.closeBookingPickerV305();state.session.user.id='synthetic-bella-owner';renderAll();});
 await page.locator('#customerBellaPilotV450').waitFor({state:'visible'});
 await meter.waitFor({state:'visible'});
 assert.equal(await meter.getAttribute('aria-valuenow'),'50');
 assert.equal(await meter.locator('span').evaluate(el=>el.style.width),'50%');
 const alignment=await meter.evaluate(el=>({right:el.getBoundingClientRect().right,dateRight:el.closest('#designTicket').querySelector('.design-validity').getBoundingClientRect().right,direction:getComputedStyle(el).direction}));
 assert(Math.abs(alignment.right-alignment.dateRight)<2,'track ends below the date');
 assert.equal(alignment.direction,'ltr');
 const assertConnected=async()=>{
   const geometry=await meter.evaluate(el=>{const badge=el.closest('#designTicket').querySelector('.design-validity'),b=badge.getBoundingClientRect(),m=el.getBoundingClientRect(),style=getComputedStyle(badge);return {gap:m.top-b.bottom,right:m.right-b.right,bg:style.backgroundColor,track:getComputedStyle(el).backgroundColor,bottomRight:style.borderBottomRightRadius,overflow:b.right>m.right+1};});
   assert(Math.abs(geometry.gap)<1,'date badge physically touches track');
   assert(Math.abs(geometry.right)<2,'date badge aligns with track end');
   assert.equal(geometry.bg,geometry.track,'date background and track form one shape');
   assert.equal(geometry.bottomRight,'0px');assert.equal(geometry.overflow,false);
 };
 await assertConnected();
 assert.equal(await page.locator('#designTicket').getAttribute('data-validity-level'),'green');
 assert.equal(await page.locator('#designTicket .design-paws').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
 assert.equal(await page.locator('#designTicket .design-paws .used').count(),3);
 assert.match(await page.locator('#designTicket .design-validity').textContent(),/23\.\s*12/);
 assert(await meter.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.evaluate(()=>{state.data.passes[0].valid_until='2026-12-03';renderAll();});
 assert.equal(await page.locator('#designTicket').getAttribute('data-validity-level'),'yellow');
 assert(Number(await meter.getAttribute('aria-valuenow'))>75,'elapsed fill grows toward date');
 await assertConnected();
 await page.evaluate(()=>{state.data.passes[0].valid_until='2026-11-30';renderAll();});
 assert.equal(await page.locator('#designTicket').getAttribute('data-validity-level'),'red');
 assert(Number(await meter.getAttribute('aria-valuenow'))>90);
 await assertConnected();
 await page.evaluate(()=>{state.data.passes[0].valid_until='2026-11-28';renderAll();});
 assert.equal(await meter.getAttribute('aria-valuenow'),'100');
 assert.equal(await meter.getAttribute('data-complete'),'true');
 assert.equal(await meter.evaluate(el=>getComputedStyle(el.closest('#designTicket').querySelector('.design-validity')).backgroundColor===getComputedStyle(el.firstElementChild).backgroundColor),true,'fully elapsed bar connects to filled date badge');
 await page.evaluate(()=>{state.data.passes[0].no_expiry=true;renderAll();});
 assert.equal(await meter.count(),0,'unlimited pass has no time meter');
 await page.evaluate(()=>{state.data.passes=[];renderAll();});
 assert.equal(await page.locator('#customerBellaPilotV450 img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
 assert.match(await page.locator('.bella-message-v450').textContent(),/Haf!/);
 const assistant=page.locator('#customerBellaPilotV450');
 assert.equal(await assistant.evaluate(el=>el.parentElement.id),'bookingTab');
 assert.equal(await assistant.evaluate(el=>getComputedStyle(el).position),'fixed');
 const before=await assistant.boundingBox();
 await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='bellaFixtureSpacer';spacer.style.height='900px';document.getElementById('bookingTab').append(spacer);window.scrollTo(0,220);});
 await page.waitForFunction(()=>window.scrollY>100);
 assert(Math.abs((await assistant.boundingBox()).y-before.y)<1,'assistant remains fixed during scroll');
 assert(await assistant.evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top+1),'assistant stays above dock');
 await page.evaluate(()=>{window.scrollTo(0,0);document.getElementById('bellaFixtureSpacer').remove();});
 assert.equal(await assistant.locator('.bella-message-v450').evaluate(el=>getComputedStyle(el).color),'rgb(36, 118, 70)');
 assert.equal(await assistant.locator('.bella-bubble-v450').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(239, 139, 55)');
 assert(await page.locator('#customerBellaPilotV450').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.locator('.bella-action-v450').click();
 await page.locator('#bookingPickerV37').waitFor({state:'visible'});
 assert.equal(await assistant.evaluate(el=>getComputedStyle(el).visibility),'hidden','assistant never covers picker');
 const one=page.locator('.booking-day-v37[data-date="2026-11-30"]');
 assert.equal(await one.locator(':scope > span').textContent(),'Voľné: 9');
 assert(Math.abs(parseFloat(await one.locator('.bella-capacity-v450>i').evaluate(el=>el.style.width))-200/11)<.01,'true occupied/capacity');
 assert(Math.abs((await one.boundingBox()).height-48)<1);
 assert.equal(await page.locator('.booking-day-v37[data-date="2026-12-03"] .bella-capacity-v450').count(),0);
 assert.equal(await page.locator('.booking-day-v37[data-date="2026-12-04"] .bella-capacity-v450').count(),0);
 assert.equal(await page.locator('[data-preview-date] .bella-capacity-v450,#guidePickerPreviewV360 .bella-capacity-v450').count(),0);
 await page.evaluate(()=>{window.closeBookingPickerV305();state.data.requests=[{id:991,dog_id:1,reservation_date:'2026-11-30',status:'approved'}];renderAll();});
 assert.match(await page.locator('.bella-message-v450').textContent(),/Bella/);
 await page.evaluate(()=>{window.__noticeFixture=[{id:71,active:true,title:'Otváracie dni počas sviatkov 🟢🔴',body:'Fixture',valid_from:'2020-01-02',show_in_overview:true},{id:72,active:true,title:'Veľmi dlhý testovací nadpis oznamu s ďalším textom a emoji 🐾🎄',body:'Other fixture',valid_from:'2020-01-01',show_in_overview:true}];return loadAnnouncements(true)});
 assert.match(await page.locator('.bella-message-v450').textContent(),/Otváracie dni počas sviatkov/);
 const headline=page.locator('#customerNoticeOverviewV376 [data-announcement-id="71"] .customer-notice-head-v363 strong');
 assert.equal(await headline.textContent(),'Otváracie dni počas sviatkov 🟢🔴');
 assert.equal(await headline.evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
 assert(await headline.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'holiday title fits one line including emoji');
 const longTitle=page.locator('#customerNoticeOverviewV376 [data-announcement-id="72"] .customer-notice-head-v363 strong');
 assert.equal(await longTitle.evaluate(el=>getComputedStyle(el).textOverflow),'ellipsis');
 await page.evaluate(()=>{state.data.passes=[{id:82,dog_id:1,status:'active',used_entries:3,total_entries:10,valid_from:'2026-11-03',valid_until:'2026-12-23'}];renderAll();});
 await meter.waitFor({state:'visible'});
 await page.evaluate(()=>{state.session.user.id='synthetic-browser';renderAll();});
 assert.equal(await count(),0,'switch removes pilot immediately');
 assert.equal(await meter.count(),0,'switch removes private meter immediately');
 assert.equal(await page.locator('#designTicket .design-paws').evaluate(el=>getComputedStyle(el).borderTopStyle),'dashed');
 await page.evaluate(()=>{window.openBookingPickerV37();window.customerDesignRefreshCalendarV351()});
 assert.equal(await page.locator('.bella-capacity-v450').count(),dogs===2?1:2,'unreserved public bars survive account switch');
 if(dogs===2){
   assert.equal(await page.locator('.booking-day-v37[data-date="2026-12-02"] .bella-capacity-v450').count(),0,'pair cannot reserve one remaining place');
   await page.locator('[data-compact-dog="1"]').click();
 }
 assert.equal(await page.locator('.booking-day-v37[data-date="2026-11-30"] .bella-capacity-v450').count(),0,'already reserved day does not display capacity bar');
 for(const [date,occupied] of [['2026-12-01',7],['2026-12-02',10]]){
   const bar=page.locator('.booking-day-v37[data-date="'+date+'"] .bella-capacity-v450>i');
   assert.equal(await bar.count(),1);
   assert(Math.abs(parseFloat(await bar.evaluate(el=>el.style.width))-occupied/11*100)<.01,'public occupancy ratio after switch');
 }
 await page.evaluate(()=>{window.closeBookingPickerV305();state.session.user.id='synthetic-bella-owner';renderAll();clearSession();});
 await page.waitForTimeout(100);
 assert.equal(await count(),0,'late digest must not remount after logout');
 assert.equal(await meter.count(),0,'logout cannot retain or remount private meter');
 assert.equal(await page.locator('.bella-capacity-v450').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS isolated Bella, occupancy, ordinary account, switch/logout',engine.name(),dogs,width);
 await context.close();
 }
 }finally{await browser?.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
