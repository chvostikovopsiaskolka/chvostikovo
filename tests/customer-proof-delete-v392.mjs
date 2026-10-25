import {securityEdgeSourceV336} from './helpers/security-edge-source-v336.mjs';
import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';
let handler,failDelete=false,failRowDelete=false;const rows=[1,2].map(id=>({id,dog_id:1,is_current:true,storage_path:`dogs/1/batch/${id}.jpg`})),objects=new Set(rows.map(r=>r.storage_path)),calls=[];
const reply=x=>new Response(JSON.stringify(x));
const fetch=async(url,o={})=>{const u=new URL(url),table=u.pathname.split('/').at(-1),q=u.searchParams,m=o.method||'GET',body=typeof o.body==='string'?JSON.parse(o.body):o.body;calls.push([u.pathname,m,body]);
 if(u.pathname==='/auth/v1/user')return o.headers.Authorization==='Bearer expired'?new Response('{}',{status:401}):reply({id:o.headers.Authorization==='Bearer other'?'other':'owner'});
 if(table==='staff')return reply([]);if(table==='portal_customer_access_allowed_v336'||table==='consume_request_limit_v336')return reply(true);
 if(table==='customer_owner_links')return reply(q.get('user_id')==='eq.other'?[]:[{owner_id:10,allowed_dog_ids:[1]}]);
 if(table==='dogs')return reply([{id:1,owner_id:10}]);
 if(u.pathname.includes('/object/sign/'))return reply({signedURL:'/fixture'});
 if(u.pathname==='/storage/v1/object/vaccination-proof-photos'&&m==='DELETE'){if(failDelete)return new Response('failed',{status:503});body.prefixes.forEach(p=>objects.delete(p));return reply([])}
 if(table==='vaccination_proofs'){const found=rows.filter(r=>(!q.has('dog_id')||r.dog_id===Number(q.get('dog_id').slice(3)))&&(!q.has('id')||r.id===Number(q.get('id').slice(3))));if(m==='DELETE'){if(failRowDelete)return new Response(JSON.stringify({message:'db failed'}),{status:503});found.forEach(r=>rows.splice(rows.indexOf(r),1))}return reply(found)}
 return reply([]);
};
const c=vm.createContext({Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://fixture.invalid':'secret'},serve:f=>handler=f},fetch,Request,Response,URL,console,crypto,TextEncoder,AbortSignal,atob});vm.runInContext(stripTypeScriptTypes(securityEdgeSourceV336('customer-portal-api')),c);
const post=async(token,id=1,dog=1)=>{const r=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{authorization:'Bearer '+token},body:JSON.stringify({action:'delete_vaccination_proof',dog_id:dog,proof_id:id})}));return {status:r.status,body:await r.json()}};
for(const [token,dog,status] of [['other',1,400],['owner',2,400],['expired',1,401]]){assert.equal((await post(token,1,dog)).status,status);assert.equal(objects.size,2)}
failDelete=true;assert.equal((await post('owner')).status,400);assert.equal(rows.length,2);assert.equal(objects.size,2);failDelete=false;
failRowDelete=true;assert.equal((await post('owner')).status,400);assert.equal(rows.length,2);assert(!objects.has('dogs/1/batch/1.jpg'));failRowDelete=false;
let r=await post('owner');assert.equal(r.status,200);assert.equal(r.body.data.proofs.length,1);assert.equal(rows.length,1);assert.equal(objects.size,1);
assert.equal((await post('owner',1)).status,400);r=await post('owner',2);assert.equal(r.status,200);assert.equal(r.body.data.proofs.length,0);assert.equal(objects.size,0);
assert(!calls.some(([p,m])=>/vaccinations$|portal_notifications$|portal_messages$/.test(p)&&m!=='GET'));
console.log('PASS actual owner API: own/foreign/stale/expired; permanent object+row deletion; Storage failure retention; DB failure retry; last proof removal; no messages/push/date mutations');
