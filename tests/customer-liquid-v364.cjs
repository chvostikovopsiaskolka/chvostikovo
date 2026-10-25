const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM,VirtualConsole}=require('./shared-v244/node_modules/jsdom');
const tick=(n=40)=>new Promise(r=>setTimeout(r,n));
const row=(id,extra={})=>({id,active:true,title:'Synthetic notice '+id,body:'Entire notice text '+id,valid_from:'2020-01-01',valid_until:id===1?'2021-01-01':null,...extra});
async function fixture(query='',dogs=1){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Could not parse CSS|Not implemented:.*(scroll|canvas|navigation)/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://inbox.fixture/'+query,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,c=dom.getInternalVMContext(),run=s=>vm.runInContext(s,c);
 const calls=[],reads=new Set();let notices=[],readFailure=false;
 Object.assign(w,{fetch:async(url,opts={})=>{const u=new URL(String(url));calls.push({url:u,...opts});let result=[];
   if(u.pathname.endsWith('/portal_announcements'))result=notices;
   if(u.pathname.endsWith('/portal_announcement_dismissals')){if(opts.method==='POST'){if(readFailure)return {ok:false,status:503};reads.add(JSON.parse(opts.body).announcement_id);}else result=[...reads].map(announcement_id=>({announcement_id}));}
   return {ok:true,status:200,json:async()=>result,text:async()=>JSON.stringify(result),headers:{get:()=>''}};
 },matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),scrollTo(){},ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}}});
 w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const file of ['terms-pdf.js','app.js','dual-dog-overview-v246.js','customer-design.js','customer-guide-v358.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}).runInContext(c);
 await tick(400);
 const data=`{profile:{status:'active',intro_guide_eligible:false},dogs:Array.from({length:${dogs}},(_,i)=>({id:i+1,name:'Synthetic '+i,sex:'female',default_entry_type:'single'})),messages:[{id:1,sender_role:'staff',body:'Private synthetic message',created_at:'2026-01-01',read_at:null}],conversation_id:7,vaccinations:[],vaccination_proofs:[],dog_onboarding:[],passes:[],requests:[],reservations:[],visits:[],pass_requests:[],monthly_totals:[],notifications:[],availability:{days:[]}}`;
 function login(){run(`state.session={user:{id:'synthetic-user'},access_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600};state.selectedDogId=1;state.data=${data};window.runCustomerOnboardingV75=()=>{};queueCustomerSync=()=>{};showApp();renderAll();loading(false);window.__customerOnboardingCompleteV75=true;`);}
 const click=id=>w.document.getElementById(id).click(),visible=id=>!!w.document.getElementById(id)&&!w.document.getElementById(id).classList.contains('hidden');
 return {w,run,dom,calls,errors,reads,login,click,visible,setNotices:r=>notices=r,failReads:v=>readFailure=v};
}
(async()=>{
 const css=fs.readFileSync('customer-design.css','utf8').split('/* v364/v365: Liquid surfaces')[1];
 assert(css&&css.includes('@supports')&&css.includes('prefers-reduced-transparency'));
 assert(css.includes('-webkit-text-stroke:0 transparent!important'));
 assert(css.includes('#customerBulletinArticleV229 .customer-bulletin-head-v229{align-items:center}'));
 for(const dogs of [1,2]){
  const f=await fixture('',dogs);try{
   f.login();assert.equal(f.w.document.getElementById('designTicket'),null);
   assert.equal(f.w.document.getElementById('customerInboxV363').nextElementSibling.id,'designNearest');
   const before=f.run('JSON.stringify([state.data.requests,state.data.reservations,state.data.visits])');
   for(const status of ['active','queued']){
    f.run(`state.data.passes=[{id:1,dog_id:1,dog_ids:[1,2],total_entries:10,used_entries:${status==='queued'?0:6},status:'${status}',valid_until:'2099-12-31'}];renderPassSummary();renderDog();`);
    assert(f.w.document.getElementById('designTicket'),status+' pass preserved');assert.equal(f.w.document.getElementById('customerInboxV363').nextElementSibling.id,'designTicket');
    assert(f.w.document.getElementById('designTicket').textContent.includes('10'));
   }
   f.run("state.data.passes=[];renderPassSummary();renderDog();");assert.equal(f.w.document.getElementById('designTicket'),null);assert.equal(f.w.document.getElementById('customerInboxV363').nextElementSibling.id,'designNearest');
   assert(f.w.document.documentElement.classList.contains('customer-liquid-v364'));
   f.run("switchTab('menu')");assert(f.w.document.documentElement.classList.contains('customer-liquid-v364'));
   f.run("switchTab('booking')");assert(f.w.document.documentElement.classList.contains('customer-liquid-v364'));
   assert.equal(f.run('JSON.stringify([state.data.requests,state.data.reservations,state.data.visits])'),before);
   f.run('clearSession()');assert(!f.w.document.documentElement.classList.contains('customer-liquid-v364'));
   assert.deepEqual(f.errors,[]);console.log('PASS Liquid DOM: no single card/gap, active/queued pass, 1/2 dogs, menu/logout scope, unchanged operational data',dogs);
  }finally{f.w.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
