import {PGlite} from './shared-v244/node_modules/@electric-sql/pglite/dist/index.js';import {JSDOM} from './shared-v244/node_modules/jsdom/lib/api.js';import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import {stripTypeScriptTypes} from 'node:module';
const db=new PGlite(),fixtureStaff='10000000-0000-4000-8000-000000000001',user='20000000-0000-4000-8000-000000000001',other='30000000-0000-4000-8000-000000000001';
await db.exec(`create schema auth;create schema private;create schema extensions;create role anon;create role authenticated;create role service_role;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function extensions.uuid_generate_v4() returns uuid language sql as $$select gen_random_uuid()$$;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');`);
for(const t of JSON.parse(fs.readFileSync('tests/shared-v244/all-schema.json')).tables){const cols=t.columns.map(c=>`${c.name} ${c.type}${c.identity?' generated always as identity':c.default&&!c.default.includes('nextval(')?' default '+c.default:''}${c.notnull?' not null':''}`);cols.push(...(t.constraints||[]).filter(c=>!c.startsWith('FOREIGN KEY')));await db.exec(`create table ${t.schema}.${t.name}(${cols.join(',')})`)}
for(const f of JSON.parse(fs.readFileSync('tests/shared-v244/baseline-name-helper.json')))await db.exec(f.definition);
let pendingDefs=JSON.parse(fs.readFileSync('supabase/backups/shared-v243-functions.json'));for(let i=0;i<2;i++){let failed=[];for(const f of pendingDefs)try{await db.exec(f.definition)}catch(e){failed.push(f)}pendingDefs=failed}assert.equal(pendingDefs.length,0);
await db.exec('create policy portal_terms_acceptances_customer_insert on portal_terms_acceptances for insert to authenticated with check(true)');
await db.exec(fs.readFileSync('supabase/migrations/20261015190455_verified_dog_links_v251.sql','utf8'));await db.exec(fs.readFileSync('supabase/migrations/20261015200808_owner_terms_pair_booking_v254.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/20261016060000_shared_passes_v257.sql','utf8'));
await db.exec('update private.shared_release_v244 set enabled=true');
await db.exec(`create trigger refresh_finance after insert or update or delete on public.visits for each row execute function private.refresh_daily_financial_from_visit(); create trigger replan_res after insert or update of status,entry_type,pass_id,billing_choice on public.reservations for each row execute function private.replan_after_reservation_change(); create trigger replan_pass after insert or update of status,used_entries on public.passes for each row execute function private.replan_after_pass_change();`);
const customer='10000000-0000-0000-0000-000000000001',staff='20000000-0000-0000-0000-000000000001';
const auth=async id=>db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[id]);
await db.exec(`insert into auth.users(id) values('${customer}'),('${staff}'); insert into public.staff(user_id,active) values('${staff}',true);
insert into public.customer_profiles(user_id,status,full_name) values('${customer}','active','Test Owner');
insert into public.owners(id,name) overriding system value values(9001,'Test Owner'),(9002,'Other Owner');
insert into public.dogs(id,owner_id,name,active,default_entry_type) overriding system value values(9001,9001,'Bella',true,'pass'),(9002,9001,'Aria',true,'pass'),(9003,9002,'Other',true,'pass');
insert into public.customer_owner_links(user_id,owner_id,approved_by,allowed_dog_ids) values('${customer}',9001,'${staff}',ARRAY[9001,9002]::bigint[]);
insert into public.vaccinations(dog_id,vaccination_type,valid_until) select d,t,'2030-01-01' from unnest(ARRAY[9001,9002]::bigint[])d cross join unnest(ARRAY['rabies','infectious','kennel_cough'])t;
insert into public.vaccination_proofs(dog_id,is_current,storage_path,uploaded_by,batch_id) values(9001,true,'fixture1','${customer}','30000000-0000-0000-0000-000000000001'),(9002,true,'fixture2','${customer}','30000000-0000-0000-0000-000000000002');`);
const uid=()=>crypto.randomUUID();
const date=(await db.query(`select to_char((date_trunc('week',now() at time zone 'Europe/Bratislava')+interval '1 week')::date,'YYYY-MM-DD') d`)).rows[0].d;
const items=[{dog_id:9001,date,taxi_mode:'none'},{dog_id:9002,date,taxi_mode:'pickup'}];
const rpc=async (sql,args=[]) => (await db.query(sql,args)).rows[0];
const quote=async (it=items)=> (await rpc('select public.portal_shared_booking_v244($1::jsonb,null) r',[JSON.stringify(it)])).r.quote;
const clean=async()=>db.exec('delete from public.visits; delete from public.customer_booking_requests; delete from public.reservations; delete from public.pass_dogs; delete from public.customer_pass_requests; delete from public.passes; delete from private.shared_operations_v244;');
const pass=async(total,used)=>{
 await auth(staff);const {id}=await rpc(`insert into public.passes(dog_id,total_entries,used_entries,purchased_on,purchase_price) values(9001,$1,$2,current_date,200) returning id`,[total,used]);
 await db.query(`insert into public.pass_dogs(pass_id,dog_id,approved_by) values($1,9001,$2),($1,9002,$2)`,[id,staff]);await auth(customer);return id;
};
for(const [total,used,expected] of [[10,4,['pass','pass']],[10,8,['pass','pass']],[10,9,['pass','single']],[10,10,['single','single']],[20,18,['pass','pass']],[20,19,['pass','single']],[20,20,['single','single']]]){
 await clean();await pass(total,used);const q=await quote();assert.deepEqual(q.map(r=>r.mode),expected);assert(q.every(r=>!r.entry_number||r.entry_number<=total));
 if(used<total)assert.equal(q[0].entry_number,used+1);
 console.log(`PASS ledger ${used}/${total}: ${q.map(r=>r.mode+' '+r.entry_number).join(', ')}`);
}
await clean();const pid=await pass(10,9);const q=await quote();const op=uid();
const commit=async(it,q,op)=> (await rpc('select public.portal_shared_booking_v244($1::jsonb,$2,$3::jsonb) r',[JSON.stringify(it),op,JSON.stringify(q)])).r;
let committed=await commit(items,q,op);assert.equal(committed.bookings.length,2);
assert.deepEqual((await commit(items,q,op)).bookings,committed.bookings);assert.equal((await db.query('select count(*)::int n from public.customer_booking_requests')).rows[0].n,2);
assert.deepEqual((await quote([{dog_id:9001,date:date.slice(0,8)+String(Number(date.slice(8))+1).padStart(2,'0')}])).map(x=>x.mode),['single']);
console.log('PASS atomic pair, idempotent replay and future capacity allocation');
await assert.rejects(commit(items,q,uid()),/zmenili|rezerváciu/);
await auth(staff);for(const b of committed.bookings)await rpc('select public.portal_approve_booking($1,null)',[b.id]);
assert.equal((await db.query('select count(*)::int n from public.reservations')).rows[0].n,2);
let rs=(await db.query('select dog_id,entry_type,planned_entry_number,pass_id from public.reservations order by dog_id')).rows;assert.equal(rs[0].planned_entry_number,10);assert.equal(rs[1].entry_type,'single');
console.log('PASS staff approvals preserve 10/10 + explicit single');
await auth(customer);await assert.rejects(quote([{dog_id:9003,date}]),/priradený/);
console.log('PASS foreign dog denied');
await clean();await pass(10,8);await db.exec(`delete from public.vaccinations where dog_id=9002 and vaccination_type='rabies'`);
const badQ=await quote();await assert.rejects(commit(items,badQ,uid()),/očkovan/);assert.equal((await db.query('select count(*)::int n from public.customer_booking_requests')).rows[0].n,0);
console.log('PASS one expired vaccine rolls back both dogs');
await clean();await pass(10,8);await db.exec(`insert into public.vaccinations(dog_id,vaccination_type,valid_until) values(9002,'rabies','2030-01-01')`);
let newQ=await quote();let bookings=await commit(items,newQ,uid());
await auth(staff);for(const b of bookings.bookings)await rpc('select public.portal_approve_booking($1,null)',[b.id]);
const today=(await db.query(`select to_char((clock_timestamp() at time zone 'Europe/Bratislava')::date-1,'YYYY-MM-DD') d`)).rows[0].d;
await db.query('update public.reservations set reservation_date=$1',[today]);
await rpc('select private.finalize_day($1)',[today]);
assert.equal((await db.query('select used_entries from public.passes')).rows[0].used_entries,10);
let actual=(await db.query('select dog_id,pass_entry_number from public.visits order by dog_id')).rows;assert.deepEqual(actual.map(r=>r.pass_entry_number),[9,10]);
assert.equal((await db.query('select count(*)::int n from public.passes')).rows[0].n,1);
assert.equal((await db.query('select pass10_count from public.daily_financials where day=$1',[today])).rows[0].pass10_count,2);
console.log('PASS attendance: two visits, two redemptions, one pass, per-dog taxi');
await rpc('select private.finalize_day($1)',[today]);assert.equal((await db.query('select count(*)::int n from public.visits')).rows[0].n,2);
let res=(await db.query('select id from public.reservations order by dog_id')).rows;
await rpc('select public.mark_no_show($1)',[res[0].id]);await rpc('select public.mark_no_show($1)',[res[0].id]);
assert.equal((await db.query('select used_entries from public.passes')).rows[0].used_entries,9);
assert.equal((await db.query('select pass_entry_number from public.visits')).rows[0].pass_entry_number,9);
console.log('PASS no-show returns one entry once and audits corrected numbering');
await clean();await pass(10,9);await auth(customer);
const interestOp=uid();let request=(await rpc('select to_jsonb(public.portal_request_pass_v244($1,20,$2)) r',[[9001,9002],interestOp])).r;
assert.equal(request.total_entries,20);assert.deepEqual(request.dog_ids,[9001,9002]);
assert.equal((await rpc('select to_jsonb(public.portal_request_pass_v244($1,20,$2)) r',[[9001,9002],interestOp])).r.id,request.id);
let withNew=await quote();assert.deepEqual(withNew.map(x=>x.mode),['pass','planned']);assert.equal(withNew[1].entry_number,1);
let pending=await commit(items,withNew,uid());
await auth(staff);let purchased=(await rpc('select to_jsonb(public.portal_approve_pass_request($1,null)) r',[request.id])).r;
let repeated=(await rpc('select to_jsonb(public.portal_approve_pass_request($1,null)) r',[request.id])).r;assert.equal(purchased.pass_id,repeated.pass_id);
assert.equal((await db.query('select count(*)::int n from public.passes')).rows[0].n,2);
assert.equal((await db.query('select count(*)::int n from public.pass_dogs where pass_id=$1',[purchased.pass_id])).rows[0].n,2);
let nextPass=(await db.query('select * from public.passes where id=$1',[purchased.pass_id])).rows[0];assert.equal(nextPass.purchase_price,'320.00');assert.equal(nextPass.valid_from,null);assert.equal(nextPass.status,'queued');
let projected=(await db.query('select projected_pass_id,projected_entry_number from public.customer_booking_requests order by dog_id')).rows;assert.equal(projected[0].projected_entry_number,10);assert.equal(projected[1].projected_pass_id,purchased.pass_id);assert.equal(projected[1].projected_entry_number,1);
console.log('PASS one 20-entry shared renewal request, one purchase, queued validity untouched');
await auth(customer);await rpc('select public.portal_cancel_booking($1,null)',[pending.bookings[0].id]);
let remaining=(await db.query("select projected_entry_number,projected_pass_id from public.customer_booking_requests where status='pending'")).rows[0];assert.equal(remaining.projected_entry_number,10);assert.notEqual(remaining.projected_pass_id,purchased.pass_id);
console.log('PASS cancelling Bella preserves Aria and releases the old final entry');
await auth(staff);await rpc('select public.portal_approve_booking($1,null)',[pending.bookings[1].id]);assert.equal((await db.query("select count(*)::int n from public.reservations where status='booked'")).rows[0].n,1);console.log('PASS remaining Aria can be approved after Bella cancellation');

// Legacy individual reservation is unchanged when no explicit shared membership exists.
{
await clean();await auth(staff);await db.exec("insert into passes(dog_id,total_entries,used_entries,purchased_on,purchase_price,status) values(9001,10,4,current_date,200,'active')");await auth(customer);
assert.equal((await rpc('select to_jsonb(portal_request_booking(9001,$1)) r',[date])).r.projected_entry_number,5);
// An unused shared pass cannot silently offer visits beyond two months from first planned use.
await clean();await pass(10,0);const expiry=(await db.query("select private.shared_plan_v244(9001,jsonb_build_array(jsonb_build_object('dog_id',9001,'date',$1::text),jsonb_build_object('dog_id',9002,'date',($1::date+interval '3 months')::date))) q",[date])).rows[0].q;assert.deepEqual(expiry.map(x=>x.mode),['pass','single']);
// Explicit membership is necessary even for staff writes. No foreign dog can redeem.
await auth(staff);const pid=(await rpc('select id from passes')).id;
await assert.rejects(db.query("insert into reservations(dog_id,reservation_date,entry_type,status,pass_id) values(9003,$1,'pass','booked',$2)",[date,pid]));
// Test entitlement has no purchase date or price and cannot create financial income.
await db.query("update passes set source='test_shared_v257',purchased_on=null,purchase_price=null where id=$1",[pid]);
await db.query("insert into visits(dog_id,visit_date,entry_type,pass_id,pass_entry_number,value_amount,taxi_amount) values(9001,$1,'pass',$2,1,20,5)",[today,pid]);
await rpc('select private.refresh_daily_financial($1)',[today]);assert.equal((await rpc('select pass10_count,taxi_amount from daily_financials where day=$1',[today])).pass10_count,0);
await assert.rejects(db.query("insert into visits(dog_id,visit_date,entry_type,pass_id,pass_entry_number,value_amount) values(9002,$1,'pass',$2,1,20)",[today,pid]));
await db.exec('grant usage on schema auth to authenticated;grant select on staff to authenticated;set role authenticated');assert.equal((await rpc('select count(*)::int n from pass_dogs')).n,2);await assert.rejects(db.query('insert into pass_dogs(pass_id,dog_id) values($1,9003)',[pid]));await db.exec('reset role');
await auth(customer);await db.exec('set role authenticated');assert.equal((await rpc('select count(*)::int n from pass_dogs')).n,0);await db.exec('reset role');
console.log('PASS v257 extras: legacy individual, projected expiry, foreign entitlement denied, test sale excluded, duplicate redemption denied, staff-only RLS');
}
console.log('V257 SHARED CURRENT BASELINE PASS');await db.close();
