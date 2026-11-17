-- Rollback of vaccination-first-review-l4-v420.sql to the exact LIVE function captured 2026-11-11.
-- Reverts only trigger logic; does NOT delete records or undo staff reviews already created.
create or replace function private.vaccination_change_v234()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare old_state private.vaccination_state_v234%rowtype;
        current_photo bigint; previous_photo bigint; has_state boolean;
begin
 if new.vaccination_type not in ('rabies','infectious','kennel_cough','lepto_l4') then return new; end if;
 select * into old_state from private.vaccination_state_v234
   where dog_id=new.dog_id and vaccination_type=new.vaccination_type for update;
 has_state:=found;
 select coalesce(max(id),0) into current_photo from public.vaccination_proofs
   where dog_id=new.dog_id and is_current=true;
 if not has_state then
   select coalesce(max(accepted_proof_id),0) into previous_photo
     from private.vaccination_state_v234 where dog_id=new.dog_id;
   insert into private.vaccination_state_v234
     (dog_id,vaccination_type,valid_until,accepted_proof_id,requires_proof_after_id)
   values(new.dog_id,new.vaccination_type,new.valid_until,
     case when new.vaccination_type='lepto_l4' then previous_photo else current_photo end,
     case when new.vaccination_type='lepto_l4' and previous_photo>0
           and current_photo<=previous_photo then previous_photo else null end)
   on conflict(dog_id,vaccination_type) do nothing;
   return new;
 end if;
 if old_state.valid_until is distinct from new.valid_until then
   update private.vaccination_state_v234 set valid_until=new.valid_until,
     accepted_proof_id=case
       when old_state.requires_proof_after_id is null and current_photo>old_state.accepted_proof_id then current_photo
       else old_state.accepted_proof_id end,
     requires_proof_after_id=case
       when old_state.requires_proof_after_id is not null and current_photo<=old_state.requires_proof_after_id then old_state.requires_proof_after_id
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
