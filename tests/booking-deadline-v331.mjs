process.on('uncaughtException',e=>{console.error(e.message,e.detail||'',e.where||'');process.exit(1)});
import {PGlite} from './shared-v244/node_modules/@electric-sql/pglite/dist/index.js';import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create schema auth;create schema private;create role anon;create role authenticated;create role service_role;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function private.lock_pool_v244(bigint) returns void language sql as $$select$$;
create function private.daycare_default_capacity_v322() returns integer language sql as $$select 10$$;
create function private.shared_dog_v244(bigint) returns boolean language sql as $$select false$$;
create function private.replan_dog_reservations(bigint,date default current_date) returns void language sql as $$select$$;
create function private.dog_name_accusative(text,text) returns text language sql as $$select $1$$;`);
for(const t of JSON.parse(fs.readFileSync('tests/taxi-schema-v329.json'))){const cols=t.columns.map(c=>`${c.name} ${c.type}${c.identity?' generated always as identity':c.default&&!c.default.includes('nextval(')?' default '+c.default:''}${c.notnull?' not null':''}`);cols.push(...(t.constraints||[]).map(c=>`constraint ${c.name} ${c.def}`));await db.exec(`create table ${t.schema}.${t.name}(${cols.join(',')})`);}
await db.exec(`create table private.customer_reservation_rollback_v327(key text primary key,payload jsonb);create table private.shared_operations_v244(user_id uuid,operation_id uuid,kind text,payload jsonb,result jsonb);`);
const baseline=fs.readFileSync('supabase/backups/taxi-functions-before-v329.sql','utf8');await db.exec(baseline);
// Exact guarded migration on original schema and full original function bodies.
await db.exec(fs.readFileSync('supabase/changes/taxi-directions-v329.sql','utf8'));
await assert.rejects(db.exec(fs.readFileSync('supabase/changes/taxi-directions-v329.sql','utf8')),/Changed function/,'migration guards newer sources');
// Only inject the isolated clock. Every changed function body stays complete.
await db.exec(fs.readFileSync('supabase/changes/taxi-directions-functions-v329.sql','utf8').replaceAll("now() at time zone 'Europe/Bratislava'","current_setting('fixture.clock')::timestamp").replaceAll("now() AT TIME ZONE 'Europe/Bratislava'","current_setting('fixture.clock')::timestamp"));
await db.exec(`create trigger reservations_sync_taxi before insert or update on reservations for each row execute function sync_reservation_taxi();create trigger visits_apply_taxi_amount before insert or update of taxi_service on visits for each row execute function private.apply_taxi_amount();
create table fixture_events(kind text);create function private.fixture_event() returns trigger language plpgsql as $$begin insert into public.fixture_events values('taxi-pending');return new;end$$;create trigger customer_booking_taxi_change_admin_push after update of taxi_change_status on customer_booking_requests for each row when(old.taxi_change_status is distinct from new.taxi_change_status and new.taxi_change_status='pending') execute function private.fixture_event();`);
const owner='10000000-0000-0000-0000-000000000001',second='20000000-0000-0000-0000-000000000001',other='30000000-0000-0000-0000-000000000001',staff='40000000-0000-0000-0000-000000000001';
await db.exec(`insert into owners(id,name) overriding system value values(9001,'Synthetic Owner');insert into dogs(id,owner_id,name,active,default_entry_type) overriding system value values(9001,9001,'Synthetic Bella',true,'single');insert into customer_profiles(user_id,status,full_name) values('${owner}','active','Synthetic Owner'),('${second}','active','Synthetic Second'),('${other}','active','Synthetic Other');insert into customer_owner_links(user_id,owner_id,allowed_dog_ids) values('${owner}',9001,array[9001]::bigint[]),('${second}',9001,array[9001]::bigint[]),('${other}',9001,array[9999]::bigint[]);insert into staff(user_id,active) values('${staff}',true);insert into vaccinations(dog_id,vaccination_type,valid_until) values(9001,'rabies','2031-01-01'),(9001,'infectious','2031-01-01'),(9001,'kennel_cough','2031-01-01');insert into vaccination_proofs(dog_id,batch_id,storage_path,is_current) values(9001,gen_random_uuid(),'synthetic-proof',true);`);
const login=async(user=owner,clock='2030-10-20 18:00:00')=>db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('fixture.clock',$2,false)",[user,clock]);await login();

await db.exec(`create table private.booking_batches_v254(user_id uuid,request_key uuid,payload jsonb,result jsonb);create table private.booking_batch_push_events(dog_id bigint,day_count smallint,dates text[],dog_ids bigint[]);create table portal_messages(id bigint,conversation_id bigint,sender_user_id uuid,sender_role text,body text,booking_request_id bigint);`);
await db.exec(fs.readFileSync('supabase/backups/pair-booking-before-v331.sql','utf8'));
await login(owner,'2030-10-23 12:00:00');
await assert.rejects(db.query("select * from portal_request_booking(9001,'2030-10-25','none')"),/nedeľu/,'old Sunday closure reproduces the unwanted chat path');
await db.exec(fs.readFileSync('supabase/changes/deploy-booking-deadline-v331.sql','utf8').replaceAll("now() at time zone 'Europe/Bratislava'","current_setting('fixture.clock')::timestamp"));
assert.equal((await db.query("select count(*) n from private.customer_reservation_rollback_v327 where key='booking_deadline_before_v331'")).rows[0].n,1);
await db.exec(`insert into dogs(id,owner_id,name,active,default_entry_type) overriding system value values(9002,9001,'Synthetic Mia',true,'single');update customer_owner_links set allowed_dog_ids=array[9001,9002]::bigint[] where user_id='${owner}';insert into vaccinations(dog_id,vaccination_type,valid_until) values(9002,'rabies','2031-01-01'),(9002,'infectious','2031-01-01'),(9002,'kennel_cough','2031-01-01');insert into vaccination_proofs(dog_id,batch_id,storage_path,is_current) values(9002,gen_random_uuid(),'synthetic-proof-2',true);`);
const pair="select portal_request_dogs_batch_v254(array[9001,9002]::bigint[],'[{\"date\":\"2030-10-25\",\"taxi_by_dog\":{\"9001\":\"pickup\",\"9002\":\"dropoff\"}}]'::jsonb,'50000000-0000-0000-0000-000000000001'::uuid) result";
for(const clock of ['2030-10-23 12:00:00','2030-10-24 18:59:59']){
 await db.exec('begin');await login(owner,clock);
 const q=(await db.query("select * from portal_request_booking(9001,'2030-10-25','dropoff')")).rows[0];assert.equal(q.status,'pending');assert.equal(q.taxi_mode,'dropoff');assert.equal(Number(q.taxi_amount),5);await db.exec('rollback');
 await db.exec('begin');await login(owner,clock);const rows=(await db.query(pair)).rows[0].result.bookings;assert.equal(rows.length,2);assert(rows.every(q=>q.status==='pending'));assert.deepEqual(rows.map(q=>Number(q.dog_id)),[9001,9002]);assert.equal((await db.query(pair)).rows[0].result.bookings.length,2,'pair retry stays idempotent');assert.equal((await db.query('select count(*) n from customer_booking_requests')).rows[0].n,2);assert.equal((await db.query('select count(*) n from portal_messages')).rows[0].n,0);await db.exec('rollback');
}
for(const clock of ['2030-10-24 19:00:00','2030-10-24 19:01:00']){
 await login(owner,clock);await assert.rejects(db.query("select * from portal_request_booking(9001,'2030-10-25','none')"),/19:00/);await assert.rejects(db.query(pair),/19:00/);
}
await db.exec("update dogs set booking_late_exception=true;select set_config('chvostikovo.late_request','1',false)");
await login(owner,'2030-10-24 19:00:00');await assert.rejects(db.query("select * from portal_request_booking(9001,'2030-10-25','none')"),/19:00/,'legacy late flag and exception cannot bypass final cutoff');
await db.exec("update dogs set booking_late_exception=false;select set_config('chvostikovo.late_request','',false);insert into portal_day_settings(day,capacity,bookings_open) values('2030-10-25',1,true)");
await login(owner,'2030-10-23 12:00:00');await assert.rejects(db.query(pair),/voľné miesto/);assert.equal((await db.query('select count(*) n from customer_booking_requests')).rows[0].n,0,'insufficient pair capacity rolls back both dogs');
await db.exec("update portal_day_settings set capacity=10;delete from vaccinations where dog_id=9002 and vaccination_type='rabies'");await assert.rejects(db.query(pair),/očkovan/);assert.equal((await db.query('select count(*) n from customer_booking_requests')).rows[0].n,0,'second dog vaccine failure rolls back first dog too');
await login(other,'2030-10-23 12:00:00');await assert.rejects(db.query("select * from portal_request_booking(9001,'2030-10-25','none')"),/priradený/);assert.equal((await db.query('select count(*) n from portal_messages')).rows[0].n,0);
await db.close();console.log('PASS reproduced old Sunday restriction; complete server booking/pair bodies accept Wednesday and Thursday18:59 without messages, reject19:00+, resist legacy bypass flags, retain idempotency, scope, vaccine and capacity atomicity; isolated PostgreSQL, no production sends');

