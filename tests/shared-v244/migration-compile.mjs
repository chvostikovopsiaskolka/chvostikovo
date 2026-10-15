import {PGlite} from '@electric-sql/pglite';import fs from 'node:fs';
const db=new PGlite();const root=new URL('../../',import.meta.url),tables=JSON.parse(fs.readFileSync(new URL('./all-schema.json',import.meta.url))).tables;
await db.exec(`create schema auth;create schema private;create schema extensions;create role anon;create role authenticated;create role service_role;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function extensions.uuid_generate_v4() returns uuid language sql as $$select gen_random_uuid()$$;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');`);
for(const t of tables){
 const cols=t.columns.map(c=>`${c.name} ${c.type}${c.identity?' generated always as identity':c.default&&!c.default.includes('nextval(')?' default '+c.default:''}${c.notnull?' not null':''}`);
 cols.push(...(t.constraints||[]).filter(c=>!c.startsWith('FOREIGN KEY')));
 await db.exec(`create table ${t.schema}.${t.name}(${cols.join(',')});`);
}
// Baseline function definitions contain code only. No data or outbound webhook triggers are installed.
const defs=JSON.parse(fs.readFileSync(new URL('supabase/backups/shared-v243-functions.json',root)));
for(const f of JSON.parse(fs.readFileSync(new URL('./baseline-name-helper.json',import.meta.url))))await db.exec(f.definition);
let pending=defs;
for(let round=0;round<2&&pending.length;round++){
 const failed=[];for(const f of pending)try{await db.exec(f.definition)}catch(e){failed.push({...f,error:e.message})}pending=failed;
}
if(pending.length)throw Error('Baseline dependencies unavailable: '+pending.map(f=>f.name+': '+f.error).join('; '));
await db.exec(`create policy portal_terms_acceptances_customer_insert on public.portal_terms_acceptances for insert to authenticated with check (true);`);
await db.exec(fs.readFileSync(new URL('supabase/migrations/20261015143657_shared_passes_v245.sql',root),'utf8'));
console.log('PASS complete migration SQL compiled against 70 production table definitions; no production records used');
const flag=(await db.query('select public.portal_shared_capabilities_v244() c')).rows[0].c;
if(flag.shared_passes_v244!==false)throw Error('Release must stay disabled by default');
console.log('PASS complete migration defaults to disabled release');await db.close();
