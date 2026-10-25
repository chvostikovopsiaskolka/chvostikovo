const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{stripTypeScriptTypes}=require('node:module');
const dir='supabase/functions/admin-push/',sent=[],queries=[];let handler;
const source=fs.readFileSync(process.env.ADMIN_PUSH_SOURCE||dir+'index.ts','utf8').replace(/^import[^\n]+\n/gm,'');
const helper=fs.readFileSync(dir+'security-v336.ts','utf8').replace(/^export /gm,'');
const ctx={Request,Response,URL,console,crypto,fetch:async(url)=>{const u=new URL(url);queries.push(u.pathname+u.search);
 if(u.pathname.endsWith('/rpc/admin_push_runtime_config'))return Response.json({vapid_public_key:'fixture',vapid_private_key:'fixture',webhook_secret:'fixture-secret'});
 if(u.pathname.endsWith('/portal_push_subscriptions')||u.pathname.endsWith('/admin_push_subscriptions'))return Response.json([{endpoint:'https://synthetic.invalid/device',p256dh:'fake',auth:'fake'}]);
 if(u.pathname.endsWith('/portal_conversations'))return Response.json([{id:7}]);
 if(u.pathname.endsWith('/portal_messages')||u.pathname.endsWith('/portal_notifications'))return Response.json([]);
 throw Error('Unexpected query '+u.pathname);
 },webpush:{setVapidDetails(){},async sendNotification(device,payload){sent.push(JSON.parse(payload));}},Deno:{env:{get:k=>({SUPABASE_URL:'https://synthetic.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'}[k])},serve:h=>handler=h}};
vm.createContext(ctx);vm.runInContext(stripTypeScriptTypes(helper+'\n'+source,{mode:'transform'}),ctx);
(async()=>{
 for(const [type,entity,id,expected] of [['staff_message_customer','conversation',7,'/?open=messages&conversation=7&recipient=synthetic-user'],['announcement_push','announcement',9,'/?open=announcement&announcement=9&recipient=synthetic-user'],['staff_message_customer','conversation',-1,'/'],['staff_message_customer','announcement',9,'/'],['dog_approved','dog',1,'/'],['customer_message_admin','conversation',7,'/']]){
  sent.length=0;const r=await handler(new Request('https://synthetic.invalid/push',{method:'POST',headers:{'x-push-secret':'fixture-secret'},body:JSON.stringify({table:'portal_notifications',type:'INSERT',record:{id:99,recipient_user_id:'synthetic-user',notification_type:type,entity_type:entity,entity_id:id,title:'Synthetic title',body:'https://untrusted.invalid'}})}));
  assert.equal(r.status,200);assert.equal(sent.length,1,'one push per device');assert.equal(sent[0].data.url,expected);assert.equal(sent[0].tag,'portal-99');
 }
 for(const [body,expected] of [['Dobrý deň, zajtrajšiu návštevu Belly máme potvrdenú. Tešíme sa na ňu! 🐾','Dobrý deň, zajtrajšiu návštevu Belly máme potvrdenú. Tešíme sa na ňu! 🐾'],['  ahoj'+String.fromCharCode(10)+' svet  ','ahoj svet'],['','Máte novú správu od Chvostíkova.'],[null,'Máte novú správu od Chvostíkova.'],[{},'Máte novú správu od Chvostíkova.'],['🐾'.repeat(250),'🐾'.repeat(240)+'…']]){
  sent.length=0;const r=await handler(new Request('https://synthetic.invalid/push',{method:'POST',headers:{'x-push-secret':'fixture-secret'},body:JSON.stringify({table:'portal_notifications',type:'INSERT',record:{id:100,recipient_user_id:'synthetic-user',notification_type:'staff_message_customer',entity_type:'conversation',entity_id:7,title:'old title',push_body:'unrelated override',body}})}));
  assert.equal(r.status,200);assert.equal(sent.length,1);assert.equal(sent[0].title,'Chvostíkovo');assert.equal(sent[0].body,expected);assert.equal(sent[0].data.url,'/?open=messages&conversation=7&recipient=synthetic-user');
 }
 const handlers={},navigations=[],opens=[];
 const self={location:{origin:'https://app.fixture'},navigator:{},addEventListener:(k,f)=>handlers[k]=f,clients:{matchAll:async()=>[],openWindow:async url=>opens.push(url)},registration:{showNotification:async()=>{}}};
 vm.runInNewContext(fs.readFileSync(process.env.SW_SOURCE||'sw.js','utf8'),{self,URL,Response,Headers,console});
 async function click(url){let pending;handlers.notificationclick({notification:{data:{url},close(){}},waitUntil:p=>pending=p});await pending;}
 await click('/?open=messages&conversation=7');assert.equal(opens.at(-1),'https://app.fixture/?open=messages&conversation=7');
 self.clients.matchAll=async()=>[{url:'https://app.fixture/',focus:async()=>{},navigate:async url=>navigations.push(url)}];
 await click('/?open=announcement&announcement=9');assert.equal(navigations.at(-1),'https://app.fixture/?open=announcement&announcement=9');assert.equal(opens.length,1);
 await click('https://untrusted.invalid/');assert.equal(navigations.at(-1),'https://app.fixture/');
 console.log('PASS assembled webhook dispatch: one push, correct customer/account target, preserved admin routing; SW cold/warm and same-origin guard');
})().catch(e=>{console.error(e);process.exitCode=1});
