const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const source=fs.readFileSync('app.js','utf8'),css=fs.readFileSync('styles.css','utf8');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,ctx=dom.getInternalVMContext();
let releaseHistory,historyMode='defer';
const history=[{terms_version:'2026-10-03',accepted_at:'2026-10-15T19:39:00Z',body:'Pravidlá test',document_hash:'fixture'}];
w.fetch=async url=>{
 if(String(url).includes('portal_owner_terms_history_v256')){
  if(historyMode==='defer')await new Promise(r=>releaseHistory=r);
  if(historyMode==='fail')return {ok:false};
  return {ok:true,json:async()=>history};
 }
 if(String(url).includes('portal_terms_acceptances'))return {ok:true,json:async()=>[{accepted_at:'2026-10-15T19:39:00Z'}]};
 return {ok:true,status:200,json:async()=>({}),text:async()=>'',headers:{get:()=>''}};
};
Object.assign(w,{matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
new vm.Script(fs.readFileSync("terms-pdf.js","utf8")).runInContext(ctx);
new vm.Script(source).runInContext(ctx);
const run=s=>vm.runInContext(s,ctx),tick=()=>new Promise(r=>setTimeout(r,0));
(async()=>{try{
 await new Promise(r=>setTimeout(r,600));
 run(`state.session={user:{id:'test-owner'},access_token:'fixture'};state.data={dogs:[{id:1,owner_id:7,name:'Iris'}],notifications:[],vaccinations:[]};state.selectedDogId=1;window.__customerOnboardingCompleteV75=true;
 readActiveCustomerTermsV146=async()=>({version:'2026-10-03',title:'Podmienky psej škôlky Chvostíkovo',body:'1. Zdravotný stav psa\\n\\nTest pravidiel.'});`);
 // Three current vaccine notifications remain in the popup, absent from dashboard.
 run(`const today=bratislavaToday();state.data.vaccinations=['rabies','infectious','kennel_cough'].map((type,i)=>({id:i+1,dog_id:1,vaccination_type:type,valid_until:today}));
 state.data.notifications=state.data.vaccinations.map(v=>({id:v.id,notification_type:'vaccination_expiry',entity_id:v.id,event_key:'vaccination:1:'+v.vaccination_type+':'+today,title:'Očkovanie čoskoro končí',body:'Iris – '+v.vaccination_type}));renderNotifications();`);
 assert.equal(w.document.querySelectorAll('#notificationList .care-notice').length,0);
 assert.equal(w.document.querySelectorAll('[data-popup-care]').length,3);
 w.document.getElementById('notificationPopupClose').click();await tick();
 assert(w.document.getElementById('notificationPopup').classList.contains('hidden'));
 assert.equal(w.document.querySelectorAll('#notificationList .care-notice').length,0);
 // Modal is hidden until the delayed history and accepted status are both ready.
 const opening=w.openCustomerRulesV55();await tick();
 assert(w.document.getElementById('schoolRulesModalV55').classList.contains('hidden'));
 assert(!w.document.getElementById('schoolRulesHistoryV141').textContent.includes('Načít'));
 releaseHistory();await opening;
 assert(!w.document.getElementById('schoolRulesModalV55').classList.contains('hidden'));
 assert.equal(w.document.querySelectorAll('[data-terms-pdf]').length,2);
 assert(!w.document.querySelector('[data-terms-pdf]:not([data-open])').classList.contains('secondary'));
 assert(!w.document.getElementById('schoolRulesAcceptedV55').classList.contains('hidden'));
 w.document.getElementById('schoolRulesDoneV55').click();
 // An account switch while waiting must never show the old owner's modal.
 const stale=w.openCustomerRulesV55();await tick();run("state.session={user:{id:'other-owner'},access_token:'other'}");releaseHistory();await stale;
 assert(w.document.getElementById('schoolRulesModalV55').classList.contains('hidden'));
 // Failed history still opens with useful error and rules; no indefinite hidden loading.
 historyMode='fail';await w.openCustomerRulesV55();
 assert(!w.document.getElementById('schoolRulesModalV55').classList.contains('hidden'));
 assert.match(w.document.getElementById('schoolRulesHistoryV141').textContent,/nepodarilo načítať/);
 assert.match(css,/#notificationPopup \[data-popup-care\][^}]*margin-left:auto[^}]*min-height:44px/);
 assert.match(css,/#schoolRulesModalV55 \.terms-history-actions\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 const release=JSON.parse(fs.readFileSync('version.json','utf8'));
 assert.equal(run('APP_BUILD'),release.build);assert.equal(run('APP_VERSION'),release.version);
 assert(fs.readFileSync('sw.js','utf8').includes(release.build));assert.deepEqual(errors,[]);
 console.log('PASS 3 vaccine popup actions; no duplicate dashboard notice; close; deferred complete rules/PDF panel; orange download; account-switch isolation; history failure; accessible CSS; consistent release markers');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
