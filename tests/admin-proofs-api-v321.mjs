import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';
let handler,failUpload=false,next=10;const proofs=[1,2,3].map(id=>({id,dog_id:1,batch_id:'batch',storage_path:'dogs/1/old'+id+'.jpg',is_current:true,source:'customer'}));
const calls=[],response=x=>new Response(JSON.stringify(x),{status:200});
const transport=async(url,options={})=>{
 const u=new URL(url),p=u.pathname,params=u.searchParams,method=options.method||'GET',body=options.body&&typeof options.body==='string'?JSON.parse(options.body):options.body;calls.push([p,method,body]);
 if(p==='/auth/v1/user'){const token=options.headers.Authorization;return token==='Bearer expired'?new Response('{}',{status:401}):response({id:token==='Bearer staff'?'staff':'owner',email:'fixture@example.invalid',user_metadata:{}})}
 if(p.includes('/storage/v1/object/sign/'))return response({signedURL:'/object/sign/vaccination-proof-photos/fixture?token=private'});
 if(p.includes('/storage/v1/object/'))return failUpload?new Response('fixture upload failed',{status:503}):response({Key:'fixture'});
 const table=p.split('/').at(-1);
 if(table==='app_settings')return response(params.get('setting_key')==='eq.daycare_default_capacity'?[{setting_value:'10'}]:[]);
 if(table==='portal_day_settings'){const d=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava'}).format(new Date())+'T12:00:00Z');const day=d.getUTCDay();d.setUTCDate(d.getUTCDate()+(day===0?1:1-day));return response([{day:d.toISOString().slice(0,10),capacity:12,bookings_open:true}]);}
 if(table==='staff')return response(params.get('user_id')==='eq.staff'?[{user_id:'staff'}]:[]);
 if(table==='customer_owner_links')return response([{owner_id:10,allowed_dog_ids:[1]}]);
 if(table==='dogs')return response([{id:1,owner_id:10,name:'Synthetic Bella',photo_path:null}]);
 if(table==='customer_profiles')return response([{user_id:'owner',status:'active'}]);
 if(table==='portal_shared_bootstrap_v260')return response({enabled:true,memberships:[]});
 if(table==='vaccination_proofs'){
   if(method==='POST'){const added=body.map(p=>({...p,id:next++}));proofs.push(...added);return response(added)}
   let rows=proofs.filter(p=>!params.has('is_current')||p.is_current);
   const dog=params.get('dog_id');if(dog?.startsWith('eq.'))rows=rows.filter(p=>p.dog_id===Number(dog.slice(3)));if(dog?.startsWith('in.'))rows=rows.filter(p=>dog.includes(String(p.dog_id)));
   if(params.get('id'))rows=rows.filter(p=>p.id===Number(params.get('id').slice(3)));
   if(method==='PATCH')rows.forEach(p=>Object.assign(p,body));return response(rows);
 }
 return response([]);
};
const context={Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://fixture.invalid':'fixture-secret'},serve:f=>handler=f},Request,Response,URL,URLSearchParams,console,crypto,TextEncoder,atob,fetch:transport};vm.createContext(context);vm.runInContext(stripTypeScriptTypes(fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8')),context);
const post=async(token,body)=>{const r=await handler(new Request('https://fixture.invalid/',{method:'POST',headers:{authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()}};
const jpeg='data:image/jpeg;base64,/9j/2Q==';
let r=await post('staff',{action:'upload_vaccination_proofs',dog_id:1,images:[jpeg],append:true});assert.equal(r.status,200);assert.equal(r.data.data.proofs.length,4);assert.equal(proofs.at(-1).source,'staff');
const added=proofs.at(-1).id;
r=await post('staff',{action:'upload_vaccination_proofs',dog_id:1,images:[jpeg],replace_proof_id:2});assert.equal(r.status,200);assert.equal(r.data.data.proofs.length,4);assert(!proofs.find(p=>p.id===2).is_current);assert(proofs.find(p=>p.id===1).is_current&&proofs.find(p=>p.id===3).is_current);
// Actual authenticated owner bootstrap reuses the exact staff records and private signing path.
const boot=await handler(new Request('https://fixture.invalid/',{headers:{authorization:'Bearer owner'}}));const owner=await boot.json();assert.equal(boot.status,200);assert(owner.availability.days.some(d=>d.capacity===10));assert(owner.availability.days.some(d=>d.capacity===12));assert(owner.vaccination_proofs.some(p=>p.id===added&&p.source==='staff'));assert(!owner.vaccination_proofs.some(p=>p.id===2));assert(owner.vaccination_proofs.every(p=>p.image_url));
const snapshot=JSON.stringify(proofs);r=await post('owner',{action:'admin_delete_vaccination_proof',dog_id:1,proof_id:1});assert.equal(r.status,403);assert.equal(JSON.stringify(proofs),snapshot);
r=await post('expired',{action:'admin_delete_vaccination_proof',dog_id:1,proof_id:1});assert.equal(r.status,401);
r=await post('staff',{action:'admin_delete_vaccination_proof',dog_id:2,proof_id:1});assert.equal(r.status,400);assert.equal(JSON.stringify(proofs),snapshot);
failUpload=true;r=await post('staff',{action:'upload_vaccination_proofs',dog_id:1,images:[jpeg],replace_proof_id:1});assert.equal(r.status,400);assert.equal(JSON.stringify(proofs),snapshot);failUpload=false;
r=await post('staff',{action:'admin_delete_vaccination_proof',dog_id:1,proof_id:1});assert.equal(r.status,200);assert.equal(r.data.data.proofs.length,3);assert(!proofs.find(p=>p.id===1).is_current);
r=await post('staff',{action:'admin_delete_vaccination_proof',dog_id:1,proof_id:1});assert.equal(r.status,400);
const after=await (await handler(new Request('https://fixture.invalid/',{headers:{authorization:'Bearer owner'}}))).json();assert.equal(after.vaccination_proofs.length,3);assert(!after.vaccination_proofs.some(p=>[1,2].includes(p.id)));
assert(!calls.some(([p,method])=>/vaccinations$|portal_notifications$|portal_messages$/.test(p)&&method!=='GET'));
console.log('PASS actual API/Auth/staff/owner bootstrap + private signing: add, replace, delete, foreign dog, stale record, expired/unauthorized, failed upload retention; no dates/messages/push writes.');
