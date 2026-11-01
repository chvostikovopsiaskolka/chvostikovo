const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const path=process.env.ADMIN_SOURCE;if(!path)throw Error('ADMIN_SOURCE required');
const html=fs.readFileSync(path,'utf8').replace('function renderSchoolWeeklyV307(){',"document.addEventListener('test-weekly-report',e=>{weeklySchoolV307.open=true;weeklySchoolV307.rows=e.detail;renderSchoolWeeklyV307();});function renderSchoolWeeklyV307(){").replace('function leaveApp(){',"document.addEventListener('test-leave-app',()=>leaveApp());function leaveApp(){").replace('function renderStats(){',"document.addEventListener('test-render-stats',()=>renderStats());function renderStats(){");
(async()=>{
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://chvostikovo-app.vercel.app/?workspace=chvostikovo',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,errors=[];
 w.addEventListener('error',e=>errors.push(e.message));
 const query={select(){return this},is(){return this},eq(){return this},order(){return this},limit:async()=>({data:[],error:null})};
 w.supabase={createClient:()=>({from:()=>query,auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}})},rpc:async()=>({data:{},error:null})})};
 let fetches=0,scrolls=0;w.HTMLElement.prototype.scrollIntoView=()=>{scrolls++;};
 w.fetch=async()=>{fetches++;return ({ok:true,json:async()=>[],text:async()=>''});};w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 try{
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))if(m[1].trim())new vm.Script(m[1]).runInContext(dom.getInternalVMContext());
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));await new Promise(r=>setTimeout(r,60));
 assert.equal(w.document.querySelectorAll('#adminSwitchWorkspace').length,1);
 if(html.includes('revenue-disclosure-lifecycle')){
  Object.assign(w.state,{dogs:[{id:1,name:'SYNTHETIC',legacy_total_visits:0}],owners:[],monthlyStats:[{month:'2026-10-01',dog_id:1,visits:1}],passPurchases:[{id:1,dog_id:1,purchased_on:'2026-10-28',purchase_price:200,total_entries:10}],dailyFinancials:[{day:'2026-10-28',single_count:1,taxi_amount:5}],hotelStays:[]});
  w.document.dispatchEvent(new w.Event('test-render-stats'));await new Promise(r=>setTimeout(r,100));
  w.document.dispatchEvent(new w.CustomEvent('test-weekly-report',{detail:[{week_start:'2026-10-26',week_end:'2026-10-30',snapshot:{overview:{visits:38,single_visits:8,pass_visits:28,free_visits:2,confirmed_revenue_eur:null},data_quality:{complete:false,paid_receipt_tracking:false},days:[26,27,28,29,30].map(day=>({date:'2026-10-'+day,finance_recorded:day!==30,accounts_match:day!==30,visits:day===30?null:1}))}}]}));
  assert(w.document.querySelector('#weeklyReportsPanelV307').textContent.includes('Chýba denné účtovanie: 30.10.2026'));
  const el=w.document.querySelector('[data-revenue-month="2026-10"]');assert(el,'real financial renderer produced month header');assert.equal(el.getAttribute('aria-expanded'),'false');assert.equal(el.querySelector('.revenue-disclosure-icon').textContent,'↓');
  const before=fetches;el.click();await new Promise(r=>setTimeout(r,80));assert.equal(el.getAttribute('aria-expanded'),'true');assert.equal(el.querySelector('.revenue-disclosure-icon').textContent,'↑');
  const openScrolls=scrolls;el.click();await new Promise(r=>setTimeout(r,80));assert.equal(el.getAttribute('aria-expanded'),'false');assert.equal(scrolls,openScrolls);assert.equal(fetches,before,'accordion did not query backend');assert(w.document.querySelector('details[data-revenue-week-detail]'));
 }

 w.document.getElementById('adminSettingsModal').classList.remove('hidden');w.document.documentElement.classList.add('admin-settings-open');
 const enhanced=html.includes("const locks=['admin-settings-open'");
 if(enhanced){if(!w.document.getElementById('hotelModal')){const hotel=w.document.createElement('div');hotel.id='hotelModal';hotel.className='overlay hidden';w.document.body.append(hotel);}w.document.getElementById('hotelModal').classList.remove('hidden');w.document.documentElement.classList.add('admin-chat-open-v48','dog-search-open-v65');w.document.body.style.overflow='hidden';const d=w.document.createElement('dialog');d.id='syntheticOpenDialog';d.setAttribute('open','');w.document.body.append(d);}

 w.document.dispatchEvent(new w.Event('test-leave-app'));
 assert(w.document.getElementById('adminSettingsModal').classList.contains('hidden'));
 assert(!w.document.documentElement.classList.contains('admin-settings-open'));
 assert(!w.document.getElementById('loginView').classList.contains('hidden'));
 assert(w.document.getElementById('mainView').classList.contains('hidden'));
 if(enhanced){assert(w.document.getElementById('hotelModal').classList.contains('hidden'));assert(!w.document.getElementById('syntheticOpenDialog').hasAttribute('open'));assert.equal(w.document.body.style.overflow,'');assert(!w.document.documentElement.classList.contains('admin-chat-open-v48'));assert(!w.document.documentElement.classList.contains('dog-search-open-v65'));}

 await new Promise(r=>setTimeout(r,30));assert.deepEqual(errors,[]);console.log('PASS actual assembled scripts, financial renderer/disclosure lifecycle, full overlay cleanup and login restore. Synthetic transport; real signed-in account test pending.');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
