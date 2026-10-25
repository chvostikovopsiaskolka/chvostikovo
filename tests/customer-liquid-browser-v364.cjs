const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {PNG}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/pngjs');
async function assertPawsTransmit(page,selector,background){
 const target=page.locator(selector).first();await target.scrollIntoViewIfNeeded();
 const a=PNG.sync.read(await target.screenshot({animations:'disabled'}));
 const saved=await page.locator(background).evaluate(el=>{const previous=el.getAttribute('style');el.style.setProperty('background-image','none','important');return previous;});
 const b=PNG.sync.read(await target.screenshot({animations:'disabled'}));
 await page.locator(background).evaluate((el,saved)=>{if(saved===null)el.removeAttribute('style');else el.setAttribute('style',saved);},saved);
 assert.equal(a.width,b.width);assert.equal(a.height,b.height);let visible=0,max=0;
 for(let y=12;y<a.height-12;y++)for(let x=12;x<a.width-12;x++){let delta=0;for(let c=0;c<3;c++)delta+=Math.abs(a.data[(y*a.width+x)*4+c]-b.data[(y*b.width+x)*4+c]);max=Math.max(max,delta);if(delta>=8)visible++;}
 assert(visible>=20&&max>=8,selector+' must visibly transmit actual background paws: '+JSON.stringify({visible,max}));console.log('PASS actual paw transmission',selector,{visible,max});
}

(async()=>{
 const packed=process.env.PACKED_CHROMIUM?require(process.env.PACKED_CHROMIUM):null;
 const launch=()=>chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:packed?packed.args:['--no-sandbox']});
 let browser;try{for(const dogs of [1,2])for(const width of [320,360,390,430,844,1280]){
  browser=await launch();
  const height=width===844?390:844,context=await browser.newContext({viewport:{width,height},isMobile:width<1280,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url()),f=path.join(process.cwd(),url.pathname==='/'?'index.html':url.pathname);if(url.hostname==='inbox.fixture'&&fs.existsSync(f))await route.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':'text/html'});else if(url.pathname.includes('/storage/'))await route.fulfill({body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=','base64'),contentType:'image/png'});else await route.fulfill({body:'[]',contentType:'application/json'});});
  await page.addInitScript(()=>{sessionStorage.setItem('chvostikovo_install_guide_seen_v1','1');Object.defineProperty(navigator,'serviceWorker',{value:undefined});window.__noticeFixture=[];window.__noticeReads=[];window.__calls=[];window.fetch=async(url,opts={})=>{window.__calls.push(String(url));let data=[];if(String(url).includes('portal_announcements?'))data=window.__noticeFixture;if(String(url).includes('portal_announcement_dismissals?')){if(opts.method==='POST')window.__noticeReads.push(JSON.parse(opts.body).announcement_id);else data=window.__noticeReads.map(announcement_id=>({announcement_id}));}return {ok:true,status:200,json:async()=>data,text:async()=>JSON.stringify(data),headers:{get:()=>''}};};});
  await page.goto('https://inbox.fixture/');await page.waitForTimeout(400);
  await page.evaluate(dogs=>{queueCustomerSync=()=>{};window.runCustomerOnboardingV75=()=>{};state.session={user:{id:'synthetic-browser'},access_token:'fixture',expires_at:Date.now()/1000+3600};state.selectedDogId=1;state.data={profile:{status:'active',intro_guide_eligible:false,privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:Array.from({length:dogs},(_,i)=>({id:i+1,name:i?'Iris':'Bella',sex:i?'male':'female',default_entry_type:'single',photo_path:'fixture/dog',photo_url:i?null:'https://inbox.fixture/storage/fixture-dog.png',share_name_photo_at:'2026-01-01'})),messages:[],conversation_id:7,vaccinations:Array.from({length:dogs},(_,i)=>['rabies','infectious','kennel_cough'].map(vaccination_type=>({dog_id:i+1,vaccination_type,valid_until:'2099-12-31'}))).flat(),vaccination_proofs:Array.from({length:dogs},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),dog_onboarding:Array.from({length:dogs},(_,i)=>({dog_id:i+1,details_prompt_answered_at:'2026-01-01'})),passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}};showApp();renderAll();loading(false);window.__customerOnboardingCompleteV75=true;return loadAnnouncements(true);},dogs);
  assert.equal(await page.locator('#designTicket').count(),0,'no single entry card in the DOM');
  const nav=await page.locator('.bottom-nav').boundingBox();
  const centre=await page.locator('#navBookAddV220').boundingBox(),edge=await page.locator('#navBooking').boundingBox();assert(centre.width>edge.width,'booking action wider than side tabs');assert.equal(centre.height,edge.height,'all nav buttons equal height');assert.equal(await page.locator('.bottom-nav').evaluate(el=>el.parentElement.tagName),'BODY');
  assert.equal(await page.locator('#navBookAddV220').getAttribute('aria-label'),'Rezervovať miesto');
  const icon=await page.locator('#navBookAddV220 svg').boundingBox(),label=await page.locator('.booking-action-label-v369').boundingBox();assert(icon.y+icon.height<=label.y+1,'compact booking icon above single-line label');assert(label.x+label.width<=centre.x+centre.width,'label fits');

  for(const sex of ['female','male']){
   await page.evaluate(sex=>{state.data.dogs[0].sex=sex;renderDog();},sex);await page.waitForTimeout(60);
   const style=await page.locator('#bookingDogProfile').evaluate(el=>({frame:getComputedStyle(el).borderColor,width:getComputedStyle(el).borderWidth,bg:getComputedStyle(el).backgroundColor}));
   assert.equal(style.width,'0px');
   if(dogs===1)assert.equal(style.bg,sex==='male'?'rgba(135, 190, 240, 0.62)':'rgba(245, 154, 201, 0.62)');
   const name=await page.locator(dogs===1?'#bookingDogName':'.dual-dog-name-v241').first().evaluate(el=>({stroke:getComputedStyle(el).webkitTextStrokeWidth,color:getComputedStyle(el).color,size:getComputedStyle(el).fontSize}));assert.equal(name.stroke,'0px');assert(name.color!=='rgb(255, 255, 255)');
  }
  if(dogs===1){
   const photo=await page.locator('#bookingDogAvatar').boundingBox(),image=await page.locator('#bookingDogAvatar img').boundingBox(),info=await page.locator('.dog-overview-content').boundingBox();assert(Math.abs(photo.height-info.height)<1,'photo and information equal height');assert(image.width>=photo.width-8&&image.height>=photo.height-8,'photo fills frame including corners');assert.equal(await page.locator('#bookingDogAvatar img').evaluate(el=>getComputedStyle(el).borderRadius),'0px');assert(Math.abs(photo.y-info.y)<1,'aligned profile panels');
   const layout=await page.locator('.dog-overview-content').evaluate(el=>{
    const b=el.getBoundingClientRect();return [...el.querySelectorAll('#bookingDogName,button,button svg,button .overview-icon')].filter(x=>x.getBoundingClientRect().width).map(x=>{const r=x.getBoundingClientRect();return {id:x.id||x.tagName,left:r.left-b.left,right:b.right-r.right,top:r.top-b.top,bottom:b.bottom-r.bottom};});
   });
   assert(layout.every(x=>x.left>=-1&&x.right>=-1&&x.top>=-1&&x.bottom>=-1),JSON.stringify(layout));
   const fonts=await page.locator('#bookingVaccinationStatus>span:last-child,#bookingVisitCount>span:last-child,#bookingGradebook>span:last-child').evaluateAll(els=>els.map(el=>getComputedStyle(el).fontSize));assert.equal(fonts.length,3);assert.equal(new Set(fonts).size,1,'three equal information fonts');
  }
  if(dogs===2){const fonts=await page.locator('.dual-dog-info-v254').first().evaluate(el=>[...el.querySelectorAll('.dual-dog-status-v254>span:last-child,.dual-dog-visits-v254,.dual-dog-grades-v254')].map(x=>getComputedStyle(x).fontSize));assert.equal(fonts.length,3);assert.equal(new Set(fonts).size,1,'dual information font parity');
   for(const panel of await page.locator('.dual-dog-panel-v254').all()){
    const metrics=await panel.evaluate(el=>{const box=el.getBoundingClientRect(),info=el.querySelector('.dual-dog-info-v254'),i=info.getBoundingClientRect(),photo=el.querySelector('.dual-dog-picture-v241').getBoundingClientRect(),name=el.querySelector('.dual-dog-name-v241').getBoundingClientRect();return {width:box.width,info:i.width,topGap:photo.top-box.top,photo:photo.width,nameOverlap:name.top<photo.bottom&&name.bottom>photo.bottom,align:[...info.querySelectorAll('button')].map(b=>getComputedStyle(b).textAlign)}});
    assert(Math.abs(metrics.width-metrics.info-14)<2,'info fills panel width with equal gutters');assert(metrics.topGap>=9,'tinted padding extends above photo');assert(metrics.nameOverlap,'name plaque overlaps photo bottom');assert(metrics.align.every(a=>a==='left'),'information aligned left');if(width===390||width===430)assert(metrics.photo>128,'larger dual photos');
    const visual=await panel.evaluate(el=>{const p=el.querySelector('.dual-dog-picture-v241').getBoundingClientRect(),name=el.querySelector('.dual-dog-name-v241'),n=name.getBoundingClientRect(),info=el.querySelector('.dual-dog-info-v254');return{square:Math.abs(p.width-p.height),bg:getComputedStyle(info).backgroundColor,nameBg:getComputedStyle(name).backgroundColor,center:Math.abs(n.left+n.width/2-p.left-p.width/2),nameWidth:n.width,photoWidth:p.width};});assert(visual.square<1,'photo and placeholder stay square');assert.equal(visual.bg,'rgba(0, 0, 0, 0)','refractive card transparent white base, with bright sheen');assert.equal(visual.nameBg,'rgba(255, 255, 255, 0.94)','white name plaque');assert(visual.center<1,'centered name plaque');assert(visual.nameWidth<visual.photoWidth*.9,'content-width name plaque');
   }
  }
  const backgrounds=await page.evaluate(()=>[document.documentElement,document.body].map(el=>getComputedStyle(el).backgroundColor));assert.equal(backgrounds[0],backgrounds[1]);
  await page.locator('#navDog').click();assert(await page.evaluate(()=>document.documentElement.classList.contains('customer-liquid-v364')));
  await page.waitForSelector('#menuContact>.lg-v3-material',{state:'attached'});
  const menu=await page.locator('#menuContact').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderWidth,blur:getComputedStyle(el).backdropFilter}));assert.equal(menu.bg,'rgba(0, 0, 0, 0)');assert.equal(await page.locator('#menuContact>.lg-v3-material').count(),1,'menu has its own optical layer');assert.equal(menu.border,'0px');assert.equal(menu.blur,'none');const railStyle=await page.locator('.bottom-nav').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter}));assert.equal(railStyle.bg,'rgba(0, 0, 0, 0)','unfiltered fixed nav uses a paint-only glass layer');assert.equal(railStyle.blur,'none');const railGlass=await page.locator('.bottom-nav>.lg-v3-material').evaluate(el=>getComputedStyle(el).backdropFilter);assert.match(railGlass,/blur\((?:3|0\.65)px\)/,'inner nav optical layer');assert((await page.locator('.customer-social-instagram-v223').evaluate(el=>getComputedStyle(el).boxShadow)).includes('inset'));assert((await page.locator('.customer-social-facebook-v223').evaluate(el=>getComputedStyle(el).boxShadow)).includes('inset'));
  assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'menu rail stable');
  await page.locator('#menuSettingsGroup>summary').click();assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'expanded menu rail stable');await page.locator('#menuSettingsGroup>summary').click();
  assert.equal(await page.locator('#menuBuildVersion').textContent(),'Beta '+JSON.parse(fs.readFileSync('version.json')).version);
  assert(await page.locator('#menuBuildVersion').evaluate(el=>!!el.closest('#menuSettingsGroup')));
  if(dogs===1){
   await page.locator('#menuDogGroup>summary').click();
   for(const mode of ['details','vaccinations']){
    await page.locator(mode==='details'?'#menuDogDetails':'#menuVaccinations').click();await page.waitForTimeout(70);
    const modal=await page.locator('#dogDetailsModal').boundingBox();assert.equal(modal.y,0);assert.equal(modal.height,height);assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).display),'block','root stays block while editor opens');
    assert.equal(await page.locator('.bottom-nav').evaluate(el=>getComputedStyle(el).visibility),'hidden');
    const editorScrolls=await page.locator('#dogDetailsModal .dog-details-card').evaluate(async el=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));el.scrollTop=el.scrollHeight;return el.scrollHeight<=el.clientHeight||el.scrollTop>0;});assert(editorScrolls,'long editor scrolls');
    await page.locator('#dogDetailsClose').click();await page.waitForTimeout(70);
    await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(40);const touch=await context.newCDPSession(page),start=Math.round(height*.7),x=Math.round(width/2);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});for(let y=start-10;y>=Math.max(50,start-260);y-=10){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(16);}await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();await page.waitForTimeout(90);
    assert(await page.evaluate(()=>scrollY>0),'Menu scroll restored after '+mode);assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'rail stable after '+mode);
   }
   await page.evaluate(()=>window.scrollTo(0,0));
  }
  if(width===390){await assertPawsTransmit(page,'#menuContact','body');await page.evaluate(()=>scrollTo(0,0));}
  if(width===390)await page.screenshot({path:'/tmp/glass-v369-menu-'+dogs+'.png'});
  await page.locator('#navBooking').click();

  const panel=await page.locator(dogs===1?'.dog-overview-content':'.dual-dog-info-v254').first().evaluate((el,single)=>({border:getComputedStyle(el).borderLeftWidth,blur:getComputedStyle(el.querySelector('.lg-v3-material')).backdropFilter}),dogs===1);if(dogs===1)assert.equal(panel.border,'0px');assert.match(panel.blur,/blur\((?:3|0\.65)px\)/,'information panel uses Safari fallback or measured SVG refraction');
  await page.evaluate(()=>{state.data.dogs[0].sex='female';renderDog();});
  for(const status of ['active','queued']){
   await page.evaluate(status=>{state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:status==='queued'?0:6,status,valid_until:'2099-12-31'}];renderPassSummary();renderDog();},status);
   assert(await page.locator('#designTicket').isVisible());assert((await page.locator('#designTicket').textContent()).includes('10'));assert.equal(await page.locator('.design-paws>span').count(),10);const divider=await page.locator('.design-paws').evaluate(el=>({style:getComputedStyle(el).borderTopStyle,width:getComputedStyle(el).borderTopWidth}));assert.equal(divider.style,'dashed');assert.equal(divider.width,'2px');if(width===390&&status==='active')await page.screenshot({path:'/tmp/glass-v369-pass-active-'+dogs+'.png'});
  }
  assert(await page.locator('#customerMessagesV363').isVisible()&&await page.locator('#customerAnnouncementsV363').isVisible(),'both dock inbox actions remain visible after pass changes');
  if(width===390){await assertPawsTransmit(page, dogs===1?'.dog-overview-content':'.dual-dog-info-v254','body');await assertPawsTransmit(page,'#designTicket','body');await assertPawsTransmit(page,'#designNearest','body');await page.evaluate(()=>scrollTo(0,0));}
  await page.waitForTimeout(80);if(width===390){
   await page.screenshot({path:'/tmp/customer-liquid-v3-overview-'+dogs+'.png',animations:'disabled'});
  }
  await page.evaluate(()=>{state.data.passes=[];renderPassSummary();renderDog();state.data.dogs[0].name='Alexandriana Veľmi dlhé meno';renderDog();});assert.equal(await page.locator('#designTicket').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long name no horizontal overflow');if(dogs===1){const p=await page.locator('#bookingDogAvatar').boundingBox(),i=await page.locator('.dog-overview-content').boundingBox();assert(Math.abs(p.height-i.height)<1,'long name keeps matching panel heights');}
  await page.evaluate(()=>{bratislavaClockV95=()=>({date:'2099-01-01'});bratislavaToday=()=> '2099-01-01';state.data.availability={days:Array.from({length:15},(_,i)=>({date:'2099-01-'+String(5+i+Math.floor(i/5)*2).padStart(2,'0'),available:8,capacity:10,occupied:2,bookings_open:true,dogs:[]}))};});await page.locator('#navBookAddV220').click();await page.waitForTimeout(100);
  assert.equal(await page.locator('#designCapacityLegend').count(),0);assert(await page.locator('#designMyBookings').isVisible());assert(await page.locator('#bookingPickerDaysV37').isVisible());assert.equal(await page.locator('#bookingPickerV37').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 208, 174)');
  assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'reservation rail stable');assert((await page.locator('.booking-picker-week-v127').first().evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)))>=10);
  const bounds=await page.locator('#bookingPickerDaysV37').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert(bounds.scroll<=bounds.width+1);assert((await page.locator('.booking-picker-week-v127').first().evaluate(el=>getComputedStyle(el).boxShadow)).includes('inset'),'week boundary');assert((await page.locator('.booking-day-v37').first().evaluate(el=>getComputedStyle(el).boxShadow)).includes('inset'),'day boundary');
  if(width===390){await assertPawsTransmit(page,'#bookingPickerDaysV37','#bookingPickerV37');assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav,'nav stable after calendar pixel check');assert(await page.locator('.bottom-nav').isVisible(),'nav visible after calendar pixel check');}
  await page.waitForTimeout(80);if(width===390)await page.screenshot({path:'/tmp/liquid-v364-reservations-'+dogs+'.png'});
  await page.evaluate(()=>window.closeBookingPickerV305());
  await page.evaluate(()=>{window.__noticeFixture=[{id:1,active:true,title:'Zbierka',body:'Synthetic full article',valid_from:'2020-01-01'}];return loadAnnouncements(true);});
  await page.locator('#customerMessagesV363').click();await page.waitForTimeout(70);
  const chat=await page.locator('.support-chat-card-v52').boundingBox();assert(Math.abs(chat.y+(chat.height/2)-height/2)<2,'chat initially centered');
  await page.evaluate(()=>{window.__originalV370={height:visualViewport.height,top:visualViewport.offsetTop};Object.defineProperty(visualViewport,'height',{configurable:true,value:Math.max(200,innerHeight/2)});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:20});visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(70);
  const keyboardChat=await page.locator('.support-chat-card-v52').boundingBox();assert(keyboardChat.y>=20&&keyboardChat.y+keyboardChat.height<=20+Math.max(200,height/2),'chat fits keyboard viewport');
  await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:window.__originalV370.height});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:window.__originalV370.top});visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(70);
  assert.deepEqual(await page.locator('.support-chat-card-v52').boundingBox(),chat,'chat restores original position after keyboard');await page.locator('#supportChatCloseV52').click();await page.waitForTimeout(70);
  await page.locator('#customerAnnouncementsV363').click();await page.locator('[data-announcement-id="1"]').click();
  const heading=await page.locator('#customerBulletinArticleV229 h2').boundingBox(),close=await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').boundingBox();assert(Math.abs(heading.y+heading.height/2-close.y-close.height/2)<1,'article heading aligns with X');
  await page.locator('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(80);await page.locator('#customerBulletinHistoryV229 .customer-bulletin-close-v229').click();await page.waitForTimeout(80);
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]});assert(await page.evaluate(()=>matchMedia('(prefers-reduced-transparency:reduce)').matches));
  const fallback=await page.locator('#designNearest>.lg-v3-material').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el).backdropFilter}));assert.equal(fallback.blur,'none');assert.equal(fallback.bg,'rgb(255, 249, 243)');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);assert.deepEqual(errors,[]);console.log('PASS Liquid browser 1/2 sex/long name/no single/active+queued/75%+header/calendar/fallback/nav',dogs,width);await context.close();await browser.close();
 }}finally{await browser?.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
