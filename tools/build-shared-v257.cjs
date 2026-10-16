// Mechanical assembly from reviewed shared draft and exact pre-v257 LIVE backups.
const fs=require('fs');
const core=fs.readFileSync('supabase/changes/shared-passes-v244.sql','utf8');
const old=fs.readFileSync('supabase/changes/shared-existing-functions-v244.sql','utf8');
const live=JSON.parse(fs.readFileSync('supabase/backups/shared-before-v257-functions.json','utf8'));
const source=name=>live.find(f=>f.name===name).definition.trim()+';\n';
const changed=name=>{const re=new RegExp('CREATE OR REPLACE FUNCTION (?:public|private)\\.'+name+'\\([\\s\\S]*?\\$function\\$\\s*;');const m=old.match(re);if(!m)throw Error(name);return m[0]+'\n'};
let sql=core.slice(core.indexOf('ALTER TABLE public.customer_pass_requests'),core.indexOf('CREATE FUNCTION public.portal_link_dog_verified_v244'));
sql=sql.replace('approved_by uuid NOT NULL','approved_by uuid'); // NULL only for audited system/test provisioning.
sql=sql.replace('CREATE TRIGGER owner_assignment_audit AFTER INSERT OR UPDATE OR DELETE ON public.customer_owner_links FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();','');
sql+=core.slice(core.indexOf('CREATE FUNCTION private.guard_pass_member_v244'),core.indexOf('ALTER TABLE public.customer_owner_links ADD CONSTRAINT'));
sql+=core.slice(core.indexOf('GRANT SELECT ON public.pass_dogs TO service_role;')).replace('ALTER TABLE private.booking_batch_push_events ADD COLUMN dog_ids bigint[];','');
// Expiry is projected from first planned use, never persisted until actual use.
sql=sql.replace("used_map jsonb:='{}'; virtual_map", "used_map jsonb:='{}'; first_map jsonb:='{}'; virtual_map");
sql=sql.replace('AND (pp.no_expiry OR pp.valid_until IS NULL OR pp.valid_until>=rec.reservation_date)', "AND (pp.no_expiry OR coalesce(pp.valid_until,((first_map->>pp.id::text)::date+interval '2 months')::date,rec.reservation_date)>=rec.reservation_date)");
sql=sql.replace("used_map:=jsonb_set(used_map,ARRAY[p.id::text],to_jsonb(num));", "used_map:=jsonb_set(used_map,ARRAY[p.id::text],to_jsonb(num));\n    IF NOT first_map ? p.id::text THEN first_map:=jsonb_set(first_map,ARRAY[p.id::text],to_jsonb(rec.reservation_date));END IF;");
// Copy legacy planner verbatim; dispatch only explicit shared members to the pool.
sql+=source('replan_dog_reservations').replaceAll('private.replan_dog_reservations(', 'private.replan_individual_v243(');
sql+='REVOKE ALL ON FUNCTION private.replan_individual_v243(bigint,date) FROM PUBLIC,anon,authenticated;\n';
sql+=changed('replan_dog_reservations');
for(const name of ['portal_request_booking','portal_request_pass','portal_cancel_reservation']){
 let s=source(name).replace(/\nbegin\n/i,'\nbegin\n  perform private.lock_pool_v244('+(name==='portal_cancel_reservation'?'(select dog_id from public.reservations where id=p_reservation_id)':'p_dog_id')+');\n');
 if(name==='portal_request_booking')s=s.replace('  if v_uid is null',"  if private.shared_dog_v244(p_dog_id) and current_setting('chvostikovo.shared_quote_v257',true) is distinct from '1' then raise exception 'Obnovte aplikáciu a skontrolujte rozdelenie vstupov spoločnej permanentky.';end if;\n  if v_uid is null");
 sql+=s;
}
for(const name of ['portal_approve_pass_request','portal_approve_booking','purchase_pass','mark_no_show','set_pass_used_entries','set_pass_role','portal_cancel_booking','portal_reject_booking','portal_mark_pass_interest_handled','portal_reject_pass_request','finalize_day'])sql+=changed(name);
// Both primary and secondary members can activate the same next pass.
sql+=source('ensure_current_pass').replaceAll('where dog_id=p_dog_id', 'where (dog_id=p_dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=p_dog_id))');
const batches=JSON.parse(fs.readFileSync('supabase/backups/shared-before-v257-batches.json','utf8'));
for(const b of batches.filter(b=>b.name==='portal_request_dogs_batch_v254'))sql+=b.definition.replace(' -- All dates and dogs lock', ' PERFORM private.lock_pool_v244(p_dog_ids[1]);\n -- All dates and dogs lock')+';\n';
sql=sql.replace(' -- All inserts share one transaction.', " PERFORM set_config('chvostikovo.shared_quote_v257','1',true);\n -- All inserts share one transaction.");
sql=sql.replace(" RETURN result;\nEND $$;\nREVOKE ALL ON FUNCTION public.portal_shared_booking_v244", ()=>" PERFORM set_config('chvostikovo.shared_quote_v257','',true);\n RETURN result;\nEND $$;\nREVOKE ALL ON FUNCTION public.portal_shared_booking_v244");
// Test entitlement is not a purchase; actual first attendance still starts validity.
sql=sql.replaceAll('when purchased_on is not null and valid_from is null', "when (purchased_on is not null or source='test_shared_v257') and valid_from is null");
sql=sql.replace('v_value := case\n',"v_value := case\n      when r.entry_type='pass' and exists(select 1 from public.passes where id=v_pass_id and source='test_shared_v257') then 0.00\n");
sql+=source('refresh_daily_financial').replace('where v.visit_date=p_day;', "where v.visit_date=p_day and coalesce(p.source,'')<>'test_shared_v257';");
// Serialize purchase approvals before acquiring a request row lock.
sql=sql.replace("  select * into v_request\n  from public.customer_pass_requests", "  perform private.lock_pool_v244((select dog_id from public.customer_pass_requests where id=p_request_id));\n  select * into v_request\n  from public.customer_pass_requests");
// Expire/queue against every entitlement, not just passes anchored to this dog.
sql=sql.replaceAll('where dog_id = v_request.dog_id', 'where (dog_id = v_request.dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=v_request.dog_id))');
// Cohort-safe checks: explicit scope, active dogs, correct primary membership.
sql+=`\nCREATE FUNCTION private.guard_shared_pass_anchor_v257() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.pass_dogs m JOIN public.dogs d ON d.id=m.dog_id WHERE m.pass_id=new.id AND d.owner_id IS DISTINCT FROM (SELECT owner_id FROM public.dogs WHERE id=new.dog_id)) THEN RAISE EXCEPTION 'Zmena majiteľa spoločnej permanentky vyžaduje kontrolu.';END IF;RETURN new;END $$;
CREATE TRIGGER guard_shared_pass_anchor_v257 BEFORE UPDATE OF dog_id ON public.passes FOR EACH ROW EXECUTE FUNCTION private.guard_shared_pass_anchor_v257();
REVOKE ALL ON FUNCTION private.guard_shared_pass_anchor_v257() FROM PUBLIC,anon,authenticated;
`;
sql+=`\nCREATE FUNCTION private.guard_shared_entry_v257() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.passes%rowtype;
BEGIN
 IF new.pass_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.pass_dogs WHERE pass_id=new.pass_id) THEN RETURN new;END IF;
 PERFORM private.lock_pool_v244(new.dog_id);
 SELECT * INTO p FROM public.passes WHERE id=new.pass_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.pass_dogs WHERE pass_id=new.pass_id AND dog_id=new.dog_id) THEN RAISE EXCEPTION 'Psík nemá oprávnenie čerpať túto spoločnú permanentku.';END IF;
 IF TG_TABLE_NAME='visits' THEN
  IF new.pass_entry_number IS NULL OR new.pass_entry_number NOT BETWEEN 1 AND p.total_entries OR EXISTS(SELECT 1 FROM public.visits v WHERE v.pass_id=new.pass_id AND v.pass_entry_number=new.pass_entry_number AND v.id<>new.id) THEN RAISE EXCEPTION 'Neplatné alebo duplicitné čerpanie spoločnej permanentky.';END IF;
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER guard_shared_reservation_v257 BEFORE INSERT OR UPDATE OF pass_id,dog_id ON public.reservations FOR EACH ROW EXECUTE FUNCTION private.guard_shared_entry_v257();
CREATE TRIGGER guard_shared_visit_v257 BEFORE INSERT OR UPDATE OF pass_id,dog_id,pass_entry_number ON public.visits FOR EACH ROW EXECUTE FUNCTION private.guard_shared_entry_v257();
REVOKE ALL ON FUNCTION private.guard_shared_entry_v257() FROM PUBLIC,anon,authenticated;
`;
fs.writeFileSync('supabase/migrations/20261016060000_shared_passes_v257.sql',sql);
