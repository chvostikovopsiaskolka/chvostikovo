const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
(async()=>{const type=process.env.V3_ENGINE==='webkit'?webkit:chromium,browser=await type.launch(type===chromium?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{});try{
 for(const dogs of [1,2])for(const width of [320,390,430,844]){
  const {page,context,errors}=await require('./liquid-v3-fixture.cjs')(browser,dogs,width,type.name());
  const layout=await page.evaluate(()=>{const el=document.querySelector('#bookingTab'),c=getComputedStyle(el);return {height:c.height,overflow:c.overflowY,padding:c.paddingBottom,content:el.scrollHeight,client:el.clientHeight,appPad:parseFloat(getComputedStyle(document.querySelector('#appView')).paddingBottom)}});
  assert.equal(layout.overflow,'visible','overview uses document scrolling');assert.equal(layout.padding,'0px','dock space reserved once');assert.equal(layout.content,layout.client);assert(layout.appPad>=54);
  const nav=await page.locator('.bottom-nav').boundingBox();await page.evaluate(()=>scrollTo(0,1e6));assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),nav);await page.locator('#navDog').click();assert.equal(await page.evaluate(()=>scrollY),0,'new tab starts at top instead of inheriting overview offset');await page.locator('#navBooking').click();
  if(width===390){
   await page.route('**/storage/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=','base64')}));
   await page.route('**/*.preview-v423.webp',route=>route.abort('failed'));
   await page.evaluate(async()=>{
    state.data.dogs.forEach((dog,i)=>{dog.photo_path='fixture/dog-'+i;dog.photo_url='https://inbox.fixture/storage/private-dog-'+i+'.png?token=synthetic'});
    window.__noticeFixture=[{id:423,title:'Synthetic preview',body:'Synthetic notice body',image_path:'fixture/notice.with-preview-v423.png',show_in_overview:true}];
    renderAll();await loadAnnouncements(true);
    await Promise.allSettled([...document.querySelectorAll('#bookingTab img,#dogProfilePhoto img')].map(image=>image.decode()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const selectors=['#bookingDogAvatar img','#dogProfilePhoto .dog-avatar img',...(state.data.dogs.length===2?['[data-dog-panel="1"] img','[data-dog-panel="2"] img']:[])].filter(selector=>document.querySelector(selector));
    window.__ownPhotos=selectors.map(selector=>document.querySelector(selector));window.__ownPhotoSelectors=selectors;
    const data=JSON.stringify(state.data),fetcher=window.fetch;
    window.fetch=async(url,options)=>{if(String(url).endsWith('/customer-portal-api')){await new Promise(resolve=>setTimeout(resolve,80));return new Response(data)}return fetcher(url,options)};
    await bootstrap();
   });
   assert.equal(await page.evaluate(()=>window.__chvoStartupTimingV423.status),'complete');
   assert(await page.evaluate(()=>window.__chvoStartupTimingV423.apiMs>=75),'API latency is measured');
   assert(await page.evaluate(()=>window.__ownPhotoSelectors.length>0&&window.__ownPhotoSelectors.every((selector,i)=>window.__ownPhotos[i]===document.querySelector(selector))),'one/two decoded dog images retain nodes during boot refresh');
   await page.waitForFunction(()=>[...document.querySelectorAll('.customer-notice-thumb-v363 img')].some(img=>img.src.includes('with-preview-v423.png')&&img.complete&&img.naturalWidth>0));
   const beforeResume=await page.locator('.bottom-nav').boundingBox();
   await page.evaluate(()=>{lastResumeRefresh=0;customerUpdateLastCheck=Date.now();return refreshOnResume()});
   assert.deepEqual(await page.locator('.bottom-nav').boundingBox(),beforeResume,'resume keeps dock geometry');
  }
  if(dogs===1&&width===390){
   await page.evaluate(()=>{state.data.chat_staff_photo_url='https://inbox.fixture/storage/staff-one.jpg?token=one';state.data.messages=[{id:1,sender_role:'staff',body:'First',created_at:'2026-10-28T12:00:00Z',read_at:'2026-10-28'}];renderMessages();window.__bubble=document.querySelector('#supportMessageThreadV52').firstChild;window.__avatar=document.querySelector('#supportChatStaffAvatarV180 img');document.querySelector('#supportMessageBodyV52').value='Draft';});
   await page.evaluate(()=>{state.data.chat_staff_photo_url='https://inbox.fixture/storage/staff-one.jpg?token=renewed';state.data.messages.push({id:2,sender_role:'staff',body:'Next',created_at:'2026-10-28T12:01:00Z',read_at:'2026-10-28'});renderMessages();});
   assert(await page.evaluate(()=>window.__bubble===document.querySelector('#supportMessageThreadV52').firstChild&&window.__avatar===document.querySelector('#supportChatStaffAvatarV180 img')),'unchanged messages and signed photo retain nodes');
   assert.equal(await page.locator('#supportMessageBodyV52').inputValue(),'Draft');
   await page.evaluate(()=>{state.data.messages[0].body='Edited';state.data.chat_staff_photo_url='https://inbox.fixture/storage/staff-two.jpg';renderMessages();});assert.equal(await page.locator('#supportMessageThreadV52 p').first().textContent(),'Edited');assert(await page.evaluate(()=>window.__avatar!==document.querySelector('#supportChatStaffAvatarV180 img')));
   await page.evaluate(async()=>{const fetcher=window.fetch;window.fetch=async(url,options)=>String(url).includes('portal_terms_documents')?{ok:true,status:200,json:async()=>[{version:'test-v396',title:'Terms',body:'Fixture'}],text:async()=>JSON.stringify([{version:'test-v396',title:'Terms',body:'Fixture'}])}:fetcher(url,options);customerTermsReadV146=null;window.seedCustomerTermsAcceptancesV396('synthetic-browser','test-v396',[{dog_id:1,terms_version:'test-v396',accepted_at:'2026-10-28T12:00:00Z'}]);await window.renderCustomerLegalStatusV103();});
   assert.equal(await page.locator('#customerLegalStatusCard .customer-legal-status').last().textContent(),'Odsúhlasené','real onboarding acceptance reused without pending flash');
   assert.equal(await page.evaluate(()=>window.__calls.filter(u=>u.includes('portal_terms_acceptances?')).length),0,'no duplicate acceptance read');
   await page.evaluate(()=>window.seedCustomerTermsAcceptancesV396('different-account','test-v396',[{dog_id:1,terms_version:'test-v396',accepted_at:'2026-10-28'}]));

   await page.evaluate(()=>{state.data.conversation_id=8;state.data.messages=[{id:1,sender_role:'staff',body:'Other conversation',created_at:'2026-10-28T12:00:00Z',read_at:'2026-10-28'}];renderMessages();});assert(await page.evaluate(()=>window.__bubble!==document.querySelector('#supportMessageThreadV52').firstChild),'conversation boundary clears old nodes');
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS polish',dogs,width);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
