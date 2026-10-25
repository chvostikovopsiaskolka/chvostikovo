const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const tick=ms=>new Promise(r=>setTimeout(r,ms));
const data={profile:{status:'active'},dogs:[],passes:[],requests:[],reservations:[],messages:[],notifications:[],availability:{days:[]}};
async function fixture(mode){
 const vc=new VirtualConsole(),errors=[];vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://app.fixture/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c),calls=[],ops=[];
 const response=(value,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(value),json:async()=>value,headers:{get:()=>''}});
 Object.assign(w,{matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},fetch:async(url,opts={})=>{
  if(!String(url).endsWith('/customer-portal-api'))return response([]);
  calls.push(opts);
  if(mode==='503')return response({error:'Temporary service failure'},503);
  if(mode==='other')throw new Error('Synthetic application error');
  if(mode==='always'||mode==='offline'||mode==='hidden'||mode==='logout'||mode==='account'||calls.length===1&&mode==='once')throw new w.TypeError('Synthetic transport failure');
  if(mode==='body'&&calls.length===1)return {...response(data),text:async()=>{throw new w.TypeError('Synthetic body interrupted')}};
  return response(data);
 }});
 for(const file of ['terms-pdf.js','app.js','dual-dog-overview-v246.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}).runInContext(c);
 await tick(350);
 run("queueCustomerSync=()=>{};saveSession({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Date.now()/1000+3600,user:{id:'synthetic-owner'}});loading(false);");
 w.ChvoTelemetry={capture:(category,details)=>ops.push({category,details})};
 if(mode==='offline')Object.defineProperty(w.navigator,'onLine',{value:false});
 if(mode==='hidden')Object.defineProperty(w.document,'visibilityState',{value:'hidden'});
 return {dom,w,run,calls,ops,errors};
}
(async()=>{
 for(const mode of ['ok','once','body','always','503','other','offline','hidden','logout','account']){
  const f=await fixture(mode);try{
   const p=f.run('api()');
   if(mode==='logout'||mode==='account')setTimeout(()=>f.run(mode==='logout'?'clearSession()':"saveSession({access_token:'other',expires_at:Date.now()/1000+3600,user:{id:'other-owner'}})"),25);
   if(['ok','once','body'].includes(mode)){assert.deepEqual(JSON.parse(JSON.stringify(await p)),data);assert.equal(f.ops.length,0,'recovered read does not become a failed operation');}
   else await assert.rejects(p);
   assert.equal(f.calls.length,['once','body','always'].includes(mode)?2:1,mode+' bounded reads');
   assert(f.calls.every(x=>x.method==='GET'));
   if(mode==='logout')assert.equal(f.run('state.session'),null);
   else if(mode==='account')assert.equal(f.run('state.session.user.id'),'other-owner');
   else assert.equal(f.run('state.session.user.id'),'synthetic-owner','session retained');
   assert.deepEqual(f.errors,[]);console.log('PASS actual API read recovery',mode);
  }finally{f.w.close()}
 }
 const f=await fixture('always');try{await assert.rejects(f.run("api({action:'send_message',body:'synthetic fixture'})"));assert.equal(f.calls.length,1,'a write transport failure is never replayed');assert.equal(f.calls[0].method,'POST');assert.equal(f.ops.length,1);}finally{f.w.close()}
 console.log('PASS mutation transport failure is not replayed; diagnostics preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
