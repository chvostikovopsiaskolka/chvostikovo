import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {stripTypeScriptTypes} from 'node:module';
import {webcrypto} from 'node:crypto';
const original=fs.readFileSync('supabase/backups/meta-crm-event-before-v262.ts','utf8');
assert.throws(()=>new vm.Script(stripTypeScriptTypes(original)),/already been declared/);
const code=stripTypeScriptTypes(fs.readFileSync('supabase/functions/meta-crm-event/index.ts','utf8'));
const lead={id:101,form_type:'lead',owner_name:'Test Customer',phone:'+421912345678',email:'customer@example.test',created_at:'2026-01-01T12:00:00Z',source_ref:'/psia-skolka-kosice?utm_campaign=lead&fbclid=original',raw_payload:{marketing_consent:true,meta_fbc:'fb.1.1700000000.original',meta_fbp:'fb.1.1700000000.browser'}};
const app={id:202,form_type:'application',owner_name:'Customer',phone:lead.phone,email:lead.email,created_at:'2026-10-16T12:00:00Z',source_ref:'/prihlaska',raw_payload:{marketing_consent:true,dog_count:2}};
let rows=[],logs=[],sends=[],staffAllowed=true,handler,readPaths=[],metaFailOnce=false;
const fetch=async(url,opts={})=>{
 url=String(url);
 if(url.includes('/auth/v1/user'))return new Response(JSON.stringify({id:'staff'}),{status:staffAllowed?200:401});
 if(url.includes('graph.facebook.com')){sends.push(JSON.parse(opts.body));if(metaFailOnce){metaFailOnce=false;return new Response(JSON.stringify({error:'Temporary failure'}),{status:503})}return new Response(JSON.stringify({events_received:1}));}
 assert(url.startsWith('https://fixture.supabase.co/rest/v1/'),'Unexpected transport '+url);
 const path=url.split('/rest/v1/')[1];readPaths.push(path);let result;
 if(path.startsWith('rpc/verify_chv_marketing_cron_secret'))result=JSON.parse(opts.body).p_secret==='fixture-cron';
 else if(path.startsWith('web_form_submissions?crm_qualified_at='))result=rows.filter(r=>r.crm_qualified_at);
 else if(path.startsWith('web_form_submissions?status=eq.converted'))result=rows.filter(r=>r.status==='converted');
 else if(path.startsWith('staff?'))result=staffAllowed?[{user_id:'staff'}]:[];
 else if(path.startsWith('web_form_submissions?id=')){const id=Number(new URL(url).searchParams.get('id').slice(3));result=rows.filter(r=>r.id===id);}
 else if(path.startsWith('web_form_submissions?or=')){const root=Number(new URL(url).searchParams.get('or').match(/id.eq.(\d+)/)[1]);result=rows.filter(r=>r.id===root||r.crm_lead_id===root);}
 else if(path.startsWith('web_form_submissions?phone='))result=rows.filter(r=>r.phone===new URL(url).searchParams.get('phone').slice(3));
 else if(path.startsWith('meta_crm_event_log?')&&opts.method==='POST'){const row=JSON.parse(opts.body);logs=logs.filter(r=>r.submission_id!==row.submission_id||r.event_name!==row.event_name);logs.push(row);return new Response(null,{status:204});}
 else if(path.startsWith('meta_crm_event_log?')){const params=new URL(url).searchParams;result=logs.filter(r=>{
  const id=params.get('submission_id'),ev=params.get('event_name'),status=params.get('status');
  return (!id||(id.startsWith('eq.')?r.submission_id===Number(id.slice(3)):id.slice(4,-1).split(',').map(Number).includes(r.submission_id)))&&(!ev||r.event_name===ev.slice(3))&&(!status||(status==='eq.sent'?r.status==='sent':['sent','skipped'].includes(r.status)));
 });}
 else throw Error('Unhandled fixture '+path);
 return new Response(JSON.stringify(result));
};
const env={SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',META_CAPI_ACCESS_TOKEN:'fixture-meta'};
const ctx=vm.createContext({fetch,Response,Request,Headers,URL,TextEncoder,crypto:webcrypto,console:{info(){},error(){}},Deno:{env:{get:k=>env[k]},serve:fn=>handler=fn}});
new vm.Script(code).runInContext(ctx);
const send=async(id,stage='converted')=>{const r=await handler(new Request('https://fixture/crm',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({submission_id:id,stage})}));return {status:r.status,...await r.json()};};
rows=[structuredClone(lead),structuredClone(app)];
assert.equal((await send(202)).ok,true);assert.equal(sends.length,1);assert.equal(sends[0].data.length,1);
const event=sends[0].data[0];assert.equal(event.event_id,'crm-convertedlead-101');assert.equal(event.user_data.fbc,lead.raw_payload.meta_fbc);assert.equal(event.user_data.fbp,lead.raw_payload.meta_fbp);assert(event.event_source_url.includes('utm_campaign=lead'));assert.equal(event.event_name,'ConvertedLead');
assert(readPaths.some(p=>p.startsWith('web_form_submissions?phone=')&&!p.includes('created_at=gte')),'Historical lead lookup must not inherit retry date window');
await send(101);await send(202);assert.equal(sends.length,1);assert(logs.some(l=>l.submission_id===101&&l.response.linked_duplicate));
await send(202,'qualified');assert.equal(sends.length,2);assert.equal(sends[1].data[0].event_id,'crm-qualifiedlead-101');
console.log('PASS delayed direct application inherits original consenting lead fbc/fbp/source, common event ID; two dogs one owner conversion; cross-form duplicate logged; qualified and converted separate');
logs=[];sends=[];rows=[{...app,raw_payload:{marketing_consent:false}},lead];assert.equal((await send(202)).skipped,'no_marketing_consent');assert.equal(sends.length,0);
logs=[];rows=[{...app,raw_payload:{marketing_consent:true,is_test:true}},lead];assert.equal((await send(202)).skipped,'test_submission');assert.equal(sends.length,0);
logs=[];rows=[{...app,email:'different@example.test'},lead];await send(202);assert.equal(sends[0].data[0].event_id,'crm-convertedlead-202');assert.equal(sends[0].data[0].user_data.fbc,undefined);
logs=[];sends=[];rows=[{...app,email:null,owner_name:'Danka'},{...lead,email:null,owner_name:'Dana'}];await send(202);assert.equal(sends[0].data[0].event_id,'crm-convertedlead-202');
logs=[];sends=[];rows=[{...app},{...lead,raw_payload:{...lead.raw_payload,is_test:true}}];await send(202);assert.equal(sends[0].data[0].event_id,'crm-convertedlead-202');assert.equal(sends[0].data[0].user_data.fbc,undefined);
staffAllowed=false;const denied=await send(202);assert.equal(denied.status,400);assert.equal(sends.length,1);
assert.equal((await handler(new Request('https://fixture/crm',{method:'OPTIONS'}))).status,200);
console.log('PASS no-consent and test exclusion; conflicting email/name cannot silently merge; historical test excluded from attribution; real Auth/staff gate; boot and OPTIONS');

// Persisted staff link deliberately resolves a spelling difference; tracking survives a changed phone too.
staffAllowed=true;logs=[];sends=[];rows=[{...lead,owner_name:'Dana'},{...app,owner_name:'Danka',email:null,phone:'+421900000099',crm_lead_id:101}];
await send(202);assert.equal(sends[0].data[0].event_id,'crm-convertedlead-101');assert.equal(sends[0].data[0].user_data.fbc,lead.raw_payload.meta_fbc);
await send(101);assert.equal(sends.length,1);
console.log('PASS persisted explicit link preserves source and one conversion across changed spelling/phone; legacy unlinked conflict still does not merge');

logs=[];sends=[];rows=[lead,{...app,crm_lead_id:101,status:'converted',crm_qualified_at:'2026-10-16T10:00:00Z'}];metaFailOnce=true;
const cron=async(secret='fixture-cron')=>{const r=await handler(new Request('https://fixture/crm',{method:'POST',headers:{'x-chv-marketing-cron':secret}}));return {status:r.status,...await r.json()};};
assert.equal((await cron('wrong')).status,403);assert.equal(sends.length,0);
const first=await cron();assert.equal(first.failed,1);assert.equal(first.sent,1);
const retry=await cron();assert.equal(retry.failed,0);assert.equal(retry.sent,1);assert.equal(sends.length,3);assert.equal(sends[0].data[0].event_id,sends[2].data[0].event_id);assert.equal((await cron()).pending,0);
console.log('PASS authenticated cron retries a failed qualification from durable application marker after intro deletion; same event ID, converted once, completed queue empty; bad secret denied');
