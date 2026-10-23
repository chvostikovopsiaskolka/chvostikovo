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
 for(const dogs of [1,2]){
  const f=await fixture('',dogs);try{
   f.login();await f.run('loadAnnouncements(true)');f.click('customerAnnouncementsV363');await tick();
   assert.match(f.w.document.getElementById('customerBulletinHistoryV229').textContent,/Zatiaľ nemáte žiadne oznamy/);
   f.setNotices(Array.from({length:10},(_,i)=>row(i+1)).concat(row(11,{active:false}),row(12,{valid_from:'2099-01-01'})));
   await f.run('loadAnnouncements(true)');assert.equal(f.w.document.getElementById('customerAnnouncementsCountV363').textContent,'10');
   assert.equal(f.w.document.querySelectorAll('.customer-bulletin-history-row-v229').length,10,'all ten, including expired, no draft/future');
   assert.equal(f.reads.size,0,'opening list does not mark anything read');
   const before=f.calls.length;await Promise.all([f.run('loadAnnouncements()'),f.run('loadAnnouncements()')]);assert.equal(f.calls.length,before,'cached list entry adds no requests');
   assert.equal(f.w.document.querySelectorAll('.customer-notice-thumb-v363 svg').length,10);
   f.w.document.querySelector('[data-announcement-id="1"]').click();await tick();assert(f.visible('customerBulletinArticleV229'));assert.equal(f.reads.size,1);
   assert.equal(f.w.document.getElementById('customerAnnouncementsCountV363').textContent,'9');
   assert.match(f.w.document.getElementById('customerBulletinArticleV229').textContent,/Entire notice text 1/);
   f.w.history.back();await tick(80);assert(f.visible('customerBulletinHistoryV229'));assert(!f.visible('customerBulletinArticleV229'));
   assert.equal(f.w.document.querySelectorAll('.customer-bulletin-new-v229').length,9);
   f.failReads(true);f.w.document.querySelector('[data-announcement-id="2"]').click();await tick();assert.equal(f.w.document.getElementById('customerAnnouncementsCountV363').textContent,'9','failed receipt stays unread');
   f.w.document.querySelector('#customerBulletinArticleV229 button').click();await tick(80);
   f.w.document.querySelector('#customerBulletinHistoryV229 button').click();await tick(80);assert(!f.visible('customerBulletinHistoryV229'));assert(!f.w.document.getElementById('appView').inert);
   // Resume re-reads the same per-user receipts without a new connection or poller.
   f.failReads(false);f.reads.add(2);f.run('document.dispatchEvent(new Event("visibilitychange"))');await tick();assert.equal(f.w.document.getElementById('customerAnnouncementsCountV363').textContent,'8');
   f.run('updateUnread()');assert.equal(f.w.document.getElementById('customerMessagesCountV363').textContent,'1');assert(!f.visible('supportChatModalV52'),'normal icon entry never opens chat');
   f.run(`globalThis.messageWrites=[];api=async body=>{messageWrites.push(body);return true;}`);f.click('customerMessagesV363');await tick(80);
   assert(f.visible('supportChatModalV52'));assert(f.w.document.getElementById('supportMessageThreadV52').textContent.includes('Private synthetic message'));
   assert.equal(f.run('messageWrites.filter(x=>x.action==="mark_messages_read").length'),1);assert(f.w.document.getElementById('customerMessagesCountV363').classList.contains('hidden'));
   f.run(`state.data.messages.push({id:2,sender_role:'staff',read_at:null,body:'Incoming',created_at:'2026-01-01'});renderMessages();`);await tick();assert.equal(f.run('messageWrites.length'),2);
   f.click('supportChatCloseV52');f.run(`state.data.messages.push({id:3,sender_role:'staff',read_at:null,body:'Unread',created_at:'2026-01-01'});renderMessages();updateUnread();`);await tick();assert.equal(f.run('messageWrites.length'),2);assert.equal(f.w.document.getElementById('customerMessagesCountV363').textContent,'1');
   f.run('clearSession()');assert(f.w.document.getElementById('customerAnnouncementsCountV363').classList.contains('hidden'));
   assert.deepEqual(f.errors,[]);console.log('PASS inbox',dogs,'dogs: ten/expired/future/inactive/empty/read-only-detail/failure/resume/chat/realtime/logout');
  }finally{f.w.close();}
 }
 for(const mode of ['messages','announcement','other-account','wrong-conversation','icon']){
  const q=mode==='icon'?'':'?open='+(mode==='announcement'?'announcement&announcement=1':'messages&conversation='+(mode==='wrong-conversation'?99:7))+'&recipient='+(mode==='other-account'?'other-user':'synthetic-user');
  const f=await fixture(q);try{
   assert(!f.visible('supportChatModalV52'));assert(f.w.location.search===q,'target survives unauthenticated startup');
   f.setNotices([row(1)]);f.login();await f.run('loadAnnouncements(true)');f.run('document.dispatchEvent(new Event("customer-onboarding-ready-v358"))');await tick(90);
   assert.equal(f.visible('supportChatModalV52'),mode==='messages',mode);assert.equal(f.visible('customerBulletinArticleV229'),mode==='announcement',mode);
   if(mode!=='icon')assert(!f.w.location.search.includes('open='),'consumed once');
   if(mode==='announcement'){f.w.document.querySelector('#customerBulletinArticleV229 button').click();await tick(80);assert(!f.w.location.search.includes('open='),'back entry cannot restore consumed push');f.run('document.dispatchEvent(new Event("visibilitychange"))');await tick();assert(!f.visible('customerBulletinArticleV229'),'resume never replays consumed push');}
   assert.deepEqual(f.errors,[]);console.log('PASS notification target through login',mode);
  }finally{f.w.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
