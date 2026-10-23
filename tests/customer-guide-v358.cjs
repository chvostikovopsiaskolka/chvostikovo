const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const tick=ms=>new Promise(r=>setTimeout(r,ms));
async function fixture(count=1,eligible=true){
 const errors=[],calls=[],images=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://guide.fixture',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c);
 const response=(data,status=200)=>({ok:status<400,status,json:async()=>data,text:async()=>JSON.stringify(data),headers:{get:()=>''}});
 Object.assign(w,{fetch:async(url,opts={})=>{calls.push({url:String(url),...opts});if(String(url).includes('portal_record_guide'))return response(true);if(String(url).includes('portal_announcements?'))return response(w.noticeRows||[]);return response([]);},matchMedia:()=>({matches:true,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.Image=function(){const img=w.document.createElement('img');img.decode=async()=>{};Object.defineProperty(img,'complete',{get:()=>false});images.push(img);return img;};
 for(const f of ['terms-pdf.js','app.js','dual-dog-overview-v246.js','customer-design.js','customer-guide-v358.js'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f}).runInContext(c);
 await tick(500);
 run(`state.session={user:{id:'synthetic-guide'},access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600};state.selectedDogId=1;state.data={profile:{status:'active',intro_guide_eligible:${eligible},privacy_notice_acknowledged_at:'2026-01-01',push_prompt_answered_at:'2026-01-01'},dogs:Array.from({length:${count}},(_,i)=>({id:i+1,name:'Synthetic '+(i+1),sex:'female',default_entry_type:'pass',photo_url:'https://fixture.invalid/dog.jpg',share_name_photo_at:'2026-01-01'})),vaccinations:Array.from({length:${count}},(_,i)=>['rabies','infectious','kennel_cough'].map(type=>({dog_id:i+1,vaccination_type:type,valid_until:'2099-12-31'}))).flat(),vaccination_proofs:Array.from({length:${count}},(_,i)=>({id:i+1,dog_id:i+1,storage_path:'fixture'})),dog_onboarding:Array.from({length:${count}},(_,i)=>({dog_id:i+1,details_prompt_answered_at:'2026-01-01'})),passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}};showApp();renderAll();loading(false);`);
 return {dom,w,run,calls,images,errors};
}
const visible=f=>!!f.w.document.getElementById('customerGuideV358')&&!f.w.document.getElementById('customerGuideV358').classList.contains('hidden');
const click=(f,id)=>f.w.document.getElementById(id).click();
async function ready(f){await f.run('window.runCustomerOnboardingV75()');await tick(1100);}
(async()=>{
 for(const count of [1,2]){
  const f=await fixture(count);try{
   await ready(f);assert(visible(f),'real onboarding completion opens eligible welcome: '+JSON.stringify(f.run(`({ready:window.__customerOnboardingCompleteV75,tab:state.activeTab,loading:document.getElementById('loading')?.className,picker:document.getElementById('bookingPickerV37')?.className,saved:localStorage.getItem('chvo-guide-v358:synthetic-guide'),profile:state.data?.profile,vax:state.data?.dogs.map(d=>customerVaccinationsCompleteV96(d)),modals:[...document.querySelectorAll('[role="dialog"]')].filter(el=>!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none').map(el=>el.id)})`)));
   const before=f.run('JSON.stringify([state.data.requests,state.data.reservations,state.data.passes,state.data.visits,state.data.availability,state.selectedDogId])');
   click(f,'guideNextV358');await tick(60);
   for(let i=1;i<=6;i++){
    assert.equal(f.w.document.getElementById('guideProgressV358').textContent,i+' z 6');
    if(i===4){const demo=f.w.document.getElementById('guideDemoReservationV358');assert(demo,'empty account uses isolated demo');assert(demo.querySelector('.reserved-day-card-v37'));assert(demo.querySelector('.booking-taxi-pencil-v201'));}
    if(i===5){const demo=f.w.document.getElementById('guidePickerPreviewV360');assert.equal(demo.querySelectorAll('.booking-day-v37.selected').length,2);assert.equal(demo.querySelectorAll('.design-selected-day').length,2);assert.equal(demo.querySelectorAll('[data-taxi-mode]').length,3);assert(demo.textContent.includes('Rezervovať 2 dni'));demo.querySelector('.booking-picker-submit-v37').click();click(f,'guideBackV358');await tick(60);assert(!f.w.document.getElementById('guidePickerPreviewV360'));assert(!f.w.document.querySelector('.booking-picker-card-v37[data-guide-stashed-v360]'));click(f,'guideNextV358');await tick(60);assert(f.w.document.getElementById('guidePickerPreviewV360'));}
    click(f,'guideNextV358');await tick(60);
   }
   assert(!visible(f));assert(!f.w.document.getElementById('guideDemoReservationV358'));assert(!f.w.document.querySelector('[data-guide-stashed-v360]'));assert(!f.w.document.getElementById('guidePickerPreviewV360'));
   assert.equal(f.run('JSON.stringify([state.data.requests,state.data.reservations,state.data.passes,state.data.visits,state.data.availability,state.selectedDogId])'),before);
   assert(f.calls.filter(c=>c.method==='POST').every(c=>c.url.includes('portal_record_guide')),'tour never makes operational writes');
   assert.equal(f.run('state.data.profile.intro_guide_result'),'completed');
   f.run('document.dispatchEvent(new Event("customer-onboarding-ready-v358"))');await tick(450);assert(!visible(f));
   click(f,'menuGuideV358');assert(visible(f),'manual replay');click(f,'guideSkipV358');assert(!visible(f));
   assert.deepEqual(f.errors,[]);console.log('PASS actual 6-step guide, isolated demo, skip/replay/one-time,',count,'dogs');
  }finally{f.w.close()}
 }
 for(const mode of ['existing','vaccines','onboarding','logout']){
  const f=await fixture(1,mode!=='existing');try{
   if(mode==='vaccines')f.run('state.data.vaccinations=[]');
   if(mode==='onboarding')f.run('state.data.profile.privacy_notice_acknowledged_at=null');
   await ready(f);
   if(mode==='logout'){assert(visible(f));f.run('clearSession()');assert(!visible(f));}
   else assert(!visible(f),mode+' must not auto-open');
   console.log('PASS guide gate',mode);
  }finally{f.w.close()}
 }
 const f=await fixture(1,false);try{
  await ready(f);f.w.noticeRows=[{id:1,title:'Synthetic notice',body:'Article text',active:true,image_path:'synthetic/photo.jpg'},{id:2,title:'Second',body:'Other text',active:true,image_path:'synthetic/other.jpg'}];
  f.run('Date.now=()=>new Date().getTime()+61000;loadAnnouncements()');await tick(30);
  click(f,'customerAnnouncementsV363');await tick(30);
  const buttons=f.w.document.querySelectorAll('.customer-bulletin-history-row-v229');assert.equal(buttons.length,2);
  buttons[0].click();assert.match(f.w.document.getElementById('customerBulletinArticleV229').textContent,/Načítavam oznam/);assert(!f.w.document.querySelector('.customer-bulletin-article-v229'));
  const photo=f.images.find(img=>img.src.includes('synthetic/photo'));photo.onload();await tick(30);
  assert.equal(f.w.document.querySelector('.customer-bulletin-article-v229').textContent,'Article text');assert.equal(f.w.document.querySelector('.customer-bulletin-photo-v229'),photo);
  photo.click();assert(!f.w.document.getElementById('customerBulletinZoomV229').classList.contains('hidden'));
  f.w.document.querySelector('#customerBulletinZoomV229 .customer-bulletin-close-v229').click();await tick(30);
  buttons[1].click();f.images.find(img=>img.src.includes('synthetic/other')).onerror();await tick(30);
  assert.equal(f.w.document.querySelector('.customer-bulletin-article-v229').textContent,'Other text');assert(f.w.document.querySelector('.customer-bulletin-photo-error-v358'));
  f.w.document.querySelector('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();await tick(30);
  buttons[1].click();f.w.document.querySelector('#customerBulletinArticleV229 .customer-bulletin-close-v229').click();await tick(30);
  f.images.filter(img=>img.src.includes('synthetic/other')).at(-1).onload();await tick(30);assert(f.w.document.getElementById('customerBulletinArticleV229').classList.contains('hidden'));
  buttons[0].click();await tick(30);assert(f.w.document.querySelector('.customer-bulletin-photo-v229'));
  f.run('clearSession()');assert(f.w.document.getElementById('customerBulletinArticleV229').classList.contains('hidden'));
  assert.deepEqual(f.errors,[]);console.log('PASS notice preloading, atomic text+decoded photo, image-error fallback/retry, zoom, close/race/cache/logout');
 }finally{f.w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
