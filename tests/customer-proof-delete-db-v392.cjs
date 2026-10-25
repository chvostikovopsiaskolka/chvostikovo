const fs=require('node:fs'),assert=require('node:assert/strict');const {PGlite}=require('./shared-v244/node_modules/@electric-sql/pglite');
(async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema private;create table public.vaccination_proofs(id bigint primary key,dog_id bigint,is_current boolean);create table private.vaccination_state_v234(dog_id bigint,accepted_proof_id bigint,requires_proof_after_id bigint);`);
 await db.exec(fs.readFileSync('supabase/changes/vaccine-proof-delete-v392.sql','utf8'));
 await db.exec(`insert into vaccination_proofs values(1,1,true),(2,1,true),(3,2,true);insert into private.vaccination_state_v234 values(1,2,null),(2,3,null);delete from vaccination_proofs where id=2;`);
 let s=(await db.query('select * from private.vaccination_state_v234 where dog_id=1')).rows[0];assert.equal(s.accepted_proof_id,null);assert.equal(s.requires_proof_after_id,2);
 assert.equal((await db.query('select accepted_proof_id from private.vaccination_state_v234 where dog_id=2')).rows[0].accepted_proof_id,3);
 await db.exec(`insert into vaccination_proofs values(4,1,true),(5,1,true);update private.vaccination_state_v234 set accepted_proof_id=4,requires_proof_after_id=null where dog_id=1;delete from vaccination_proofs where id=4;`);
 s=(await db.query('select * from private.vaccination_state_v234 where dog_id=1')).rows[0];assert.equal(s.accepted_proof_id,5);assert.equal(s.requires_proof_after_id,null);
 assert.equal((await db.query("select has_function_privilege('authenticated','private.proof_delete_v392()','execute') allowed")).rows[0].allowed,false);
 console.log('PASS PostgreSQL deletion trigger: accepted proof revoked, old photo insufficient, newer replacement retained, other dog isolation, no client EXECUTE');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
