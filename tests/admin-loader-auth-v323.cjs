const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{JSDOM}=require('./shared-v244/node_modules/jsdom');
const before=require('../tools/build-admin-capacity-v322.cjs')(),after=process.env.ADMIN_SOURCE?fs.readFileSync(process.env.ADMIN_SOURCE,'utf8'):require('../tools/build-admin-loader-v323.cjs')();
const scripts=h=>[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const key='chvostikovo_supabase_session',fixture={access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-staff'}};
const tick=()=>new Promise(r=>setTimeout(r,25));
const response=(x,status=200)=>({ok:status<400,status,json:async()=>x,text:async()=>JSON.stringify(x),headers:{get:()=>''}});
function domFor(h){return new JSDOM(h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://admin.fixture',runScripts:'outside-only',pretendToBeVisual:true})}
function brokenPaints(h){const d=domFor(h);try{return [...h.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]).filter(id=>!d.window.document.getElementById(id))}finally{d.window.close()}}
async function client(h,stored,remember=true){
 const dom=domFor(h),w=dom.window;w.localStorage.setItem('chvostikovo_remember_login',String(remember));if(stored)(remember?w.localStorage:w.sessionStorage).setItem(key,JSON.stringify(stored));
 new vm.Script(scripts(h).find(s=>s.includes('function createClient(baseUrl, anonKey)'))).runInContext(dom.getInternalVMContext());
 return {dom,w,api:w.supabase.createClient('https://fixture.invalid','synthetic-public-key')};
}
async function assembled(h,staffFailure){
 const dom=domFor(h),w=dom.window,calls=[],errors=[];w.localStorage.setItem(key,JSON.stringify(fixture));w.localStorage.setItem('chvostikovo_remember_login','true');
 w.alert=()=>{};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
 w.WebSocket=class{static OPEN=1;static CONNECTING=0;constructor(){this.readyState=0}close(){}send(){}};
 w.console.error=(...a)=>errors.push(a.map(String).join(' '));w.addEventListener('error',e=>errors.push(e.message));
 const transport={staffFailure};w.fetch=async(url,opts={})=>{url=String(url);calls.push(url);if(url.includes('/rest/v1/staff'))return transport.staffFailure==='inactive'?response(null):transport.staffFailure?response({message:'synthetic staff unavailable'},500):response({user_id:fixture.user.id});if(url.includes('/functions/v1/'))return response({data:[]});return response([])};
 for(const script of scripts(h))if(script.trim())new vm.Script(script).runInContext(dom.getInternalVMContext());
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await tick();await tick();return {dom,w,calls,errors,transport};
}
(async()=>{
 assert(brokenPaints(before).includes('appBootArcGradient'),'reproduce invisible admin arc');
 const oldWrapper=fs.readFileSync('supabase/backups/admin-wrapper-before-v323.html','utf8');assert(brokenPaints(oldWrapper).includes('bootArcGradient'),'reproduce invisible wrapper arc');
 assert.deepEqual(brokenPaints(after),[]);assert.deepEqual(brokenPaints(fs.readFileSync('admin-wrapper/index.html','utf8')),[]);
 const old=await assembled(before,true);try{assert(old.calls.some(u=>u.includes('/auth/v1/logout')));assert(!old.w.localStorage.getItem(key))}finally{old.w.close()}
 const failed=await assembled(after,true);try{
  assert(failed.w.localStorage.getItem(key),'staff network failure retains remembered session');assert(!failed.calls.some(u=>u.includes('/auth/v1/logout')));
  assert(failed.w.document.getElementById('loginView').classList.contains('hidden'),'login form hidden during retry');assert(failed.w.document.querySelector('.admin-auth-retry-v323 button'));assert.deepEqual(failed.errors,[]);
  failed.transport.staffFailure=false;failed.w.document.querySelector('.admin-auth-retry-v323 button').click();await tick();await tick();assert(!failed.w.document.getElementById('mainView').classList.contains('hidden'));assert(!failed.w.document.getElementById('appBoot'));assert(!failed.calls.some(u=>u.includes('/auth/v1/logout')));
 }finally{failed.w.close()}
 const healthy=await assembled(after,false);try{assert(healthy.w.document.getElementById('loginView').classList.contains('hidden'));assert(!healthy.w.document.getElementById('mainView').classList.contains('hidden'));assert(!healthy.w.document.getElementById('appBoot'));assert(!healthy.calls.some(u=>/grant_type=password|\/logout/.test(u)));assert.deepEqual(healthy.errors,[])}finally{healthy.w.close()}
 for(const remember of [true,false]){
  const c=await client(after,{...fixture,expires_at:1},remember),{w,api}=c;let refreshes=0,release;const events=[];api.auth.onAuthStateChange(e=>events.push(e));
  w.fetch=async()=>{refreshes++;await new Promise(r=>release=r);return response({...fixture,refresh_token:'rotated-fixture'})};
  const pending=[api.auth.getSession(),api.auth.getSession(),api.auth.getSession()];await tick();assert.equal(refreshes,1,'one shared refresh for concurrent startup/focus');release();await Promise.all(pending);
  const store=remember?w.localStorage:w.sessionStorage;assert.equal(JSON.parse(store.getItem(key)).refresh_token,'rotated-fixture');assert.equal(events.filter(e=>e==='TOKEN_REFRESHED').length,1);
  const reload=await client(after,JSON.parse(store.getItem(key)),remember);try{reload.w.fetch=async()=>{throw Error('unexpected network')};assert.equal((await reload.api.auth.getSession()).data.session.refresh_token,'rotated-fixture')}finally{reload.w.close()}
  w.close();
 }
 const inactive=await assembled(after,'inactive');try{assert(inactive.calls.some(u=>u.includes('/auth/v1/logout')));assert(!inactive.w.localStorage.getItem(key));assert(inactive.w.document.getElementById('mainView').classList.contains('hidden'))}finally{inactive.w.close()}
 const denied=await client(after,{...fixture,expires_at:1});try{denied.w.fetch=async()=>response({message:'refresh revoked'},401);assert.equal((await denied.api.auth.getSession()).data.session,null);assert(!denied.w.localStorage.getItem(key))}finally{denied.w.close()}
 const retry=await client(after,{...fixture,expires_at:1});try{retry.w.fetch=async()=>response({message:'server busy'},503);await retry.api.auth.getSession();assert(retry.w.localStorage.getItem(key))}finally{retry.w.close()}
 console.log('PASS reproduced broken paint refs and transient staff logout; fixed actual assembled startup, remembered reload, single refresh, session-only preference and revoked token. No production authentication or notifications; physical Face ID unobserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
