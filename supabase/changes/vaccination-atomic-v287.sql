-- One transaction for all vaccine dates and proof validation. Uploads remain separate:
-- a failed save may leave a new proof, never a changed date without the proof.
create or replace function public.portal_save_vaccinations_v287(p_dog_id bigint,p_vaccinations jsonb,p_l4 date default null,p_include_l4 boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; proof bigint; today date:=(now() at time zone 'Europe/Bratislava')::date; until_date date; kind text;
begin
 if auth.uid() is null or not exists(select 1 from public.dogs d join public.customer_owner_links l on l.owner_id=d.owner_id where d.id=p_dog_id and l.user_id=auth.uid() and (l.allowed_dog_ids is null or d.id=any(l.allowed_dog_ids))) then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
 perform 1 from public.dogs where id=p_dog_id for update;
 if jsonb_typeof(p_vaccinations) is distinct from 'array' or jsonb_array_length(p_vaccinations)<>3 or (select count(distinct v->>'type') from jsonb_array_elements(p_vaccinations) v where v->>'type' in ('rabies','infectious','kennel_cough') and nullif(v->>'valid_until','') is not null)<>3 then raise exception 'Doplňte platnosť všetkých troch očkovaní.'; end if;
 perform 1 from public.vaccination_proofs where dog_id=p_dog_id and is_current for share;
 select coalesce(max(id),0) into proof from public.vaccination_proofs where dog_id=p_dog_id and is_current;
 if proof=0 then raise exception 'Nahrajte aktuálnu fotografiu očkovacieho preukazu.'; end if;
 if p_include_l4 and p_l4 is null and exists(select 1 from private.vaccination_state_v234 where dog_id=p_dog_id and vaccination_type='lepto_l4') then raise exception 'Evidovanú L4 nemožno odstrániť. Kontaktujte škôlku.'; end if;
 for item in select value from jsonb_array_elements(p_vaccinations || case when p_include_l4 and p_l4 is not null then jsonb_build_array(jsonb_build_object('type','lepto_l4','valid_until',p_l4)) else '[]'::jsonb end) loop
  kind:=item->>'type';until_date:=(item->>'valid_until')::date;
  if until_date<today then raise exception 'Očkovanie je po platnosti. Po preočkovaní zadajte nový dátum a aktuálnu fotografiu dokladu.'; end if;
  if kind='lepto_l4' and not exists(select 1 from private.vaccination_state_v234 where dog_id=p_dog_id and vaccination_type=kind) and proof<=(select coalesce(max(accepted_proof_id),0) from private.vaccination_state_v234 where dog_id=p_dog_id) then raise exception 'Pri doplnení L4 treba aktuálnu novú fotografiu dokladu.';end if;
  if exists(select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.vaccination_type=kind and ((s.valid_until is distinct from until_date and proof<=s.accepted_proof_id) or (s.requires_proof_after_id is not null and proof<=s.requires_proof_after_id))) then raise exception 'Pri zmene dátumu treba aktuálnu novú fotografiu dokladu. Pôvodná fotografia nestačí.'; end if;
 end loop;
 delete from public.vaccinations where dog_id=p_dog_id and vaccination_type in ('rabies','infectious','kennel_cough');
 insert into public.vaccinations(dog_id,vaccination_type,valid_until,notes) select p_dog_id,v->>'type',(v->>'valid_until')::date,v->>'notes' from jsonb_array_elements(p_vaccinations) v;
 if p_include_l4 then perform public.portal_set_optional_l4(p_dog_id,p_l4); end if;
 insert into public.portal_dog_onboarding(user_id,dog_id,details_prompt_answered_at,details_prompt_skipped) values(auth.uid(),p_dog_id,now(),false) on conflict(user_id,dog_id) do update set details_prompt_answered_at=excluded.details_prompt_answered_at,details_prompt_skipped=false;
 return jsonb_build_object('dog_id',p_dog_id,'linked',true,'onboarding_complete',true,'vaccinations_atomic_v287',true);
end $$;
revoke all on function public.portal_save_vaccinations_v287(bigint,jsonb,date,boolean) from public,anon;
grant execute on function public.portal_save_vaccinations_v287(bigint,jsonb,date,boolean) to authenticated;
