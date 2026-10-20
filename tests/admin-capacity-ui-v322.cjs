const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{JSDOM}=require('./shared-v244/node_modules/jsdom');
let html=process.env.ADMIN_SOURCE?fs.readFileSync(process.env.ADMIN_SOURCE,'utf8'):require('../tools/build-admin-capacity-v322.cjs')();
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
assert(html.includes(marker));html=html.replace(marker,'window.__capacity322={render:renderWeek,edit:editDefaultCapacityV322,capacity:dayCapacity,card:reservationCard,client:supabase};window.__proof321={client:supabase,mutate:mutateAdminProofV321,prepare:prepareAdminProofV321,render:renderAdminVaccinationProofsV104,open:openDog};\n'+marker);
const dom=new JSDOM(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://admin.fixture',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,errors=[];
const tick=()=>new Promise(r=>setTimeout(r,20));let rows=[1,2,3].map(id=>({id,dog_id:1,storage_path:'fixture/'+id,image_url:'https://image.fixture/'+id+'?token=1'})),payloads=[],fail=false,next=4;
const query=()=>new Proxy({then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}},{get(t,k){return k in t?t[k]:()=>query()}});
w.supabase={createClient:()=>({from:()=>query(),rpc:async()=>({data:[],error:null}),auth:{getSession:async()=>({data:{session:{access_token:'fixture',user:{id:'staff'}}}}),onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}}})};
Object.assign(w.supabase,w.supabase.createClient());
w.console.error=(...a)=>errors.push(a.map(String).join(' '));w.addEventListener('error',e=>errors.push(e.message));w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
w.WebSocket=class{static OPEN=1;static CONNECTING=0;constructor(){this.readyState=0}close(){}send(){}};
w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
// Only browser image/canvas APIs are simulated; actual preparation and action handlers execute.
w.createImageBitmap=async()=>({width:1600,height:1200,close(){}});let draws=0,rotations=[];
w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},translate(){},rotate(a){rotations.push(a)},drawImage(){draws++}});w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,/9j/2Q==';
w.fetch=async(url,opts={})=>{
 if(String(url).includes('/auth/v1/token'))return {ok:true,json:async()=>({access_token:'fixture',user:{id:'staff'}})};
 if(String(url).includes('/rest/v1/rpc/portal_set_default_capacity_v322')){payloads.push(JSON.parse(opts.body));return {ok:!fail,text:async()=>fail?JSON.stringify({message:'Fixture denied'}):'12',headers:{get:()=>''}};}
 if(String(url).startsWith('https://image.fixture/'))return {ok:true,blob:async()=>new w.Blob(['fixture'],{type:'image/jpeg'})};
 const p=JSON.parse(opts.body||'{}');if(p.action==='admin_vaccination_proofs')return {ok:true,json:async()=>({data:rows.filter(r=>r.dog_id===p.dog_id)})};
 if(p.action==='staff_photo_urls')return {ok:true,json:async()=>({data:[]})};
 if(p.action==='upload_vaccination_proofs'||p.action==='admin_delete_vaccination_proof'){
  payloads.push(p);if(fail)return {ok:false,json:async()=>({error:'Fixture upload failed'})};
  if(p.action==='admin_delete_vaccination_proof')rows=rows.filter(r=>r.id!==p.proof_id);
  else {if(p.replace_proof_id)rows=rows.filter(r=>r.id!==p.replace_proof_id);rows.push(...p.images.map(()=>({id:next++,dog_id:p.dog_id,storage_path:'fixture/'+next,image_url:'https://image.fixture/'+next})))}
  return {ok:true,json:async()=>({data:{proofs:rows.filter(r=>r.dog_id===p.dog_id)}})};
 }
 return {ok:true,json:async()=>({data:[]}),text:async()=>String(url).includes('/rest/v1/staff')?'{"user_id":"staff","active":true}':'[]',headers:{get:()=>''}};
};
for(const [,code] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(code.trim())new vm.Script(code).runInContext(dom.getInternalVMContext())}
w.document.dispatchEvent(new w.Event('DOMContentLoaded'));

(async()=>{try{
 await tick();await w.__capacity322.client.auth.signInWithPassword({email:'fixture@example.invalid',password:'fixture'});await tick();
 const api=w.__capacity322;w.state.defaultCapacity=10;w.state.portalDaySettings=[{day:'2030-01-02',capacity:13}];api.render();
 const b=w.document.getElementById('defaultCapacityV322');assert(b.textContent.includes('10'));assert.equal(api.capacity('2030-01-01'),10);assert.equal(api.capacity('2030-01-02'),13);
 w.prompt=()=> '12';b.click();await tick();assert.equal(payloads.at(-1).p_capacity,12);assert.equal(w.state.defaultCapacity,12);assert.equal(api.capacity('2030-01-02'),13);assert(!b.disabled);
 fail=true;w.prompt=()=> '11';await api.edit();assert.equal(w.state.defaultCapacity,12);assert(!b.disabled);fail=false;
 const count=payloads.length;for(const raw of ['0','31','1.5',null]){w.prompt=()=>raw;await api.edit()}assert.equal(payloads.length,count);
 w.state.dogs=[{id:1,name:'Falco',owner_id:10,sex:'male',default_entry_type:'pass'}];
 const date=new Date(),iso=new w.Date(date).getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 const card=api.card({id:1,dog_id:1,reservation_date:iso,status:'attended',entry_type:'pass',planned_entry_number:18,planned_pass_total:20});
 assert(card.includes('mark-no-show'));assert(card.includes('18 z 20'));
 const style=w.document.getElementById('admin-capacity-boot-v322').textContent;assert(style.includes('flex-wrap:nowrap!important'));assert(style.includes('max-content'));assert.equal(w.document.querySelectorAll('#bottomNav').length,1);assert.deepEqual(errors,[]);
 console.log('PASS actual assembled admin: header click persists valid default, per-day override retained, failure/invalid/cancel unchanged, Falco 18/20 no-show markup and single nav; physical geometry not observed.');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
