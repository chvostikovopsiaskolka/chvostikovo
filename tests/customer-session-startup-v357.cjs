const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const source=fs.readFileSync('app.js','utf8');
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const key='chvostikovo_customer_session';
function session(token='old',expires=-120,user='synthetic-owner'){
 return {access_token:token,refresh_token:'refresh-'+token,expires_at:Math.floor(Date.now()/1000)+expires,user:{id:user}};
}
const data={profile:{status:'active',full_name:'Synthetic',privacy_notice_acknowledged_at:'2099-01-01',push_prompt_answered_at:'2099-01-01'},dogs:[{id:1,name:'Synthetic dog',owner_id:1}],notifications:[],passes:[],requests:[],reservations:[],messages:[],vaccinations:[],vaccination_proofs:[],availability:{days:[]}};
async function fixture(saved,{mode='ok',defer=false,remember=true}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,ctx=dom.getInternalVMContext(),run=s=>vm.runInContext(s,ctx);
 (remember?w.localStorage:w.sessionStorage).setItem(key,JSON.stringify(saved));
 let release;const barrier=defer?new Promise(r=>release=r):Promise.resolve();const calls=[],sockets=[];
 const response=(body,status=200)=>({ok:status<400,status,json:async()=>body,text:async()=>JSON.stringify(body),headers:{get:()=>''}});
 Object.assign(w,{matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},WebSocket:class{static OPEN=1;static CONNECTING=0;constructor(){this.readyState=0;this.sent=[];sockets.push(this)}send(body){this.sent.push(JSON.parse(body))}close(){this.readyState=3}},fetch:async(url,opts={})=>{
  const path=String(url);calls.push({path,headers:opts.headers||{},method:opts.method||'GET',body:opts.body});
  if(path.includes('grant_type=refresh_token')){await barrier;if(mode==='network')throw new TypeError('offline');if(mode==='503')return response({message:'refresh token temporarily unavailable'},503);if(mode==='revoked')return response({code:'refresh_token_not_found',message:'Invalid refresh token'},400);return response(session('new',3600));}
  if(path.includes('/customer-portal-api')){if(mode==='fallback401'&&opts.headers.Authorization!=='Bearer new')return response({error:'Prihlásenie vypršalo.'},401);return response(data);}
  if(path.includes('/admin-push'))return response({ok:true});
  if(path.includes('portal_terms_documents'))return response([{version:'synthetic-terms',document_hash:'hash'}]);
  return response([]);
 }});
 for(const file of ['terms-pdf.js','app.js','dual-dog-overview-v246.js'])new vm.Script(file==='app.js'?source:fs.readFileSync(file,'utf8'),{filename:file}).runInContext(ctx);
 await tick(30);return {dom,w,run,calls,sockets,errors,release};
}
function protectedCalls(f){return f.calls.filter(c=>/\/rest\/v1\/|\/functions\/v1\//.test(c.path));}
const refreshes=f=>f.calls.filter(c=>c.path.includes('grant_type=refresh_token'));
async function waitBoot(f){await tick(850);assert.deepEqual(f.errors,[]);}
(async()=>{
 let f=await fixture(session(),{defer:true});
 try{
  // Actual cold startup overlaps terms, push and Realtime callers.
  const overlap=f.run("Promise.all([readActiveCustomerTermsV146(),readActiveCustomerTermsV146(true),syncPushSubscriptionV75({endpoint:'https://push.fixture/one',toJSON:()=>({endpoint:'https://push.fixture/one',keys:{}})})])");
  f.run('startCustomerLive();lastResumeRefresh=0;refreshOnResume()');await tick(30);
  assert.equal(refreshes(f).length,1);assert.equal(protectedCalls(f).length,0,'no expired-token request before refresh');assert.equal(f.sockets.length,0,'no expired-token socket');
  f.release();await overlap;await waitBoot(f);
  assert.equal(refreshes(f).length,1);assert(protectedCalls(f).every(c=>c.headers.Authorization==='Bearer new'));
  assert.equal(f.calls.filter(c=>c.path.endsWith('/customer-portal-api')).length,1,'no resume duplicate during cold boot');
  assert.equal(f.calls.filter(c=>c.path.includes('portal_terms_documents')).length,1,'shared terms read');
  assert.equal(f.calls.filter(c=>c.path.endsWith('/admin-push')).length,1,'one push registration');
  for(const s of f.sockets)if(s.onopen){s.readyState=1;s.onopen();assert(s.sent.every(p=>p.event!=='phx_join'||p.payload.access_token==='new'));}
  assert(f.w.document.getElementById('loading').classList.contains('hidden'));
 }finally{f.w.close()}
 console.log('PASS cold expired session: one refresh before API/terms/push/socket, terms coalesced, no duplicate boot');
 f=await fixture(session('valid',3600));
 try{
  await waitBoot(f);assert.equal(refreshes(f).length,0,'valid session has no auth network check');
  f.run("saveSession({...state.session,access_token:'expired-resume',refresh_token:'resume-refresh',expires_at:1},true);lastResumeRefresh=0;customerUpdateLastCheck=Date.now()");
  await f.run('Promise.all([refreshOnResume(),refreshOnResume(),readActiveCustomerTermsV146(true)])');await tick(120);
  assert.equal(refreshes(f).length,1);assert(!protectedCalls(f).some(c=>c.headers.Authorization==='Bearer expired-resume'));
  const reads=f.calls.filter(c=>c.path.endsWith('/customer-portal-api')).length;assert.equal(reads,2,'one foreground data sync');
 }finally{f.w.close()}
 console.log('PASS valid session zero refresh; expired foreground/focus shares one refresh and one data sync');
 for(const mode of ['network','503','revoked']){
  f=await fixture(session(),{mode});
  try{await tick(80);assert.equal(protectedCalls(f).length,0);const stored=f.w.localStorage.getItem(key);assert.equal(!!stored,mode!=='revoked',mode+' session persistence');assert.equal(refreshes(f).length,1);assert.deepEqual(f.errors,[]);}finally{f.w.close()}
 }
 console.log('PASS offline/503 preserve saved login; revoked refresh returns to login without protected requests');
 for(const change of ['logout','newlogin']){
  f=await fixture(session(),{defer:true});
  try{f.run(change==='logout'?'clearSession()':"saveSession({access_token:'other-login',refresh_token:'other-refresh',expires_at:9999999999,user:{id:'other-owner'}},false)");f.release();await tick(100);assert.equal(f.run('state.session?.access_token'),change==='logout'?undefined:'other-login');assert.equal(protectedCalls(f).length,0,'old startup must not issue new-account calls');}finally{f.w.close()}
 }
 console.log('PASS delayed refresh cannot resurrect logout or overwrite a newer login');
 f=await fixture(session('future-but-rejected',3600),{mode:'fallback401',remember:false});
 try{await waitBoot(f);assert.equal(refreshes(f).length,1);assert.equal(f.calls.filter(c=>c.path.endsWith('/customer-portal-api')).length,2,'existing 401 fallback is bounded');assert.equal(f.w.localStorage.getItem(key),null);assert.equal(JSON.parse(f.w.sessionStorage.getItem(key)).access_token,'new');}finally{f.w.close()}
 f=await fixture({...session('unused',3600),access_token:'header.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)-10})).toString('base64url')+'.signature',expires_at:undefined});
 try{await waitBoot(f);assert.equal(refreshes(f).length,1,'JWT exp fallback only schedules refresh');}finally{f.w.close()}
 f=await fixture(session('almost-expired',30));try{await waitBoot(f);assert.equal(refreshes(f).length,1,'refresh 60 seconds ahead');}finally{f.w.close()}
 console.log('PASS session-only storage, bounded unexpected401 retry, JWT expiry fallback and one-minute safety margin');
})().catch(e=>{console.error(e);process.exitCode=1});
