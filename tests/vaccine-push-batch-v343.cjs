const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{stripTypeScriptTypes}=require('node:module');
const base='supabase/functions/admin-push/';
const helper=fs.readFileSync(base+'security-v336.ts','utf8').replace(/export /g,'');
const source=fs.readFileSync(process.env.ADMIN_PUSH_SOURCE||base+'index.ts','utf8').replace(/^import[^\n]+\n/gm,'');
let handler;const sent=[],queries=[];let events=[],devices=1;
const c={Request,Response,URL,console,crypto,fetch:async(url)=>{
 const u=new URL(url);queries.push(u.pathname+u.search);
 if(u.pathname.endsWith('/rpc/admin_push_runtime_config'))return Response.json({vapid_public_key:'fixture',vapid_private_key:'fixture',webhook_secret:'fixture-secret'});
 if(u.pathname.endsWith('/portal_vaccination_review_events_v234')){
  if(!u.searchParams.has('dog_id'))return Response.json(events.filter(e=>e.review_status==='pending'));
  const dog=Number((u.searchParams.get('dog_id')||'').replace('eq.',''));
  const time=(u.searchParams.get('created_at')||'').replace('eq.','');
  return Response.json(events.filter(e=>e.dog_id===dog&&e.created_at===time).sort((a,b)=>a.id-b.id));
 }
 if(u.pathname.endsWith('/dogs'))return Response.json([{name:'Synthetic Bella'}]);
 if(u.pathname.endsWith('/admin_push_subscriptions'))return Response.json(Array.from({length:devices},(_,i)=>({id:i+1,endpoint:'https://fixture.invalid/'+i,p256dh:'fake',auth:'fake'})));
 throw Error('Unexpected outbound request '+u.pathname);
},webpush:{setVapidDetails(){},async sendNotification(device,body){sent.push({device,body:JSON.parse(body)})}},Deno:{env:{get:k=>({SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'}[k])},serve:h=>handler=h}};
vm.createContext(c);vm.runInContext(stripTypeScriptTypes(helper+'\n'+source,{mode:'transform'}),c);
const stamp='2030-10-22T06:00:47.373375+00:00';
const row=(id,type='rabies',dog=1,time=stamp)=>({id,dog_id:dog,vaccination_type:type,created_at:time,review_status:'pending'});
async function post(record,type='INSERT'){
 const r=await handler(new Request('https://fixture.invalid/push',{method:'POST',headers:{'x-push-secret':'fixture-secret'},body:JSON.stringify({table:'portal_vaccination_review_events_v234',type,record})}));assert.equal(r.status,200);return r.json();
}
(async()=>{
 for(const count of [1,2,3,4]){
  events=['rabies','infectious','kennel_cough','lepto_l4'].slice(0,count).map((t,i)=>row(i+1,t));sent.length=0;
  await Promise.all([...events].reverse().map(e=>post(e)));
  assert.equal(sent.length,1,count+' concurrent/out-of-order vaccine rows produce one push per device');
  assert(sent[0].body.body.startsWith('Synthetic Bella'));
  if(count>1){assert.match(sent[0].body.body,/aktualizované očkovania čakajú na kontrolu/);assert(!/Besnota|Infekčné|kašeľ/.test(sent[0].body.body));}
  else assert.match(sent[0].body.body,/Besnota/);
 }
 events=[row(7),row(8,'infectious')];sent.length=0;await Promise.all(events.map(e=>post(e,'UPDATE')));assert.equal(sent.length,1,'upsert updates group too');
 events=[row(1),row(2,'infectious'),row(3,'rabies',2)];sent.length=0;await Promise.all(events.map(e=>post(e)));assert.equal(sent.length,2,'different dogs never merge');
 events=[row(1),row(2,'infectious',1,stamp.replace('373375','373376'))];sent.length=0;await Promise.all(events.map(e=>post(e)));assert.equal(sent.length,2,'microseconds preserved: distinct saves never merge');
 const reviewed={...row(1),review_status:'reviewed'};events=[reviewed];sent.length=0;await post(reviewed,'UPDATE');assert.equal(sent.length,0,'staff review is silent');
 events=[];await post(row(1));assert.equal(sent.length,0,'obsolete webhook is ignored');
 await post({...row(1),created_at:null});assert.equal(sent.length,0,'malformed event is ignored');
 events=[row(1),row(2)];devices=2;sent.length=0;await Promise.all(events.map(e=>post(e)));assert.equal(sent.length,2,'one push to each active device');
 assert(queries.some(q=>q.includes('373375')),'timestamp retains exact PostgreSQL precision');
 assert(!queries.some(q=>q.includes('review_status=eq.pending')),'no unrelated global vaccine count');
 console.log('PASS complete admin-push handler: 1/2/3/4 vaccinations, concurrent/reversed order, UPDATE, separate dogs and saves, exact microseconds, staff review/obsolete/malformed guards, per-device delivery; all outbound pushes mocked');
})().catch(e=>{console.error(e);process.exitCode=1});
