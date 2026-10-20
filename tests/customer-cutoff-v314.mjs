import {PGlite} from './shared-v244/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create schema auth;create schema private;create schema extensions;create role anon;create role authenticated;create role service_role;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function extensions.uuid_generate_v4() returns uuid language sql as $$select gen_random_uuid()$$;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');`);
for(const t of JSON.parse(fs.readFileSync('tests/shared-v244/all-schema.json')).tables){const cols=t.columns.map(c=>`${c.name} ${c.type}${c.identity?' generated always as identity':c.default&&!c.default.includes('nextval(')?' default '+c.default:''}${c.notnull?' not null':''}`);cols.push(...(t.constraints||[]).filter(c=>!c.startsWith('FOREIGN KEY')));await db.exec(`create table ${t.schema}.${t.name}(${cols.join(',')})`)}
for(const f of JSON.parse(fs.readFileSync('tests/shared-v244/baseline-name-helper.json')))await db.exec(f.definition);
let pending=JSON.parse(fs.readFileSync('supabase/backups/shared-v243-functions.json'));for(let i=0;i<2;i++){const failed=[];for(const f of pending)try{await db.exec(f.definition)}catch(_){failed.push(f)}pending=failed}assert.equal(pending.length,0);
await db.exec('create policy portal_terms_acceptances_customer_insert on portal_terms_acceptances for insert to authenticated with check(true)');
for(const file of ['20261015190455_verified_dog_links_v251.sql','20261015200808_owner_terms_pair_booking_v254.sql','20261016060000_shared_passes_v257.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
// Only replace the clock source in this isolated database, keeping complete live function bodies.
const sql=fs.readFileSync('supabase/changes/customer-cutoff-v314.sql','utf8');
assert(!sql.includes('21:00'));assert.equal((sql.match(/if v_now_local >= v_deadline then/g)||[]).length,3);
await db.exec(sql.replaceAll("now() at time zone 'Europe/Bratislava'","current_setting('fixture.clock')::timestamp"));
const user='10000000-0000-0000-0000-000000000001',other='20000000-0000-0000-0000-000000000001';
await db.exec(`insert into auth.users(id) values('${user}'),('${other}');insert into customer_profiles(user_id,status,full_name) values('${user}','active','Synthetic Owner');insert into owners(id,name) overriding system value values(9001,'Synthetic Owner');insert into dogs(id,owner_id,name,active,default_entry_type) overriding system value values(9001,9001,'Synthetic Dog',true,'single');insert into customer_owner_links(user_id,owner_id,approved_by,allowed_dog_ids) values('${user}',9001,'${other}',ARRAY[9001]::bigint[]);insert into reservations(id,dog_id,reservation_date,status,entry_type) overriding system value values(9001,9001,'2030-01-02','booked','single');insert into customer_booking_requests(id,user_id,dog_id,reservation_date,status,reservation_id,taxi_mode) overriding system value values(9001,'${user}',9001,'2030-01-02','approved',9001,'none');`);
const calls=["select portal_cancel_booking(9001,null)","select portal_cancel_reservation(9001,null)","select portal_request_taxi_change(9001,'pickup')"];
await db.exec('set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
for(const clock of ['2030-01-01 18:59:59','2030-01-01 19:00:00','2030-01-01 19:01:00']){
 await db.query("select set_config('fixture.clock',$1,false)",[clock]);
 for(const call of calls){await db.exec('begin');try{if(clock.includes('18:59'))await db.query(call);else await assert.rejects(db.query(call),/19:00/);}finally{await db.exec('rollback')}}
}
await db.query("select set_config('fixture.clock','2030-01-01 18:59:59',false)");await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
for(const call of calls){await db.exec('begin');try{await assert.rejects(db.query(call),/nenašla/)}finally{await db.exec('rollback')}}
await db.exec('reset role');
assert.equal((await db.query('select status from customer_booking_requests where id=9001')).rows[0].status,'approved');
assert.equal((await db.query('select status from reservations where id=9001')).rows[0].status,'booked');
await db.close();console.log('PASS full PostgreSQL function bodies: cancellation request/reservation + taxi at 18:59:59 allowed, 19:00/19:01 denied, foreign owner denied, rollback preserved reservations; isolated database, no sends');
