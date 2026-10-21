const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
let source=fs.readFileSync('supabase/functions/admin-push/index.ts','utf8').replace(/^import[^\n]+\n/gm,'');
source=ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS});
const c=vm.createContext({Deno:{env:{get:()=>''},serve(){}},console,webpush:{}});vm.runInContext(source,c);
(async()=>{const record={id:1,recipient_user_id:'synthetic-staff',notification_type:'taxi_cancelled_admin',title:'Taxík bol zrušený',body:'Synthetic Bella · 02.01.2030. Rezervácia škôlky zostáva platná.'};
 c.fixture={table:'portal_notifications',record};const result=await vm.runInContext('messageForWebhook(fixture)',c);assert.equal(result.audience,'admin');assert.equal(result.recipientUserId,'synthetic-staff');assert.equal(result.body,record.body);
 c.fixture.record.notification_type='booking_rejected';assert.equal((await vm.runInContext('messageForWebhook(fixture)',c)).audience,'customer');
 c.fixture.record.notification_type='customer_message_admin';assert.equal((await vm.runInContext('messageForWebhook(fixture)',c)).audience,'admin');console.log('PASS real admin-push formatter: taxi cancellation routes to staff, existing message/customer routes preserved; no sends');})().catch(e=>{console.error(e);process.exitCode=1});
