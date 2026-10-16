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
 run(`state.session={user:{id:'pass-owner'},access_token:'fixture'};state.data={shared_passes_enabled:true,dogs:[{id:1,name:'Bella'},{id:2,name:'Iris'}],passes:[],pass_requests:[]};state.selectedDogId=1;renderPassSummary=()=>{};renderDog=()=>{};queueCustomerSync=()=>{}`);
 let payloads=[],attempt=0;w.fetch=async(url,opts)=>{const p=JSON.parse(opts.body);payloads.push(p);if(++attempt===1)throw Error('Lost response');return {ok:true,json:async()=>({id:20,dog_id:1,dog_ids:[1,2],status:'pending',total_entries:p.p_total_entries})}};
 const request=run('openSharedPassRequestV260(1)');await tick();
 const modal=w.document.getElementById('passInterestConfirmationV44');assert.equal(modal.querySelector('[data-pass-scope]').value,'both');modal.querySelector('[data-pass-total]').value='20';
 await modal.querySelector('#passInterestConfirmationCloseV44').onclick();assert(modal.isConnected);await modal.querySelector('#passInterestConfirmationCloseV44').onclick();await request;
 assert.equal(payloads[0].p_operation_id,payloads[1].p_operation_id);assert.equal(payloads[1].p_total_entries,20);assert.deepEqual(payloads[1].p_dog_ids,[1,2]);assert.equal(run('state.data.pass_requests.length'),1);assert(!modal.isConnected);
 let finish;w.fetch=()=>new Promise(r=>finish=r);const stale=run('openSharedPassRequestV260(1)');const old=w.document.getElementById('passInterestConfirmationV44');const sending=old.querySelector('#passInterestConfirmationCloseV44').onclick();run(`state.session.user.id='other';state.data.pass_requests=[]`);finish({ok:true,json:async()=>({id:21})});await sending;await stale;assert.equal(run('state.data.pass_requests.length'),0);
 console.log('PASS explicit initial shared 10/20 choice; one interest, same operation on lost-response retry; account switch cannot write prior request into new account');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
