const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require('./shared-v244/node_modules/@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 try{
   // Live schema contract: 0 is the explicit missing-proof sentinel, never NULL.
   await db.exec(`create role anon;create role authenticated;create schema private;
     create table public.vaccination_proofs(id bigint primary key,dog_id bigint not null,is_current boolean not null);
     create table private.vaccination_state_v234(dog_id bigint,accepted_proof_id bigint NOT NULL DEFAULT 0,requires_proof_after_id bigint);`);
   await db.exec(fs.readFileSync('supabase/changes/vaccine-proof-delete-v392.sql','utf8'));
   await db.exec(`insert into vaccination_proofs values(1,1,true),(2,1,true),(3,2,true);
      insert into private.vaccination_state_v234(dog_id,accepted_proof_id) values(1,2),(2,3);`);
   await assert.rejects(db.exec('delete from vaccination_proofs where id=2'),/null value|not-null|23502/i,'the old trigger fails against live NOT NULL schema');
   assert.equal((await db.query('select count(*)::int as c from vaccination_proofs where id=2')).rows[0].c,1,'failed database deletion rolls back metadata');
   await db.exec(fs.readFileSync('supabase/changes/vaccine-proof-delete-notnull-v427.sql','utf8'));
   await db.exec('delete from vaccination_proofs where id=2');
   let state=(await db.query('select * from private.vaccination_state_v234 where dog_id=1')).rows[0];
   assert.equal(Number(state.accepted_proof_id),0,'deleting latest proof leaves no accepted photo');
   assert.equal(Number(state.requires_proof_after_id),2,'fresh-proof gate persists');
   assert.equal(Number((await db.query('select accepted_proof_id from private.vaccination_state_v234 where dog_id=2')).rows[0].accepted_proof_id),3,'unrelated dog unaffected');
   await db.exec(`insert into vaccination_proofs values(4,1,true),(5,1,true);
      update private.vaccination_state_v234 set accepted_proof_id=4,requires_proof_after_id=null where dog_id=1;
      delete from vaccination_proofs where id=4;`);
   state=(await db.query('select * from private.vaccination_state_v234 where dog_id=1')).rows[0];
   assert.equal(Number(state.accepted_proof_id),5,'later current proof is accepted');
   assert.equal(state.requires_proof_after_id,null,'newer proof leaves no renewal gate');
   await db.exec(`update private.vaccination_state_v234 set accepted_proof_id=1,requires_proof_after_id=99 where dog_id=1;
      delete from vaccination_proofs where id=1;`);
   state=(await db.query('select * from private.vaccination_state_v234 where dog_id=1')).rows[0];
   assert.equal(Number(state.accepted_proof_id),0,'existing fresh-proof gate cannot accept an old image');
   assert.equal(Number(state.requires_proof_after_id),99,'preexisting newer-proof requirement preserved');
   assert.equal((await db.query("select has_function_privilege('authenticated','private.proof_delete_v392()','execute') as allowed")).rows[0].allowed,false,'no client EXECUTE');
   await assert.rejects(db.exec(fs.readFileSync('supabase/changes/vaccine-proof-delete-notnull-v427.sql','utf8')),/baseline mismatch/i,'guard rejects unexpected post-v427 baseline');
   console.log('PASS v427 live-shape NOT NULL deletion, old failure reproduced, new sentinel=0, fresh-proof safety, later proof, separate dogs, ACL and baseline guard');
 }finally{await db.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
