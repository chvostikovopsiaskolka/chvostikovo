-- Use the existing Slovak dative in care notifications and inflect the booking CTA.
create or replace function private.dog_name_dative(p_name text, p_sex text)
returns text language plpgsql immutable set search_path = ''
as $$
declare v_name text := btrim(coalesce(p_name,'')); v_lower text;
begin
  if v_name='' then return 'Psíkovi'; end if;
  v_lower:=lower(v_name);
  case v_lower
    when 'aron' then return 'Aronovi';
    when 'falco' then return 'Falcovi';
    when 'rómeo' then return 'Rómeovi';
    when 'romeo' then return 'Romeovi';
    when 'beliška' then return 'Beliške';
    when 'beliska' then return 'Beliske';
    when 'bella' then return 'Belle';
    when 'angie' then return v_name;
    else null;
  end case;
  if p_sex='male' then
    if v_name ~* 'o$' then return left(v_name,-1)||'ovi'; end if;
    if v_name ~* '[bcčdďfghjklľĺmnňprsštťvzžx]$' then return v_name||'ovi'; end if;
  elsif p_sex='female' then
    if v_name ~* 'a$' then return left(v_name,-1)||'e'; end if;
  end if;
  return v_name;
end
$$;

create or replace function private.dog_name_accusative(p_name text, p_sex text)
returns text language plpgsql immutable set search_path = ''
as $$
declare v_name text := btrim(coalesce(p_name,''));
begin
  if v_name='' then return 'psíka'; end if;
  if p_sex='female' and v_name ~* 'a$' then return left(v_name,-1)||'u'; end if;
  if p_sex='male' and v_name ~* 'o$' then return left(v_name,-1)||'a'; end if;
  if p_sex='male' and v_name ~* '[bcčdďfghjklľĺmnňprsštťvzžx]$' then return v_name||'a'; end if;
  return v_name;
end
$$;

create or replace function private.enqueue_care_expiry_milestones(p_today date, p_dog_id bigint default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_vaccinations integer := 0;
  v_passes integer := 0;
  v_pushes integer := 0;
begin
  if p_today is null then raise exception 'Dátum spracovania nesmie byť prázdny.'; end if;

  -- Remove outdated notices when the vaccination was renewed or removed.
  with latest as (
    select distinct on (v.dog_id,v.vaccination_type)
      v.id,v.dog_id,v.vaccination_type,v.valid_until
    from public.vaccinations v
    where p_dog_id is null or v.dog_id=p_dog_id
    order by v.dog_id,v.vaccination_type,v.created_at desc,v.id desc
  )
  update public.portal_notifications n
  set visible_until=least(coalesce(n.visible_until,p_today-1),p_today-1)
  where n.notification_type='vaccination_expiry'
    and (p_dog_id is null or exists(select 1 from public.vaccinations x where x.id=n.entity_id and x.dog_id=p_dog_id))
    and coalesce(n.visible_until,p_today)>=p_today
    and not exists (
      select 1 from latest v where n.entity_type='vaccination'
        and n.entity_id=v.id
        and n.event_key='vaccination:'||v.dog_id||':'||v.vaccination_type||':'||v.valid_until
    );

  with latest as (
    select distinct on (v.dog_id,v.vaccination_type)
      v.id,v.dog_id,v.vaccination_type,v.valid_until
    from public.vaccinations v
    where p_dog_id is null or v.dog_id=p_dog_id
    order by v.dog_id,v.vaccination_type,v.created_at desc,v.id desc
  )
  insert into public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body
  )
  select distinct l.user_id,'vaccination_expiry','Očkovanie čoskoro končí',
    case when v.valid_until-p_today=0 then
      'Dnes končí platnosť očkovania '||d.name||': '||private.vaccination_label(v.vaccination_type)||'.'
    else private.dog_name_dative(d.name,d.sex)
      ||' o '||(v.valid_until-p_today)||' dní končí platnosť očkovania proti '
      ||case v.vaccination_type when 'rabies' then 'besnote'
        when 'infectious' then 'infekčným ochoreniam DHPPi+L'
        else 'kotercovému kašľu' end||'.' end,
    'vaccination',v.id,
    'vaccination:'||v.dog_id||':'||v.vaccination_type||':'||v.valid_until,
    p_today,v.valid_until,null,null
  from latest v join public.dogs d on d.id=v.dog_id and d.active=true
  join public.customer_owner_links l on l.owner_id=d.owner_id
  where v.vaccination_type in ('rabies','infectious','kennel_cough')
    and v.valid_until-p_today between 0 and 14
  on conflict (recipient_user_id,event_key) where event_key is not null do nothing;
  get diagnostics v_vaccinations=row_count;

  -- Repair already existing generic in-app text without inserting another event.
  update public.portal_notifications n
  set title='Očkovanie čoskoro končí',
      body=private.dog_name_dative(d.name,d.sex)
        ||' o '||(v.valid_until-p_today)||' dní končí platnosť očkovania proti '
        ||case v.vaccination_type when 'rabies' then 'besnote'
          when 'infectious' then 'infekčným ochoreniam DHPPi+L'
          else 'kotercovému kašľu' end||'.'
  from public.vaccinations v join public.dogs d on d.id=v.dog_id
  where n.notification_type='vaccination_expiry' and n.entity_id=v.id
    and (p_dog_id is null or v.dog_id=p_dog_id)
    and v.valid_until>=p_today and n.visible_until>=p_today
    and n.title is distinct from 'Očkovanie čoskoro končí';

  -- Aggregate all vaccination types for one dog and one milestone before a single push.
  with latest as (
    select distinct on (v.dog_id,v.vaccination_type)
      v.id,v.dog_id,v.vaccination_type,v.valid_until
    from public.vaccinations v
    where p_dog_id is null or v.dog_id=p_dog_id
    order by v.dog_id,v.vaccination_type,v.created_at desc,v.id desc
  ), grouped as (
    select d.id dog_id,d.name,d.sex,l.user_id,v.valid_until,
      v.valid_until-p_today days,
      array_agg(case v.vaccination_type when 'rabies' then 'besnota'
        when 'infectious' then 'infekčné ochorenia DHPPi+L'
        else 'kotercový kašeľ' end
        order by case v.vaccination_type when 'rabies' then 1 when 'infectious' then 2 else 3 end) labels
    from latest v join public.dogs d on d.id=v.dog_id and d.active=true
    join public.customer_owner_links l on l.owner_id=d.owner_id
    where v.vaccination_type in ('rabies','infectious','kennel_cough')
      and v.valid_until-p_today in (14,7)
    group by d.id,d.name,d.sex,l.user_id,v.valid_until,v.valid_until-p_today
  )
  insert into public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,read_at,push_title,push_body
  )
  select user_id,'vaccination_milestone_push',
    case when days=14 then 'Očkovanie čoskoro končí 🐾' else 'Očkovanie končí o 7 dní 🐾' end,
    private.dog_name_dative(name,sex)
      ||case when days=14 then ' o 14 dní končí platnosť očkovania' else ' zostáva 7 dní do konca platnosti očkovania' end
      ||case when cardinality(labels)=1 then ' proti '||case labels[1]
        when 'besnota' then 'besnote'
        when 'infekčné ochorenia DHPPi+L' then 'infekčným ochoreniam DHPPi+L'
        else 'kotercovému kašľu' end
        else ': '||array_to_string(labels[1:cardinality(labels)-1],', ')||' a '||labels[cardinality(labels)] end
      ||case when days=7 then '. Po preočkovaní nezabudnite doplniť novú platnosť v aplikácii.'
        else '. Nezabudnite ho včas obnoviť.' end,
    'dog',dog_id,
    'vaccination_push:'||dog_id||':'||valid_until||':'||days,
    now(),
    case when days=14 then 'Očkovanie čoskoro končí 🐾' else 'Očkovanie končí o 7 dní 🐾' end,
    private.dog_name_dative(name,sex)
      ||case when days=14 then ' o 14 dní končí platnosť očkovania' else ' zostáva 7 dní do konca platnosti očkovania' end
      ||case when cardinality(labels)=1 then ' proti '||case labels[1]
        when 'besnota' then 'besnote'
        when 'infekčné ochorenia DHPPi+L' then 'infekčným ochoreniam DHPPi+L'
        else 'kotercovému kašľu' end
        else ': '||array_to_string(labels[1:cardinality(labels)-1],', ')||' a '||labels[cardinality(labels)] end
      ||case when days=7 then '. Po preočkovaní nezabudnite doplniť novú platnosť v aplikácii.'
        else '. Nezabudnite ho včas obnoviť.' end
  from grouped
  on conflict (recipient_user_id,event_key) where event_key is not null do nothing;
  get diagnostics v_pushes=row_count;

  with eligible as (
    select p.id,p.dog_id,p.valid_until,p.total_entries-p.used_entries remaining,
      d.name,d.sex,l.user_id
    from public.passes p join public.dogs d on d.id=p.dog_id and d.active=true
    join public.customer_owner_links l on l.owner_id=d.owner_id
    where (p_dog_id is null or p.dog_id=p_dog_id)
      and p.status='active' and p.no_expiry=false and p.valid_until=p_today+14
      and p.used_entries<p.total_entries
      and p.total_entries-p.used_entries > (
        select count(*) from public.reservations r
        where r.pass_id=p.id and r.status='booked'
          and r.reservation_date between p_today and p.valid_until
      )
  )
  insert into public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body
  )
  select user_id,'pass_expiry','Permanentka čoskoro končí',
    private.dog_name_dative(name,sex)
      ||' končí permanentka o 14 dní. Zostáva vám ešte '||remaining||' '
      ||case when remaining=1 then 'vstup' when remaining between 2 and 4 then 'vstupy' else 'vstupov' end
      ||'. Prihláste '||private.dog_name_accusative(name,sex)
      ||' do škôlky ešte pred skončením platnosti permanentky.',
    'pass',id,'pass_expiry:'||id||':'||valid_until||':14',p_today,valid_until,
    'Permanentka čoskoro končí 🐾',
    private.dog_name_dative(name,sex)
      ||' končí permanentka o 14 dní. Zostáva vám ešte '||remaining||' '
      ||case when remaining=1 then 'vstup' when remaining between 2 and 4 then 'vstupy' else 'vstupov' end
      ||'. Prihláste '||private.dog_name_accusative(name,sex)
      ||' do škôlky, aby vám vstup neprepadol.'
  from eligible
  on conflict (recipient_user_id,event_key) where event_key is not null do nothing;
  get diagnostics v_passes=row_count;
  return jsonb_build_object('vaccination_created',v_vaccinations,
    'vaccination_push_created',v_pushes,'pass_created',v_passes);
end
$$;


-- The previous push has already been delivered; correct its stored in-app copy only.
update public.portal_notifications n
set body=replace(replace(n.body,'Belli','Belle'),'Prihláste ju','Prihláste Bellu'),
    push_body=replace(n.push_body,'Belli','Belle')
from public.passes p join public.dogs d on d.id=p.dog_id
join public.owners o on o.id=d.owner_id
where n.notification_type='pass_expiry' and n.entity_type='pass' and n.entity_id=p.id
  and d.name='Bella' and o.name='Marek Leder'
  and n.event_key='pass_expiry:'||p.id||':'||p.valid_until||':14';
revoke all on function private.dog_name_accusative(text,text) from public,anon,authenticated;
