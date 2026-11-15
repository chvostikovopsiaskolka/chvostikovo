-- 2026-11-11: Initial vaccines must be visible to staff.
-- On first-time L4 entered in the same atomic onboarding save as three required vaccines,
-- the already uploaded current photos are sufficient. Later addition/renewal of L4
-- still requires a newer proof. No customer dates, photos, ACLs or booking rules change.
-- Production baseline: private.vaccination_change_v234, read back 2026-11-11.
create or replace function private.vaccination_change_v234()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  old_state private.vaccination_state_v234%rowtype;
  current_photo bigint;
  previous_photo bigint;
  has_state boolean;
  initial_required_batch boolean := false;
begin
  if new.vaccination_type not in ('rabies','infectious','kennel_cough','lepto_l4') then return new; end if;
  select * into old_state
  from private.vaccination_state_v234
  where dog_id=new.dog_id and vaccination_type=new.vaccination_type for update;
  has_state:=found;
  select coalesce(max(id),0) into current_photo
  from public.vaccination_proofs where dog_id=new.dog_id and is_current=true;
  if not has_state then
    select coalesce(max(accepted_proof_id),0) into previous_photo
    from private.vaccination_state_v234 where dog_id=new.dog_id;
    -- This is true only when all three required types were initially inserted
    -- or legitimately updated in the same database transaction, BEFORE first L4.
    select count(*)=3 into initial_required_batch
    from private.vaccination_state_v234
    where dog_id=new.dog_id
      and vaccination_type in ('rabies','infectious','kennel_cough')
      and changed_at=transaction_timestamp();
    insert into private.vaccination_state_v234
      (dog_id,vaccination_type,valid_until,accepted_proof_id,requires_proof_after_id)
    values (new.dog_id,new.vaccination_type,new.valid_until,
      case when new.vaccination_type='lepto_l4' and not initial_required_batch
           then previous_photo else current_photo end,
      case when new.vaccination_type='lepto_l4' and not initial_required_batch
                 and previous_photo>0 and current_photo<=previous_photo
           then previous_photo else null end)
    on conflict (dog_id,vaccination_type) do nothing;
    -- This was missing on first INSERT. The existing event trigger dispatches
    -- staff notifications and the admin's existing review list reads these rows.
    insert into public.portal_vaccination_review_events_v234
      (dog_id,vaccination_type,previous_valid_until,new_valid_until)
    values (new.dog_id,new.vaccination_type,null,new.valid_until)
    on conflict (dog_id,vaccination_type,new_valid_until)
      do update set created_at=now(),review_status='pending',reviewed_at=null,reviewed_by=null;
    return new;
  end if;
  if old_state.valid_until is distinct from new.valid_until then
    update private.vaccination_state_v234 set valid_until=new.valid_until,
      accepted_proof_id=case
        when old_state.requires_proof_after_id is null and current_photo>old_state.accepted_proof_id
          then current_photo
        else old_state.accepted_proof_id end,
      requires_proof_after_id=case
        when old_state.requires_proof_after_id is not null and current_photo<=old_state.requires_proof_after_id
          then old_state.requires_proof_after_id
        when old_state.requires_proof_after_id is not null then null
        when current_photo>old_state.accepted_proof_id then null
        else old_state.accepted_proof_id end,
      changed_at=now()
    where dog_id=new.dog_id and vaccination_type=new.vaccination_type;
    insert into public.portal_vaccination_review_events_v234
      (dog_id,vaccination_type,previous_valid_until,new_valid_until)
    values(new.dog_id,new.vaccination_type,old_state.valid_until,new.valid_until)
    on conflict(dog_id,vaccination_type,new_valid_until)
      do update set created_at=now(),review_status='pending',reviewed_at=null,reviewed_by=null;
  end if;
  return new;
end
$function$;
