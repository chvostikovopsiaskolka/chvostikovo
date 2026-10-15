alter table public.intro_visits add column if not exists application_dogs jsonb;
alter table public.intro_visits add constraint intro_two_dogs_v250 check(application_dogs is null or (jsonb_typeof(application_dogs)='array' and jsonb_array_length(application_dogs)=2));
create table private.intro_two_dogs_audit_v250(id bigint generated always as identity primary key,occurred_at timestamptz not null default now(),actor uuid,action text not null,intro_id bigint,submission_id bigint,before_value jsonb,after_value jsonb);
alter table private.intro_two_dogs_audit_v250 enable row level security;
revoke all on private.intro_two_dogs_audit_v250 from public,anon,authenticated;
create or replace function public.save_web_intro_two_v250(p_submission_id bigint,p_dogs jsonb,p_date date,p_time time,p_owner_name text,p_owner_phone text,p_notes text default null,p_intro_id bigint default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.web_form_submissions%rowtype; v public.intro_visits%rowtype; old_value jsonb; d jsonb; first_dog jsonb; names text[]:='{}'; n integer:=0; created boolean:=false;
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=auth.uid() and active) then raise exception 'Úkon je dostupný iba personálu.' using errcode='42501';end if;
 select * into s from public.web_form_submissions where id=p_submission_id for update;
 if not found or s.form_type<>'application' or s.status not in ('new','reviewed') or s.converted_dog_id is not null then raise exception 'Prihláška už bola prihlásená alebo nie je dostupná.';end if;
 if (select count(*) from public.web_form_application_dogs_v237 where submission_id=s.id)<>2 then raise exception 'Prihláška neobsahuje dvoch psíkov.';end if;
 if p_date is null or p_date<(now() at time zone 'Europe/Bratislava')::date or p_time is null then raise exception 'Zadajte budúci dátum a čas úvodnej návštevy.';end if;
 if nullif(btrim(p_owner_name),'') is null or length(p_owner_name)>200 or p_owner_phone!~'^\+[0-9]{9,15}$' or p_owner_phone is null or length(coalesce(p_notes,''))>6000 then raise exception 'Skontrolujte meno a telefón majiteľa.';end if;
 if p_dogs is null or jsonb_typeof(p_dogs)<>'array' or jsonb_array_length(p_dogs)<>2 then raise exception 'Vyplňte údaje oboch psíkov.';end if;
 for d in select value from jsonb_array_elements(p_dogs) loop
  n:=n+1;
  if jsonb_typeof(d)<>'object' or nullif(btrim(d->>'dog_name'),'') is null or length(d->>'dog_name')>200 or (d->>'dog_order')::int is distinct from n then raise exception 'Skontrolujte meno a poradie psíka.';end if;
  if coalesce(d->>'dog_sex','') not in ('male','female','') or coalesce(d->>'dog_neutered','') not in ('true','false','') then raise exception 'Skontrolujte pohlavie a kastráciu.';end if;
  if coalesce(d->>'dog_weight_kg','')<>'' and ((d->>'dog_weight_kg')::numeric<=0 or (d->>'dog_weight_kg')::numeric>150) then raise exception 'Neplatná váha.';end if;
  if length(coalesce(d->>'dog_allergies',''))>3000 or length(coalesce(d->>'dog_temperament',''))>3000 or length(coalesce(d->>'dog_breed',''))>200 or length(coalesce(d->>'dog_age_text',''))>80 then raise exception 'Údaje psíka sú príliš dlhé.';end if;
  names:=array_append(names,btrim(d->>'dog_name'));
 end loop;
 if lower(names[1])=lower(names[2]) then raise exception 'Mená psíkov musia byť rozlíšiteľné.';end if;
 if (select count(*) from public.intro_visits where source_submission_id=s.id)>1 then raise exception 'Prihláška má viac návštev; vyžaduje ručnú kontrolu.';end if;
 select * into v from public.intro_visits where source_submission_id=s.id for update;
 if found then
  if p_intro_id is null then
   if v.application_dogs=p_dogs and v.visit_date=p_date and v.visit_time=p_time and v.owner_phone=p_owner_phone and v.owner_name=btrim(p_owner_name) and coalesce(v.notes,'')=coalesce(nullif(btrim(p_notes),''),'') then return jsonb_build_object('visit',to_jsonb(v),'created',false);end if;
   raise exception 'Úvodná návšteva už existuje. Otvorte ju a upravte.';
  end if;
  if v.id<>p_intro_id or v.application_dogs is null then raise exception 'Návšteva nezodpovedá dvojici.';end if;
  old_value:=to_jsonb(v);
 elsif p_intro_id is not null then raise exception 'Návšteva už neexistuje.';
 else created:=true;end if;
 first_dog:=p_dogs->0;
 if created then
  insert into public.intro_visits(dog_name,owner_name,owner_phone,notes,visit_date,visit_time,source_submission_id,application_dogs,created_by)
   values(array_to_string(names,' a '),btrim(p_owner_name),p_owner_phone,nullif(btrim(p_notes),''),p_date,p_time,s.id,p_dogs,auth.uid()) returning * into v;
 else
  update public.intro_visits set dog_name=array_to_string(names,' a '),owner_name=btrim(p_owner_name),owner_phone=p_owner_phone,notes=nullif(btrim(p_notes),''),visit_date=p_date,visit_time=p_time,application_dogs=p_dogs where id=v.id returning * into v;
 end if;
 update public.web_form_submissions set status='reviewed' where id=s.id;
 insert into private.intro_two_dogs_audit_v250(actor,action,intro_id,submission_id,before_value,after_value) values(auth.uid(),case when created then 'scheduled' else 'edited' end,v.id,s.id,old_value,to_jsonb(v));
 return jsonb_build_object('visit',to_jsonb(v),'created',created);
end $$;
revoke all on function public.save_web_intro_two_v250(bigint,jsonb,date,time,text,text,text,bigint) from public,anon;
grant execute on function public.save_web_intro_two_v250(bigint,jsonb,date,time,text,text,text,bigint) to authenticated;
create or replace function public.cancel_web_intro_two_v250(p_intro_id bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare v public.intro_visits%rowtype;sid bigint;
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=auth.uid() and active) then raise exception 'Úkon je dostupný iba personálu.' using errcode='42501';end if;
 select source_submission_id into sid from public.intro_visits where id=p_intro_id and application_dogs is not null;
 if not found then return true;end if;
 perform 1 from public.web_form_submissions where id=sid for update;
 select * into v from public.intro_visits where id=p_intro_id and application_dogs is not null for update;
 if not found then return true;end if;
 insert into private.intro_two_dogs_audit_v250(actor,action,intro_id,submission_id,before_value) values(auth.uid(),'cancelled',v.id,sid,to_jsonb(v));
 delete from public.intro_visits where id=v.id;
 update public.web_form_submissions set status='new' where id=sid and status='reviewed' and converted_dog_id is null;
 return true;
end $$;
revoke all on function public.cancel_web_intro_two_v250(bigint) from public,anon;
grant execute on function public.cancel_web_intro_two_v250(bigint) to authenticated;
notify pgrst,'reload schema';
CREATE OR REPLACE FUNCTION public.convert_web_application_two_dogs_v237(p_submission_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare sub public.web_form_submissions%rowtype; person_id bigint; item public.web_form_application_dogs_v237%rowtype;
        dog_ids bigint[]:='{}'::bigint[]; new_dog bigint; num integer; reused boolean:=false; intro_row public.intro_visits%rowtype; intro_dogs jsonb;
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
 select * into intro_row from public.intro_visits where source_submission_id=p_submission_id and application_dogs is not null for update;
 if found then intro_dogs:=intro_row.application_dogs;sub.owner_name:=intro_row.owner_name;sub.phone:=intro_row.owner_phone;end if;
 select o.id into person_id
 from public.owners o
 where lower(btrim(o.name))=lower(btrim(sub.owner_name)) and (o.phone=sub.phone or (length(regexp_replace(coalesce(o.phone,''),'[^0-9]','','g'))>=9 and right(regexp_replace(coalesce(o.phone,''),'[^0-9]','','g'),9)=right(regexp_replace(sub.phone,'[^0-9]','','g'),9)))
 order by o.id limit 1;
 if person_id is null then
   insert into public.owners(name,phone) values(sub.owner_name,sub.phone) returning id into person_id;
 else reused:=true; end if;
 for item in select (jsonb_populate_record(null::public.web_form_application_dogs_v237,x.value)).* from jsonb_array_elements(coalesce(intro_dogs,(select jsonb_agg(to_jsonb(d) order by d.dog_order) from public.web_form_application_dogs_v237 d where d.submission_id=p_submission_id))) x loop
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
 if intro_row.id is not null then
 insert into private.intro_two_dogs_audit_v250(actor,action,intro_id,submission_id,before_value) values(auth.uid(),'registered',intro_row.id,p_submission_id,to_jsonb(intro_row));
 delete from public.intro_visits where id=intro_row.id;
 end if;
 return jsonb_build_object('ok',true,'already_converted',false,'owner_id',person_id,'owner_reused',reused,'dog_ids',dog_ids);
end $function$

