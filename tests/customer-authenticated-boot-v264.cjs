const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
async function check(count){
 const errors=[],unhandled=[];const onReject=e=>unhandled.push(String(e));process.on('unhandledRejection',onReject);
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.chvostikovo.sk/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,ctx=dom.getInternalVMContext();
 let bootstrapReads=0;
 const data={dogs:Array.from({length:count},(_,i)=>({id:87+i,owner_id:76,name:['Bella','Iris'][i]})),profile:{full_name:'Test'},notifications:[],passes:count===2?[{id:68,dog_id:87,dog_ids:[87,88],total_entries:10,used_entries:9,is_shared:true,status:'active'}]:[],pass_requests:[],vaccinations:[],vaccination_proofs:[],reservations:[],requests:[],messages:[],availability:{days:[]}};
 w.localStorage.setItem('chvostikovo_customer_session',JSON.stringify({access_token:'fixture',user:{id:'fixture-owner'}}));
 Object.assign(w,{fetch:async(url,opts={})=>{const boot=String(url).endsWith('/customer-portal-api')&&(!opts.method||opts.method==='GET');if(boot)bootstrapReads++;const body=boot?data:[];return {ok:true,status:200,json:async()=>body,text:async()=>JSON.stringify(body),headers:{get:()=>''}}},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
 w.addEventListener('error',e=>errors.push(e.message));
 try{
  for(const file of ['terms-pdf.js','app.js','dual-dog-overview-v246.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}).runInContext(ctx);
  await new Promise(r=>setTimeout(r,900));
  assert.deepEqual(unhandled,[],'saved-session startup must not reject');assert.deepEqual(errors,[]);
  assert.equal(bootstrapReads,1);assert.equal(w.document.getElementById('loading').classList.contains('hidden'),true);assert.equal(w.document.getElementById('appView').classList.contains('hidden'),false);
  vm.runInContext('lastResumeRefresh=0;customerUpdateLastCheck=Date.now();startCustomerLive=()=>{}',ctx);
  await vm.runInContext('refreshOnResume()',ctx);await new Promise(r=>setTimeout(r,150));
  assert.deepEqual(unhandled,[]);assert.deepEqual(errors,[]);assert(bootstrapReads>=2,'foreground refresh reads data');
  console.log('PASS saved-session startup and foreground refresh: '+count+' dog(s)');
 }finally{w.close();process.removeListener('unhandledRejection',onReject)}
}
(async()=>{for(const n of [1,2])await check(n)})().catch(e=>{console.error(e);process.exitCode=1});
