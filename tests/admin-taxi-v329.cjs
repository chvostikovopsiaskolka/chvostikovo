const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const {JSDOM}=require('./shared-v244/node_modules/jsdom');
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
(async()=>{
const html=fs.readFileSync(process.env.ADMIN_SOURCE||'/tmp/admin-candidate-v329.html','utf8');
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
assert(html.includes(marker));const exported=html.replace(marker,'window.__taxi329={label:taxiLabel,amount:taxiAmount,choices:adminTaxiChoicesV329,state};'+marker);
const {w,errors}=await boot(exported);try{
assert.deepEqual(errors,[]);assert(w.bookingReviewV267);const api=w.__taxi329;
for(const [mode,label,amount] of [['pickup','Vyzdvihnutie',5],['dropoff','Dovoz domov',5],['pickup_dropoff','Vyzdvihnutie aj dovoz',10]]){assert(api.label(mode).includes(label));assert.equal(api.amount(mode),amount);}
const host=w.document.createElement('div');host.innerHTML=api.choices('fixtureTaxi');w.document.body.append(host);assert.equal(host.querySelectorAll('.admin-taxi-v329>div button').length,3);
for(const mode of ['pickup','dropoff','pickup_dropoff','none']){host.querySelector('[data-admin-taxi-v329="'+mode+'"]').click();assert.equal(w.document.getElementById('fixtureTaxi').value,mode);assert.equal(host.querySelectorAll('[aria-pressed="true"]').length,1);}
api.state.dogs=[{id:1,name:'Synthetic Bella',active:true}];api.state.customerBookings=[{id:70,user_id:'synthetic',dog_id:1,reservation_date:'2030-10-25',status:'approved',taxi_mode:'pickup',requested_taxi_mode:'dropoff',taxi_change_status:'pending'}];
const review=w.bookingReviewV267.html(api.state.customerBookings);assert(review.includes('Dovoz domov'));assert(review.includes('Zmena taxi'));assert(!review.includes('Bez taxi'));assert.deepEqual(errors,[]);
console.log('PASS fully assembled live admin: all scripts boot in actual scopes, three side-by-side taxi choices/price/save value and delegated real clicks, pending change review uses exact direction; no sends');
}finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
