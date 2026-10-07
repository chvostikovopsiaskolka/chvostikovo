const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module'),{JSDOM}=require('jsdom');
(async()=>{
 const source=fs.readFileSync('supabase/functions/sms-reservations/index.ts','utf8');
 async function feed(activePush=true,activeProfile=true,channel='push'){
  let handler;const data={};const context={Request,Response,URL,TextEncoder,AbortController,setTimeout,clearTimeout,console,crypto:{subtle:{digest:async()=>Uint8Array.from(Buffer.from('48df85454b07413f890a5032a84dc63636b6c3380cec4202dcd2c1a1401be899','hex')).buffer}},Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://test.invalid':'test'},serve:fn=>handler=fn},fetch:async url=>{
   let rows=[];if(url.includes('/reservations?'))rows=[1,2,3].map(id=>({id,dog_id:id,reservation_date:'2026-10-08',entry_type:'single'}));
   else if(url.includes('/dogs?'))rows=[{id:1,name:'SMS',owner_id:1,visit_reminder_channel:'sms'},{id:2,name:'Both',owner_id:2,visit_reminder_channel:'both'},{id:3,name:'Push',owner_id:3,visit_reminder_channel:channel}];
   else if(url.includes('/customer_owner_links?'))rows=[{owner_id:3,user_id:'user'}];
   else if(url.includes('/customer_profiles?'))rows=activeProfile?[{user_id:'user'}]:[];
   else if(url.includes('/portal_push_subscriptions?'))rows=activePush?[{user_id:'user'}]:[];
   else if(url.includes('/owners?'))rows=[1,2,3].map(id=>({id,phone:'test'}));
   return new Response(JSON.stringify(rows),{status:200});
  }};vm.createContext(context);vm.runInContext(stripTypeScriptTypes(source),context);
  const unauthorized=await handler(new Request('https://test.invalid?date=2026-10-08'));assert.equal(unauthorized.status,401);
  const response=await handler(new Request('https://test.invalid?date=2026-10-08',{headers:{'x-sms-secret':'test-only'}}));assert.equal(response.status,200);return response.json();
 }
 for(const channel of ['auto','push']){assert.deepEqual((await feed(true,true,channel)).map(r=>r.dog_id),[1,2]);assert.equal((await feed(false,true,channel)).length,3);assert.equal((await feed(true,false,channel)).length,3);}
 console.log('PASS: SMS unchanged by default/dual mode; push-only suppression with active profile+subscription; missing push fallback; unauthorized feed');
})().catch(error=>{console.error(error);process.exit(1)});
