-- Executed after the function DDL within BEGIN ... ROLLBACK. No dispatch is committed.
do $$ declare d bigint;u uuid;v jsonb;b jsonb;before_dates text;after_dates text;today date:=(now() at time zone 'Europe/Bratislava')::date;begin
 select l.user_id,x.dog_id into u,d from public.customer_owner_links l join public.dogs dog on dog.owner_id=l.owner_id join public.vaccinations x on x.dog_id=dog.id where (l.allowed_dog_ids is null or dog.id=any(l.allowed_dog_ids)) and exists(select 1 from public.vaccination_proofs p where p.dog_id=dog.id and p.is_current) group by l.user_id,x.dog_id having count(*) filter(where x.vaccination_type in('rabies','infectious','kennel_cough') and x.valid_until>=today)=3 limit 1;
 if d is null then raise exception 'No eligible rollback fixture';end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 select jsonb_agg(jsonb_build_object('type',vaccination_type,'valid_until',valid_until,'notes',notes) order by vaccination_type) into v from public.vaccinations where dog_id=d and vaccination_type in('rabies','infectious','kennel_cough');
 select md5(jsonb_agg(jsonb_build_array(vaccination_type,valid_until,notes) order by vaccination_type)::text) into before_dates from public.vaccinations x where dog_id=d;
 perform public.portal_save_vaccinations_v287(d,v);
 update private.vaccination_state_v234 set accepted_proof_id=(select coalesce(max(id),0) from public.vaccination_proofs where dog_id=d and is_current),requires_proof_after_id=null where dog_id=d;
 -- Changed dates without a fresh proof are rejected by the same server function.
 b:=jsonb_set(v,'{0,valid_until}',to_jsonb((today+500)::text));
 begin perform public.portal_save_vaccinations_v287(d,b);raise exception 'Expected new-proof rejection';exception when others then if sqlerrm='Expected new-proof rejection' then raise;end if;end;
 b:=jsonb_set(v,'{0,valid_until}',to_jsonb((today-1)::text));
 begin perform public.portal_save_vaccinations_v287(d,b);raise exception 'Expected expired rejection';exception when others then if sqlerrm='Expected expired rejection' then raise;end if;end;
 -- Optional L4 failure must roll back the other three dates.
 begin perform public.portal_save_vaccinations_v287(d,v,today-1,true);raise exception 'Expected L4 rejection';exception when others then if sqlerrm='Expected L4 rejection' then raise;end if;end;
 select md5(jsonb_agg(jsonb_build_array(vaccination_type,valid_until,notes) order by vaccination_type)::text) into after_dates from public.vaccinations x where dog_id=d;
 if before_dates is distinct from after_dates then raise exception 'Vaccine state changed after rejected writes';end if;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
 begin perform public.portal_save_vaccinations_v287(d,v);raise exception 'Expected owner rejection';exception when others then if sqlerrm='Expected owner rejection' then raise;end if;end;
end $$;
select 'PASS unchanged atomic save; no-new-proof/expired/L4/owner rejection; dates unchanged' as result;
-- Fresh proof followed by all dates succeeds in one transaction; rolled back by caller.
do $$ declare d bigint;u uuid;v jsonb;today date:=(now() at time zone 'Europe/Bratislava')::date;begin
 select l.user_id,dog.id into u,d from public.customer_owner_links l join public.dogs dog on dog.owner_id=l.owner_id where (l.allowed_dog_ids is null or dog.id=any(l.allowed_dog_ids)) and exists(select 1 from public.vaccination_proofs p where p.dog_id=dog.id and p.is_current) limit 1;
 if d is null then raise exception 'No proof fixture';end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 insert into public.vaccination_proofs(dog_id,uploaded_by,batch_id,storage_path,source,is_current) select d,u,gen_random_uuid(),'synthetic-rollback-v287/no-storage-object.jpg',source,true from public.vaccination_proofs where dog_id=d and is_current limit 1;
 select jsonb_agg(jsonb_build_object('type',x,'valid_until',today+500)) into v from unnest(array['rabies','infectious','kennel_cough']) x;
 perform public.portal_save_vaccinations_v287(d,v);
 if (select count(*) from public.vaccinations where dog_id=d and vaccination_type in('rabies','infectious','kennel_cough') and valid_until=today+500)<>3 then raise exception 'Fresh-proof save failed';end if;
end $$;
select 'PASS fresh proof -> atomic three-date save (transaction rollback)' as result;
