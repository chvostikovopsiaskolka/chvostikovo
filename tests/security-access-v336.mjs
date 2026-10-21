process.on('uncaughtException',e=>{console.error(e.message,e.where||'',e.query?.slice(0,250)||'');process.exit(1)});
import {PGlite} from './shared-v244/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/security-v336.json'));const db=new PGlite();
await db.exec(`create schema auth;create schema private;create schema storage;create schema extensions;create type storage.buckettype as enum ('STANDARD','ANALYTICS','VECTOR');create role anon;create role authenticated;create role service_role bypassrls;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key,email text,banned_until timestamptz,raw_user_meta_data jsonb);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade);
create table auth.refresh_tokens(id bigint,user_id varchar,session_id uuid);
grant usage on schema public,auth to authenticated,service_role;grant execute on function auth.uid() to authenticated,service_role;`);
const tables=fixture.tables;
for(const t of tables){
 const cols=t.columns.map(c=>'"'+c.name+'" '+c.type+(c.identity?' generated always as identity':c.default&&!c.default.includes('nextval(')&&!c.default.includes('extensions.')&&/^(?:'|now\(|gen_random_uuid\(|true$|false$|-?\d)/.test(c.default)?' default '+c.default:'')+(c.notnull?' not null':''));
 await db.exec(`create table ${t.schema}."${t.name}"(${cols.join(',')});`);
}
for(const t of ['customer_profiles','staff'])await db.exec(`alter table public.${t} add primary key(user_id)`);
await db.exec('alter table public.frontend_snapshots add primary key(key);alter table public.portal_dog_onboarding add primary key(user_id,dog_id);');
const fns=fixture.functions;
const patched=fixture.patched;
for(const p of patched)await db.exec(fns.find(f=>f.signature===p.signature).definition);
await db.exec(fns.find(f=>f.proname==='owns_dog_v244').definition);
await db.exec("insert into public.frontend_snapshots(key,html) values('stable-v10-clean','fixture-admin')");
const schema={tables:fixture.rls_tables,policies:fixture.policies,grants:fixture.grants};
for(const t of schema.tables)if(t.rls)await db.exec(`alter table ${t.schema}."${t.name}" enable row level security`);
for(const p of schema.policies){await db.exec(`create policy "${p.policyname}" on ${p.schemaname}."${p.tablename}" for ${p.cmd} to ${p.roles.join(',')}${p.qual?' using ('+p.qual+')':''}${p.with_check?' with check ('+p.with_check+')':''}`)}
for(const g of schema.grants)if(g.grantee==='authenticated'&&['SELECT','INSERT','UPDATE','DELETE'].includes(g.privilege_type))await db.exec(`grant ${g.privilege_type} on ${g.table_schema}."${g.table_name}" to authenticated`);
await db.exec(fs.readFileSync('supabase/changes/security-access-v336.sql','utf8'));
const staff='10000000-0000-0000-0000-000000000001',a='20000000-0000-0000-0000-000000000001',b='20000000-0000-0000-0000-000000000002',partner='20000000-0000-0000-0000-000000000003';
await db.exec(`insert into auth.users(id) values('${staff}'),('${a}'),('${b}'),('${partner}');insert into public.staff(user_id,display_name,role,active) values('${staff}','Synthetic Staff','owner',true);insert into public.customer_profiles(user_id,full_name,status) values('${a}','Synthetic A','active'),('${b}','Synthetic B','active'),('${partner}','Synthetic Partner','active');insert into public.customer_owner_links(user_id,owner_id,allowed_dog_ids) values('${a}',901,array[901,902]),('${b}',903,array[903]),('${partner}',901,array[901]);insert into public.dogs(id,owner_id,name,active) overriding system value values(901,901,'Synthetic One',true),(902,901,'Synthetic Two',true),(903,903,'Synthetic Other',true);insert into auth.sessions values('90000000-0000-0000-0000-000000000001','${a}'),('90000000-0000-0000-0000-000000000002','${b}');insert into auth.refresh_tokens values(1,'${a}','90000000-0000-0000-0000-000000000001'),(2,'${b}','90000000-0000-0000-0000-000000000002');insert into public.portal_push_subscriptions(user_id,endpoint,p256dh,auth,active) values('${a}','https://fixture.invalid/a','fake','fake',true),('${b}','https://fixture.invalid/b','fake','fake',true);`);
async function login(uid,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role '+role)}
await login(a);assert.equal((await db.query('select portal_customer_access_allowed_v336() ok')).rows[0].ok,true);
await assert.rejects(db.query('select portal_set_customer_blocked_v336($1,true)',[b]),/oprávnenie/);
await assert.rejects(db.query("select consume_request_limit_v336('form_ip',repeat('a',64))"),/permission denied/);
await assert.rejects(db.query("select portal_set_optional_l4(903,'2031-01-01')"),/authorized/);
await db.query("select portal_set_optional_l4(901,'2031-01-01')");
await login(staff);await assert.rejects(db.query('select portal_set_customer_blocked_v336($1,true)',[staff]),/Administrátorský/);
await db.query('select portal_set_customer_blocked_v336($1,true)',[a]);
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from auth.sessions where user_id=$1',[a])).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from auth.refresh_tokens where user_id=$1',[a])).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from auth.sessions where user_id=$1',[b])).rows[0].n,1);
assert.equal((await db.query('select active from portal_push_subscriptions where user_id=$1',[a])).rows[0].active,false);
await login(a);assert.equal((await db.query('select portal_customer_access_allowed_v336() ok')).rows[0].ok,false);assert.equal((await db.query('select * from customer_profiles')).rows.length,0);await assert.rejects(db.query("select portal_set_optional_l4(901,'2031-02-01')"),/zablokovaný/);
for(const p of patched){const proc=(await db.query('select pg_get_functiondef($1::regprocedure) d',[p.signature])).rows[0].d;assert(proc.includes('PERFORM private.guard_customer_rpc_v336();'),p.signature)}
await login(partner);assert.equal((await db.query('select portal_customer_access_allowed_v336() ok')).rows[0].ok,true);await db.query("select portal_set_optional_l4(901,'2031-02-01')");await assert.rejects(db.query("select portal_set_optional_l4(902,'2031-02-01')"),/authorized/);
await login(staff);await db.query('select portal_set_customer_blocked_v336($1,false)',[a]);
await login(a);assert.equal((await db.query('select portal_customer_access_allowed_v336() ok')).rows[0].ok,true);await db.exec('reset role');assert.equal((await db.query('select banned_until from auth.users where id=$1',[a])).rows[0].banned_until,null);assert.equal((await db.query('select count(*)::int n from dogs')).rows[0].n,3);assert.equal((await db.query('select count(*)::int n from customer_owner_links')).rows[0].n,3);
await login('', 'service_role');const results=await Promise.all(Array.from({length:21},()=>db.query("select consume_request_limit_v336('form_ip',repeat('a',64)) ok")));assert.equal(results.filter(x=>x.rows[0].ok).length,20);assert.equal((await db.query("select consume_request_limit_v336('form_ip',repeat('b',64)) ok")).rows[0].ok,true);
await db.exec('reset role');await db.exec(fs.readFileSync('supabase/changes/security-access-rollback-v336.sql','utf8'));
console.log('PASS isolated PostgreSQL: full current guarded function compilation, customer/staff denial, two owners and allowed dogs, old-JWT block/RLS, session+refresh revocation, subscription disable, unblock/ban restore, unchanged dogs/links, atomic ceilings and caller grants, selective rollback');await db.close();
