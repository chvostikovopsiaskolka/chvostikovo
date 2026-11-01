const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const path=process.env.ADMIN_SOURCE;if(!path)throw Error('ADMIN_SOURCE required');
const html=fs.readFileSync(path,'utf8').replace('function leaveApp(){',"document.addEventListener('test-leave-app',()=>leaveApp());function leaveApp(){");
(async()=>{
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,errors=[];
 w.addEventListener('error',e=>errors.push(e.message));
 const query={select(){return this},is(){return this},eq(){return this},order(){return this},limit:async()=>({data:[],error:null})};
 w.supabase={createClient:()=>({from:()=>query,auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}})},rpc:async()=>({data:{},error:null})})};
 w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>''});w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 try{
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())new vm.Script(m[1]).runInContext(dom.getInternalVMContext());
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,60));
 assert.equal(w.document.querySelectorAll('#adminSwitchWorkspace').length,1);
 w.document.getElementById('adminSettingsModal').classList.remove('hidden');w.document.documentElement.classList.add('admin-settings-open');
 w.document.dispatchEvent(new w.Event('test-leave-app'));
 assert(w.document.getElementById('adminSettingsModal').classList.contains('hidden'));
 assert(!w.document.documentElement.classList.contains('admin-settings-open'));
 assert(!w.document.getElementById('loginView').classList.contains('hidden'));
 assert(w.document.getElementById('mainView').classList.contains('hidden'));
 await new Promise(r=>setTimeout(r,30));assert.deepEqual(errors,[]);console.log('PASS actual assembled scripts, settings cleanup, login restored, one workspace return control; authenticated signout still pending.');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
