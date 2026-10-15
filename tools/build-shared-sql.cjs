const fs=require('fs');
const defs=JSON.parse(fs.readFileSync('supabase/backups/shared-v243-functions.json','utf8'));
const source=name=>{const f=defs.find(f=>f.name===name);if(!f)throw Error(name);return f.definition.trim()+';\n'};
let sql='\n-- Existing definitions are copied from the verified v243 database, then changed narrowly.\n';
// Preserve the legacy planner verbatim and dispatch shared pools to the new ledger.
sql+=source('replan_dog_reservations').replaceAll('private.replan_dog_reservations(', 'private.replan_individual_v243(');
sql+=`\nREVOKE ALL ON FUNCTION private.replan_individual_v243(bigint,date) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.replan_dog_reservations(p_dog_id bigint,p_from_date date DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE own bigint; BEGIN
 IF current_setting('chvostikovo.shared_planning',true)='1' THEN RETURN; END IF;
 IF private.shared_dog_v244(p_dog_id) THEN
  own:=private.lock_pool_v244(p_dog_id); PERFORM private.apply_shared_plan_v244(own);
 ELSE PERFORM private.replan_individual_v243(p_dog_id,p_from_date); END IF;
END $$;
`;
// Restrict all existing owner-based checks and customer notifications to explicitly linked dogs.
for(const name of ['portal_request_booking','portal_request_pass','portal_cancel_reservation','portal_set_optional_l4','portal_pass_renewal_eligible','portal_accept_school_terms','portal_accept_school_terms_verified']){
 let s=source(name);
 // The same ownership join appears with spacing and aliases in these functions.
 s=s.replace(/(d\.owner_id\s*=\s*l\.owner_id|l\.owner_id\s*=\s*d\.owner_id)/gi,'$1 AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))');
 if(['portal_request_booking','portal_request_pass'].includes(name))s=s.replace(/\nbegin\n/i,'\nbegin\n  perform private.lock_pool_v244(p_dog_id);\n');
 sql+=s+'\n';
}
let link=source('portal_link_existing_dog');
link=link.replace('  v_owner_placeholder boolean := false;', '  v_owner_placeholder boolean := false;\n  v_names text[];');
link=link.replace("  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;", "  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;\n  if v_owner_id is null then raise exception 'Najprv overte a nastavte majiteľa existujúceho psa.'; end if;\n  perform private.lock_pool_v244(p_dog_id);");
// A comma-separated registration string is a request, never the dog's display name.
link=link.replace("    select nullif(btrim(u.raw_user_meta_data->>'dog_name'), '')", "    select case when position(',' in coalesce(u.raw_user_meta_data->>'dog_name',''))=0 and coalesce(u.raw_user_meta_data->>'dog_count','1')='1' then nullif(btrim(u.raw_user_meta_data->>'dog_name'), '') else null end");
link=link.replace('insert into public.customer_owner_links(user_id, owner_id, approved_by)\n  values (p_user_id, v_owner_id, v_staff)\n  on conflict (user_id, owner_id) do nothing;', `insert into public.customer_owner_links(user_id,owner_id,approved_by,allowed_dog_ids)
  values(p_user_id,v_owner_id,v_staff,ARRAY[p_dog_id])
  on conflict(user_id,owner_id) do update set allowed_dog_ids=CASE
    WHEN public.customer_owner_links.allowed_dog_ids IS NULL THEN NULL
    ELSE ARRAY(SELECT DISTINCT x FROM unnest(public.customer_owner_links.allowed_dog_ids||ARRAY[p_dog_id]) x ORDER BY x) END
  WHERE public.customer_owner_links.allowed_dog_ids IS NOT NULL AND NOT p_dog_id=ANY(public.customer_owner_links.allowed_dog_ids);`);

link=link.replace('  perform private.lock_pool_v244(p_dog_id);', `  perform private.lock_pool_v244(p_dog_id);
  if exists(select 1 from public.customer_owner_links where user_id=p_user_id and owner_id<>v_owner_id) then
    raise exception 'Účet už má iného majiteľa. Overte evidenciu manuálne.';
  end if;`);
sql+=link;
// Staff approval remains one sale; repeated approval returns the same purchase.
let approve=source('portal_approve_pass_request');
approve=approve.replace("  if v_request.status <> 'pending'", "  if v_request.status='approved' then return v_request; end if;\n  perform private.lock_pool_v244(v_request.dog_id);\n  if v_request.status <> 'pending'");
approve=approve.replace('  update public.dogs\n  set default_entry_type', `  if cardinality(v_request.dog_ids)=2 then
    if (select count(distinct d.owner_id) from public.dogs d where d.id=ANY(v_request.dog_ids))<>1
       or exists(select 1 from unnest(v_request.dog_ids) x where not private.owns_dog_v244(v_request.user_id,x)) then
      raise exception 'Vlastníctvo psíkov sa zmenilo. Skontrolujte žiadosť.';
    end if;
    insert into public.pass_dogs(pass_id,dog_id,approved_by) select v_pass_id,x,v_staff from unnest(v_request.dog_ids) x;
  end if;
  update public.dogs
  set default_entry_type`);
approve=approve.replace('where id = v_request.dog_id;', 'where id = v_request.dog_id or id=ANY(v_request.dog_ids);');
sql+=approve;
// Shared request approvals use the concrete pass chosen by the ledger, never a primary-dog guess.
let ab=source('portal_approve_booking').replace(/\nbegin\n/i,'\nbegin\n  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));\n');
ab=ab.replace("  if v_row.status <> 'pending'", "  if v_row.status='approved' then return v_row; end if;\n  perform private.lock_pool_v244(v_row.dog_id);\n  perform private.replan_dog_reservations(v_row.dog_id);\n  select * into v_row from public.customer_booking_requests where id=p_request_id;\n  if v_row.status <> 'pending'");
ab=ab.replace("where id=v_row.planned_pass_request_id and dog_id=v_row.dog_id and status='pending'", "where id=v_row.planned_pass_request_id and (dog_id=v_row.dog_id or v_row.dog_id=ANY(dog_ids)) and status='pending'");
ab=ab.replace('where dog_id=v_row.dog_id and status', 'where (dog_id=v_row.dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=v_row.dog_id)) and (v_row.projected_pass_id is null or id=v_row.projected_pass_id) and status');
ab=ab.replace("  update public.customer_booking_requests\n  set status = 'approved',", "  update public.reservations set billing_choice=v_row.billing_choice where id=v_reservation_id;\n  update public.customer_booking_requests\n  set status = 'approved',");
ab=ab.replace("  if v_row.status='approved' then return v_row; end if;", `  if v_row.status='approved' then return v_row; end if;
  if v_row.booking_group_id is not null and current_setting('chvostikovo.group_approval_v244',true) is distinct from '1' then
    perform public.portal_approve_booking_group_v244(v_row.booking_group_id);
    select * into v_row from public.customer_booking_requests where id=p_request_id;
    return v_row;
  end if;`);
sql+=ab;
// Lock a whole owner pool before any pass/visit/reservation changes.
for(const name of ['purchase_pass','mark_no_show','set_pass_used_entries','set_pass_role','portal_cancel_booking','portal_reject_booking','portal_mark_pass_interest_handled','portal_reject_pass_request']){
 let s=source(name);
 const param=name==='purchase_pass'?'p_dog_id':name==='mark_no_show'?'(select dog_id from public.reservations where id=p_reservation_id)':name==='portal_cancel_booking'||name==='portal_reject_booking'?'(select dog_id from public.customer_booking_requests where id=p_request_id)':name==='portal_mark_pass_interest_handled'||name==='portal_reject_pass_request'?'(select dog_id from public.customer_pass_requests where id=p_request_id)':'(select dog_id from public.passes where id=p_pass_id)';
 s=s.replace(/\nbegin\n/i,`\nbegin\n  perform private.lock_pool_v244(${param});\n`);
 if(name==='mark_no_show')s=s.replace('  perform private.ensure_current_pass(r.dog_id);','  perform private.renumber_shared_visits_v244(v.pass_id);\n  perform private.ensure_current_pass(r.dog_id);');
 sql+=s;
}
let finalize=source('finalize_day');
finalize=finalize.replace('  r record;', '  r record;\n  lock_owner bigint;');
finalize=finalize.replace(/\nbegin\n/i,`\nbegin
  for lock_owner in select distinct d.owner_id from public.reservations lock_r join public.dogs d on d.id=lock_r.dog_id where lock_r.reservation_date=p_date and lock_r.status='booked' and d.owner_id is not null order by d.owner_id
  loop perform pg_catalog.pg_advisory_xact_lock(-lock_owner); end loop;
`);
finalize=finalize.replace('select total_entries,used_entries+1 into v_pass_total,v_actual_entry from public.passes where id=v_pass_id;', `select total_entries,used_entries+1 into v_pass_total,v_actual_entry from public.passes where id=v_pass_id for update;
      if v_actual_entry>v_pass_total then raise exception 'Permanentka už nemá voľný vstup.'; end if;`);
sql+=finalize;
fs.writeFileSync('supabase/changes/shared-existing-functions-v244.sql',sql);

let ownedSql='\n';
for(const name of ['emit_customer_portal_live_event','enqueue_weekly_booking_reminders','enqueue_care_expiry_milestones','portal_staff_cancel_reservation_notify','visit_reminder_candidates','process_dog_care_notifications','portal_day_closed_notify','admin_get_dog_legal_status']){
 let x=source(name);
 x=x.replace(/(d\.owner_id\s*=\s*l\.owner_id|l\.owner_id\s*=\s*d\.owner_id)/gi,'$1 AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))');
 x=x.replace(/(link\.owner_id\s*=\s*d\.owner_id)/gi,'$1 AND (link.allowed_dog_ids IS NULL OR d.id=ANY(link.allowed_dog_ids))');
 x=x.replace(/(dog\.owner_id\s*=\s*link\.owner_id)/gi,'$1 AND (link.allowed_dog_ids IS NULL OR dog.id=ANY(link.allowed_dog_ids))');
 x=x.replace(/(links\.owner_id\s*=\s*dog\.owner_id)/gi,'$1 AND (links.allowed_dog_ids IS NULL OR dog.id=ANY(links.allowed_dog_ids))');
 ownedSql+=x;
}
let createDog=source('portal_approve_dog_submission');
createDog=createDog.replace('  for v_vaccine in', `  update public.customer_owner_links set allowed_dog_ids=case when allowed_dog_ids is null then null else allowed_dog_ids||ARRAY[v_dog_id] end where user_id=v_submission.user_id and owner_id=v_owner_id;
  for v_vaccine in`);
ownedSql+=createDog;
fs.writeFileSync('supabase/changes/shared-ownership-notifications-v244.sql',ownedSql);
