const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const {JSDOM}=require('./shared-v244/node_modules/jsdom');
const h=require('../tools/build-admin-booking-v269.cjs')();
const scripts=[...h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const main=scripts.find(s=>s.includes('(async()=>{')&&s.includes('const state ='));
assert(main.includes('function bookingReviewV269()'));assert(!h.includes('<script id="chvo-booking-review-v267">'));
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
// Execute the actual complete production lexical scope up to auth registration.
// No fabricated global helpers: the booking module must use real main-app declarations.
const code=main.slice(0,main.indexOf(marker))+"\nwindow.__testOverview=()=>renderRequestOverview();window.__testDog=id=>pendingDogRequestsHtml(id);\n})().catch(e=>{window.__bootError=e});";
const dom=new JSDOM(h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://admin.test',runScripts:'outside-only'});const w=dom.window;
w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}})},rpc:async()=>({data:[],error:null})})};w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>''});w.alert=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};
(async()=>{try{new vm.Script(code).runInContext(dom.getInternalVMContext());await new Promise(r=>setImmediate(r));if(w.__bootError)throw w.__bootError;assert(w.bookingReviewV267,'module must initialize inside real application scope');
 w.state.dogs=[{id:79,name:'Hannah'}];w.state.customerBookings=[19,20,21,22,23].map((day,i)=>({id:83+i,dog_id:79,user_id:'hannah-owner',reservation_date:'2026-10-'+day,status:'pending',taxi_mode:'none'}));w.__testOverview();const b=w.document.getElementById('pendingBookingsOverviewBody');assert.equal(b.querySelectorAll('details').length,1);assert.equal(b.querySelectorAll('.review-day-v267').length,5);assert.equal(b.querySelectorAll('.review-all-v267 [data-review267="approve"]').length,1);assert.equal(w.document.getElementById('pendingBookingsOverviewCount').textContent,'1');assert(w.__testDog(79).includes('review-date-v269'));
 const dash=scripts.find(s=>s.includes('function dashPendingHtmlV42'));const start=dash.indexOf('function dashPendingHtmlV42'),end=dash.indexOf('function dashPassHtmlV42',start);new vm.Script(dash.slice(start,end)+';window.__dashPending=dashPendingHtmlV42;').runInContext(dom.getInternalVMContext());const modal=w.document.createElement('div');modal.innerHTML=w.__dashPending();assert.equal(modal.querySelectorAll('details').length,1);assert.equal(modal.querySelectorAll('.review-day-v267').length,5);
 console.log('PASS actual production main scope: initialization, overview, dog profile and dashboard modal all group Hannah five days into one card');
 }finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
