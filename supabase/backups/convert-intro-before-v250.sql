CREATE OR REPLACE FUNCTION public.convert_web_application_two_dogs_v237(p_submission_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sub public.web_form_submissions%rowtype; person_id bigint; item public.web_form_application_dogs_v237%rowtype;
        dog_ids bigint[]:='{}'::bigint[]; new_dog bigint; num integer; reused boolean:=false;
begin
 if (select auth.uid()) is null
    or not exists(select 1 from public.staff s where s.user_id=(select auth.uid()) and s.active=true)
 then raise exception 'Úkon je dostupný len pracovníkovi škôlky.'; end if;
 select * into sub from public.web_form_submissions
 where id=p_submission_id and form_type='application' for update;
 if not found then raise exception 'Prihláška neexistuje.'; end if;
 select count(*) into num from public.web_form_application_dogs_v237 where submission_id=p_submission_id;
 if num<>2 then raise exception 'Táto prihláška neobsahuje dvoch psíkov.'; end if;
 if exists(select 1 from public.web_form_application_dogs_v237 where submission_id=p_submission_id and converted_dog_id is not null) then
   if (select count(*) from public.web_form_application_dogs_v237 where submission_id=p_submission_id and converted_dog_id is not null)<>2
   then raise exception 'Čiastočný prevod si vyžaduje kontrolu.'; end if;
   select array_agg(converted_dog_id order by dog_order) into dog_ids from public.web_form_application_dogs_v237
     where submission_id=p_submission_id;
   return jsonb_build_object('ok',true,'already_converted',true,'dog_ids',dog_ids);
 end if;
 if sub.status not in ('new','reviewed') then raise exception 'Prihlášku nemožno previesť v tomto stave.'; end if;
 select o.id into person_id
 from public.owners o
 where lower(btrim(o.name))=lower(btrim(sub.owner_name)) and (o.phone=sub.phone or (length(regexp_replace(coalesce(o.phone,''),'[^0-9]','','g'))>=9 and right(regexp_replace(coalesce(o.phone,''),'[^0-9]','','g'),9)=right(regexp_replace(sub.phone,'[^0-9]','','g'),9)))
 order by o.id limit 1;
 if person_id is null then
   insert into public.owners(name,phone) values(sub.owner_name,sub.phone) returning id into person_id;
 else reused:=true; end if;
 for item in select * from public.web_form_application_dogs_v237
      where submission_id=p_submission_id order by dog_order loop
   insert into public.dogs(owner_id,name,sms_name,sex,neutered,breed,weight_kg,age_text,allergies,temperament,
         notes,default_entry_type,vaccination_requirements_verified,active)
   values(person_id,item.dog_name,item.dog_name,item.dog_sex,item.dog_neutered,item.dog_breed,item.dog_weight_kg,
       item.dog_age_text,item.dog_allergies,item.dog_temperament,
       'Web prihláška #'||p_submission_id||' · plán využívania: '||item.interest_reason,'single',false,true)
   returning id into new_dog;
   update public.web_form_application_dogs_v237 set converted_dog_id=new_dog
    where submission_id=p_submission_id and dog_order=item.dog_order;
   dog_ids:=array_append(dog_ids,new_dog);
 end loop;
 update public.web_form_submissions
 set converted_dog_id=dog_ids[1],status='converted'
 where id=p_submission_id;
 return jsonb_build_object('ok',true,'already_converted',false,'owner_id',person_id,'owner_reused',reused,'dog_ids',dog_ids);
end $function$

