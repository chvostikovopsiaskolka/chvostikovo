const fs=require('fs'),assert=require('node:assert/strict'),vm=require('vm');
const {stripTypeScriptTypes}=require('node:module');
const {JSDOM}=require('jsdom');
const app=fs.readFileSync('app.js','utf8');
const section=(a,b)=>app.slice(app.indexOf(a),app.indexOf(b,app.indexOf(a)));
async function confirmation(hash,user,ok=true){
 const dom=new JSDOM(fs.readFileSync('email-confirmed.html','utf8'),{url:'https://app.chvostikovo.sk/email-confirmed.html'+hash,runScripts:'outside-only'});
 const w=dom.window;let calls=0;
 w.AbortSignal=AbortSignal;w.fetch=async()=>{calls++;return {ok,json:async()=>user}};
 await w.eval(fs.readFileSync('email-confirmed.js','utf8'));
 const result={title:w.document.getElementById('confirmationTitle').textContent,body:w.document.body.textContent,hash:w.location.hash,calls};
 assert.equal(w.localStorage.length,0);w.close();return result;
}
(async()=>{
 let r=await confirmation('#access_token=test&type=signup',{email:'owner@example.test',email_confirmed_at:'2026-10-01'});
 assert.equal(r.title,'Váš e-mail je potvrdený');assert(!r.body.includes('owner@example.test'));assert(!r.body.includes('Vrátiť sa do aplikácie'));assert.equal(r.hash,'');
 r=await confirmation('#error=access_denied&error_code=otp_expired',null);assert.equal(r.calls,0);assert(!r.body.includes('Váš e-mail je potvrdený'));
 r=await confirmation('',null);assert.equal(r.calls,0);
 r=await confirmation('#access_token=test&type=signup',{email_confirmed_at:null});assert(!r.body.includes('Váš e-mail je potvrdený'));
 r=await confirmation('#access_token=test&type=signup',null,false);assert(!r.body.includes('Váš e-mail je potvrdený'));
 // Registration: neutral message, exact recipient, fixed callback, single request.
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk',runScripts:'outside-only'}),w=dom.window;
 let resolveSignup,calls=0,payload,msg,mode;
 w.$=id=>w.document.getElementById(id);w.PASSWORD_STRONG_RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;w.PASSWORD_MIN_MESSAGE='Slabé heslo';
 w.CUSTOMER_PUBLIC_URL='https://app.chvostikovo.sk/';
 w.authFetch=(path,opts)=>{calls++;payload={path,body:JSON.parse(opts.body)};return new Promise(resolve=>resolveSignup=resolve)};
 w.authMessage=(type,text)=>msg={type,text};w.loading=()=>{};w.showAuth=m=>mode=m;
 const again=w.document.createElement('input');again.id='signupPasswordAgain';w.document.body.append(again);
 w.$('signupPassword').value='ValidPass1';again.value='ValidPass1';w.$('signupEmail').value='owner@example.test';
 w.eval(section("$('signupForm').addEventListener('submit'","$('forgotForm').addEventListener('submit'"));
 const btn=w.$('signupForm').querySelector('button[type=submit]');
 const submit=()=>w.$('signupForm').dispatchEvent(new w.SubmitEvent('submit',{cancelable:true,submitter:btn}));
 submit();submit();assert.equal(calls,1);resolveSignup({});await new Promise(setImmediate);
 assert.equal(mode,'login');assert.equal(msg.type,'info');assert(msg.text.includes('owner@example.test'));
 assert.equal(w.$('loginEmail').value,'owner@example.test');assert(!btn.disabled);
 assert(payload.path.includes(encodeURIComponent(w.CUSTOMER_PUBLIC_URL)));dom.window.close();
 // Photo selection: 5 allowed, sixth rejected, old processing cannot enter another dog.
 const ctx=vm.createContext({state:{session:{user:{id:'a'}},data:{vaccination_proofs:[]}},dog:{id:1},window:{},console,Promise,Number,Math});
 ctx.$=()=>null;ctx.selectedDog=()=>ctx.dog;ctx.vaccinationProofsForDogV104=()=>[];ctx.toast=()=>{};ctx.renderVaccinationProofsV104=()=>{};
 vm.runInContext('let vaccinationProofFilesV104=[],vaccinationProofReplaceModeV104=false;'+section('let vaccinationProofStageEpochV143=0;','function applyDogDetailsModeV96')+section('async function addVaccinationProofFilesV104','function v105PickerGuard'),ctx);
 ctx.v105PrepareProof=async f=>({dataUrl:f});await ctx.addVaccinationProofFilesV104(['1','2','3','4','5','6']);
 assert.equal(vm.runInContext('vaccinationProofFilesV104.length',ctx),5);
 ctx.clearVaccinationProofStageV104();let resolvePhoto;ctx.v105PrepareProof=()=>new Promise(resolve=>resolvePhoto=resolve);
 const pending=ctx.addVaccinationProofFilesV104(['old']);ctx.clearVaccinationProofStageV104();ctx.dog={id:2};resolvePhoto({dataUrl:'old'});await pending;
 assert.equal(vm.runInContext('vaccinationProofFilesV104.length',ctx),0);
 // Duplicate upload callers share one request; successful upload clears staging.
 vm.runInContext(section('function uploadVaccinationProofsV104','/* v105 runtime-only'),ctx);
 vm.runInContext("vaccinationProofFilesV104=[{dataUrl:'jpeg'}]",ctx);
 let resolveUpload,uploads=0;ctx.api=()=>{uploads++;return new Promise(resolve=>resolveUpload=resolve)};
 const first=ctx.uploadVaccinationProofsV104(),second=ctx.uploadVaccinationProofsV104();assert.equal(first,second);assert.equal(uploads,1);
 resolveUpload({data:{proofs:[{dog_id:2}]}});await first;await new Promise(setImmediate);
 assert.equal(vm.runInContext('vaccinationProofFilesV104.length',ctx),0);
 // Server validates 5-photo limit, append totals, and ownership before any upload.
 const ts=fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8');
 const a=ts.indexOf('async function uploadVaccinationProofs('),b=ts.indexOf('\nasync function ',a+1);
 const source=stripTypeScriptTypes(ts.slice(a,b),{mode:'strip'});
 let stored=0,owns=true,existing=[];
 const server=vm.createContext({SUPABASE_URL:'https://example.test',SERVICE_KEY:'test',crypto:require('node:crypto').webcrypto,atob,Uint8Array,Number,String,Array,Date,encodeURIComponent,console});
 server.ownsDog=async()=>owns;server.rest=async(path,opts)=>opts?.method==='POST'?opts.body:existing;
 server.fetch=async()=>{stored++;return {ok:true}};server.withSignedVaccinationProofs=async x=>x;
 vm.runInContext(source,server);
 const images=Array(5).fill('data:image/jpeg;base64,/9j/2Q==');
 await server.uploadVaccinationProofs('a',false,{dog_id:1,images});assert.equal(stored,5);
 await assert.rejects(server.uploadVaccinationProofs('a',false,{dog_id:1,images:[...images,images[0]]}),/najviac 5/);
 existing=[{batch_id:'test'}];await assert.rejects(server.uploadVaccinationProofs('a',false,{dog_id:1,images,append:true}),/najviac 5/);
 owns=false;await assert.rejects(server.uploadVaccinationProofs('a',false,{dog_id:1,images}),/priradený/);
 assert.equal(stored,5);
 console.log('PASS: callback success/error/expiry, neutral registration + email prefill, duplicate submits, 5-photo selection/server/append/ownership, stale dog selection, duplicate upload');
})().catch(e=>{console.error(e);process.exit(1)});
