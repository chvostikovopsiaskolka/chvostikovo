const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');
let source=fs.readFileSync('supabase/functions/admin-push/index.ts','utf8').replace(/^import[^\n]+\n/gm,'');
source=ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS});
const c=vm.createContext({Deno:{env:{get:()=>''},serve(){}},console,webpush:{}});vm.runInContext(source,c);
(async()=>{const record={id:1,recipient_user_id:'synthetic-staff',notification_type:'taxi_cancelled_admin',title:'Taxík bol zrušený',body:'Synthetic Bella · 02.01.2030. Rezervácia škôlky zostáva platná.'};
 c.fixture={table:'portal_notifications',record};const result=await vm.runInContext('messageForWebhook(fixture)',c);assert.equal(result.audience,'admin');assert.equal(result.recipientUserId,'synthetic-staff');assert.equal(result.body,record.body);
 c.fixture.record.notification_type='app_diagnostics_admin';assert.equal((await vm.runInContext('messageForWebhook(fixture)',c)).audience,'admin');
 c.fixture.record.notification_type='booking_rejected';assert.equal((await vm.runInContext('messageForWebhook(fixture)',c)).audience,'customer');
 c.fixture.record.notification_type='customer_message_admin';assert.equal((await vm.runInContext('messageForWebhook(fixture)',c)).audience,'admin');c.rest=async(path)=>path.startsWith('dogs')?[{id:1,name:'Synthetic Bella'}]:[{dog_id:1,reservation_date:'2030-10-25',taxi_mode:'dropoff'}];
 for(const mode of ['pickup','dropoff','pickup_dropoff']){
 c.fixture={table:'customer_booking_requests',record:{id:70,user_id:'synthetic-customer',dog_id:1,reservation_date:'2030-10-25',status:'approved',taxi_mode:'pickup',taxi_change_status:'pending',requested_taxi_mode:mode}};
 const change=await vm.runInContext('messageForWebhook(fixture)',c);assert.equal(change.audience,'admin');assert.match(change.title,/Zmena taxi/);assert.match(change.body,/→/);assert(change.body.includes(mode==='dropoff'?'Dovoz domov (5':mode==='pickup'?'Vyzdvihnutie (5':'(10 €)'));
 c.fixture.record.status='pending';delete c.fixture.record.taxi_change_status;const booking=await vm.runInContext('messageForWebhook(fixture)',c);assert.notEqual(booking.audience,'customer');assert.match(booking.body,/Vyzdvihnutie/);
 }
 c.fixture={table:'booking_batch_push_events',record:{id:1,dog_id:1,day_count:1,dates:['2030-10-25']}};assert.match((await vm.runInContext('messageForWebhook(fixture)',c)).body,/Dovoz domov/);
 assert.equal(vm.runInContext("adminTaxiLabel('dropoff')",c),'dovoz domov');
 console.log('PASS real admin-push formatter: taxi cancellation routes to staff, existing message/customer routes preserved; no sends');})().catch(e=>{console.error(e);process.exitCode=1});
