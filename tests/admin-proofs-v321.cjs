const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{JSDOM}=require('./shared-v244/node_modules/jsdom');
let html=process.env.ADMIN_SOURCE?fs.readFileSync(process.env.ADMIN_SOURCE,'utf8'):require('../tools/build-admin-proofs-v321.cjs')();
const marker='/* v63: messages/dashboard update via initial load + Realtime + resume sync; no periodic polling */';
assert(html.includes(marker));html=html.replace(marker,'window.__proof321={client:supabase,mutate:mutateAdminProofV321,prepare:prepareAdminProofV321,render:renderAdminVaccinationProofsV104,open:openDog};\n'+marker);
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
 await tick();await w.__proof321.client.auth.signInWithPassword({email:'fixture@example.invalid',password:'fixture'});await tick();w.state.dogs=[{id:1,owner_id:10,name:'Synthetic Bella',sex:'female',default_entry_type:'single',owners:{name:'Fixture',phone:''}},{id:2,owner_id:10,name:'Synthetic Iris',sex:'female',default_entry_type:'single',owners:{name:'Fixture',phone:''}}];
 await w.__proof321.open(1);await tick();let root=w.document.getElementById('adminVaccinationProofsV104');assert.equal(root.querySelectorAll('img').length,3,root.outerHTML);assert.equal(root.querySelectorAll('.admin-proof-pencil-v321').length,3);assert(root.querySelector('label input').multiple);
 const oldImages=[...root.querySelectorAll('img')];delete root.dataset.loadedDog;rows=rows.map(p=>({...p,image_url:p.image_url.replace('token=1','token=2')}));await w.__proof321.render(1);assert([...root.querySelectorAll('img')].every((img,i)=>img===oldImages[i]));assert(oldImages[0].src.endsWith('token=1'));
 root.querySelector('.admin-proof-pencil-v321').click();const modal=w.document.getElementById('adminProofActionsV321');assert(!modal.classList.contains('hidden'));modal.querySelector('[data-proof-right]').click();assert(!modal.querySelector('[data-proof-save]').hidden);modal.querySelector('[data-proof-save]').click();await tick();assert.equal(payloads.at(-1).replace_proof_id,1);assert.equal(payloads.at(-1).images.length,1);assert(rotations.includes(Math.PI/2));assert(oldImages[1].isConnected&&oldImages[2].isConnected);
 const file=new w.File(['fixture'],'proof.jpg',{type:'image/jpeg'});await w.__proof321.mutate(root,1,{files:[file]});assert.equal(payloads.at(-1).append,true);assert.equal(root.querySelectorAll('img').length,4);
 const stable=[...root.querySelectorAll('img')];fail=true;await w.__proof321.mutate(root,1,{files:[file],replaceId:2});assert(root.textContent.includes('Fixture upload failed'));assert([...root.querySelectorAll('img')].every((img,i)=>img===stable[i]));assert(!root.querySelector('input').disabled);fail=false;
 root.querySelector('[data-proof-id="2"] .admin-proof-pencil-v321').click();modal.querySelector('[data-proof-delete]').click();await tick();assert.equal(payloads.at(-1).proof_id,2);assert.equal(root.querySelectorAll('img').length,3);
 const requests=payloads.length;await w.__proof321.mutate(root,1,{files:[file,file,file]});assert.equal(payloads.length,requests);assert(root.textContent.includes('najviac 5'));
 await w.__proof321.open(2);await tick();assert(!oldImages[1].isConnected);root=w.document.getElementById('adminVaccinationProofsV104');assert.equal(root.querySelectorAll('img').length,0);assert(root.textContent.includes('Pridať fotky'));await w.__proof321.mutate(root,2,{files:[file]});assert.equal(payloads.at(-1).dog_id,2);assert.equal(root.querySelectorAll('img').length,1);
 const style=w.document.getElementById('admin-proof-management-v321').textContent;assert(style.includes('grid-auto-flow:column'));assert(style.includes('calc((100% - 18px)/3)'));assert(style.includes('-webkit-tap-highlight-color:transparent'));
 assert(draws>=4);assert.deepEqual(errors,[]);console.log('PASS fully assembled admin: actual dog detail, add/rotate/replace/delete handlers, preserved images/signature renewal, failure/limit recovery, two-dog isolation, native file labels, single-row layout. Physical phones unobserved.');
}finally{w.close()}})().catch(e=>{console.error(e);process.exitCode=1});
