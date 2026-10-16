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
 const setup=(shared=false,two=false)=>run(`state.session={user:{id:'renew-owner'},access_token:'fixture'};state.data={shared_passes_enabled:true,dogs:${JSON.stringify(two?[{id:1,name:'Bella'},{id:2,name:'Iris'}]:[{id:1,name:'Bella'}])},passes:[{id:10,dog_id:1,dog_ids:${shared?'[1,2]':'[1]'},is_shared:${shared},status:'active',total_entries:10,used_entries:9}],pass_requests:[],requests:[{id:1,dog_id:${shared?2:1},reservation_date:'2099-01-05',status:'pending',projected_pass_total:10,projected_entry_number:10}]};state.selectedDogId=1;renderPassSummary=()=>{};renderDog=()=>{};queueCustomerSync=()=>{}`);
 let calls=[],fail=false;w.fetch=async(url,opts)=>{calls.push({url:String(url),payload:JSON.parse(opts.body)});if(fail){fail=false;throw Error('Lost response')}return {ok:true,text:async()=>JSON.stringify({id:21,dog_id:1,dog_ids:calls.at(-1).payload.p_dog_ids||[1],status:'pending',total_entries:10})}};
 for(const [shared,two] of [[false,false],[false,true],[true,true]]){
  setup(shared,two);calls=[];
  run(`window.showPassRenewalAfterBookingV94(1,'2099-01-05')`);
  const modal=w.document.getElementById('passRenewalModalV38');assert(!modal.classList.contains('hidden'));assert.equal(modal.querySelector('select'),null);
  modal.querySelector('#passRenewalLaterV38').click();assert.equal(calls.length,0);assert(modal.classList.contains('hidden'));
  run(`window.showPassRenewalAfterBookingV94(1,'2099-01-05')`);
  if(shared){fail=true;await modal.querySelector('#passRenewalRequestV38').onclick();assert(!modal.classList.contains('hidden'));}
  await modal.querySelector('#passRenewalRequestV38').onclick();
  assert(modal.classList.contains('hidden'));assert.equal(run('state.data.pass_requests.length'),1);
  const confirmation=w.document.getElementById('passInterestConfirmationV44');assert.equal(confirmation.querySelector('select'),null);assert.equal(confirmation.querySelector('h2').textContent,'Permanentka je pripravená');
  if(shared){assert(calls.every(c=>c.url.endsWith('/portal_request_pass_v244')));assert.deepEqual(calls[0].payload.p_dog_ids,[1,2]);assert.equal(calls[0].payload.p_operation_id,calls[1].payload.p_operation_id);assert.match(confirmation.textContent,/spoločnú/)}
  else{assert.equal(calls.length,1);assert(calls[0].url.endsWith('/portal_request_pass'));assert.equal(calls[0].payload.p_dog_id,1)}
  confirmation.classList.add('hidden');run(`window.showPassRenewalAfterBookingV94(1,'2099-01-05')`);assert(modal.classList.contains('hidden'));
 }
 setup(true,true);run(`state.data.requests[0].projected_entry_number=9;window.showPassRenewalAfterBookingV94(1,'2099-01-05')`);assert(w.document.getElementById('passRenewalModalV38').classList.contains('hidden'));
 setup(true,true);let finish;w.fetch=()=>new Promise(r=>finish=r);run(`window.showPassRenewalAfterBookingV94(1,'2099-01-05')`);const sending=w.document.getElementById('passRenewalRequestV38').onclick();run(`state.session.user.id='other';state.data.pass_requests=[]`);finish({ok:true,text:async()=>JSON.stringify({id:22})});await sending;assert.equal(run('state.data.pass_requests.length'),0);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS normal last-entry renewal for one dog, two individual dogs and shared pool; sibling last entry; Later no write; Yes direct 10-entry interest without selectors; one shared request; retry same UUID; pending suppresses duplicate; no early prompt; account guard');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
