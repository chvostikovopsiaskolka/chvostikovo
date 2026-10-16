const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const before=require('zlib').gunzipSync(fs.readFileSync('supabase/backups/admin-before-v275.html.gz')).toString('utf8'),after=process.env.ADMIN_SOURCE?fs.readFileSync(process.env.ADMIN_SOURCE,'utf8'):require('../tools/build-admin-stability-v275.cjs')();
async function boot(html){
 const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://admin.fixture',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[];
 w.console.error=(...args)=>errors.push(args.map(String).join(' '));w.addEventListener('error',e=>errors.push(e.message));
 const query={select(){return this},is(){return this},eq(){return this},order(){return this},limit:async()=>({data:[],error:null})};
 w.supabase={createClient:()=>({from:()=>query,auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}})},rpc:async()=>({data:{},error:null})})};
 w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>''});w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 for(const script of scripts){if(!script.trim())continue;try{new vm.Script(script).runInContext(dom.getInternalVMContext())}catch(e){errors.push(e.message)}}
 await new Promise(r=>setTimeout(r,30));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 await new Promise(r=>setTimeout(r,30));
 return {dom,w,errors,scripts};
}
const fixture={traffic:[{report_date:'2026-10-14',page_group:'WEB',source_channel:'direct',landings:10},{report_date:'2026-10-15',page_group:'EN',source_channel:'google_paid',landings:3},{report_date:'2026-10-15',page_group:'LEAD',source_channel:'meta_paid',landings:7}],activity:[{report_date:'2026-10-15',page_group:'LEAD',event_name:'explore_daycare',event_source:'lead_landing_hero',events:5},{report_date:'2026-10-15',page_group:'EN',event_name:'form_start',events:2},{report_date:'2026-10-15',page_group:'LEAD',event_name:'form_abandon',event_source:'form|telefon',events:2}],contacts:[{report_date:'2026-10-15',page_group:'EN',real_leads:1}],meta:[{report_date:'2026-10-14',campaign_id:'c1',ad_id:'a1',campaign_name:'Lead kampaň',ad_name:'Video',metrics:{amount_spent:5,impressions:100,reach:50,link_click:4,clicks:6,status:'ACTIVE',campaign_status:'ACTIVE',video_play:20,thruplay:5,post_engagement:12,post_reaction:3}},{report_date:'2026-10-15',campaign_id:'c1',ad_id:'a1',campaign_name:'Lead kampaň',ad_name:'Video',metrics:{amount_spent:2,impressions:50,reach:30,link_click:1,status:'ACTIVE',campaign_status:'ACTIVE',post_engagement:3,post_reaction:1}}]};
(async()=>{
 const old=await boot(before);
 try{assert(old.errors.some(x=>x.includes('cmSafeV71 is not defined')),JSON.stringify(old.errors));assert(!old.w.chvTraffic266);console.log('REPRODUCED old production: standalone traffic fails with cmSafeV71 is not defined.');}finally{old.w.close()}
 const runtime=await boot(after),{w,scripts}=runtime;
 try{
  assert.deepEqual(runtime.errors,[],'assembled admin must boot without JS errors');assert.equal(w.chvTraffic266.version,275);assert(w.adminViewportNav275);assert(w.bookingReviewV267);assert(w.formRecoveryV273);
  const main=scripts.find(s=>s.includes('const state =')&&s.includes('(async()=>{'));
  assert(main.includes('function trafficV266()'));assert(!after.includes('<script id="chvo-traffic-v266">'));
  // Test entry point is appended inside the actual scope: no fabricated global helpers.
  const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
  const exportCode='window.__trafficTest=(p,from,to)=>{campaignV71.payload=p;campaignV71.from=from;campaignV71.to=to;campaignV71.page="ALL";campaignV71.selected=null;campaignV71.showAllCampaigns=false;cmRenderV71()};';
  const mainWithExport=main.replace(marker,exportCode+marker);
  // A second isolated boot prevents installing duplicate main handlers.
  w.close();
  const assembled=after.replace(main,mainWithExport),run=await boot(assembled),v=run.w;
  try{
   assert.deepEqual(run.errors,[]);const data=process.env.TRAFFIC_FIXTURE?JSON.parse(fs.readFileSync(process.env.TRAFFIC_FIXTURE)):fixture;
   v.__trafficTest(data,'2026-10-01','2026-10-16');
   const root=v.document.getElementById('campaignOverviewV71');
   assert.equal(root.querySelectorAll('.t266-kpis>.t266-kpi').length,2);assert(root.querySelector('.t266-line svg path'));assert.equal(root.querySelectorAll('.t266-pagecol').length,4);assert(root.querySelector('.t266-donut'));assert(root.textContent.includes('Kliknutia na tlačidlá'));assert(root.textContent.includes('Formuláre'));assert.equal(root.querySelectorAll('details').length,0,'web statistics must be immediately visible');assert(!root.textContent.includes('undefined'));assert(!root.textContent.includes('NaN'));
   assert.equal(root.querySelectorAll('[data-t266-point]').length,16);
   root.querySelector('[data-cm-page="EN"]').click();assert(root.querySelector('[data-cm-page="EN"][aria-pressed="true"]'));assert(!root.textContent.includes('Chcem sa informovať'));
   v.document.querySelector('[data-t266-pane="campaigns"]').click();assert.equal(root.querySelectorAll('.t266-line').length,4,'spend, clicks, impressions and reach visible together');assert(!root.querySelector('[data-t266-ad]'));
   root.querySelector('[data-cm-campaign]').click();assert.equal(root.querySelectorAll('.t266-line').length,4);assert(root.querySelector('[data-t266-ad]'));
   root.querySelector('[data-t266-back]').click();v.document.querySelector('[data-t266-pane="web"]').click();assert(root.querySelector('.t266-donut'));
   const report=v.chv119.reportDecor('',data,'2026-10-15',{});assert(report.includes('t266-report'));assert(report.includes('🌐'));assert(report.includes('Formuláre'));
   assert.deepEqual(run.errors,[]);console.log('PASS full assembled admin scripts: real main scope, actual delegated tabs/page/campaign handlers, visible web KPIs/date chart/four pages/sources/CTAs/form funnel, four campaign graphs, creative detail and report adapter.');
  }finally{v.close()}
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
