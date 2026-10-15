CREATE OR REPLACE FUNCTION private.enqueue_care_expiry_milestones(p_today date, p_dog_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      'Dnes končí platnosť očkovania '||d.name||': '||case when v.vaccination_type='infectious' and exists (select 1 from public.vaccinations vl where vl.dog_id=v.dog_id and vl.vaccination_type='lepto_l4') then 'Infekčné ochorenia DHPPi' else private.vaccination_label(v.vaccination_type) end||'.'
    else private.dog_name_dative(d.name,d.sex)
      ||' o '||(v.valid_until-p_today)||' dní končí platnosť očkovania proti '
      ||case v.vaccination_type when 'rabies' then 'besnote'
        when 'infectious' then case when exists (select 1 from public.vaccinations vl where vl.dog_id=v.dog_id and vl.vaccination_type='lepto_l4') then 'infekčným ochoreniam DHPPi' else 'infekčným ochoreniam DHPPi+L' end
        when 'lepto_l4' then 'leptospiróze (L4)' when 'leptospiróza L4' then 'leptospiróze (L4)' else 'kotercovému kašľu' end||'.' end,
    'vaccination',v.id,
    'vaccination:'||v.dog_id||':'||v.vaccination_type||':'||v.valid_until,
    p_today,v.valid_until,null,null
  from latest v join public.dogs d on d.id=v.dog_id and d.active=true
  join public.customer_owner_links l on l.owner_id=d.owner_id
  where v.vaccination_type in ('rabies','infectious','kennel_cough','lepto_l4')
    and v.valid_until-p_today between 0 and 14
  on conflict (recipient_user_id,event_key) where event_key is not null do nothing;
  get diagnostics v_vaccinations=row_count;

  -- Repair already existing generic in-app text without inserting another event.
  update public.portal_notifications n
  set title='Očkovanie čoskoro končí',
      body=private.dog_name_dative(d.name,d.sex)
        ||' o '||(v.valid_until-p_today)||' dní končí platnosť očkovania proti '
        ||case v.vaccination_type when 'rabies' then 'besnote'
          when 'infectious' then case when exists (select 1 from public.vaccinations vl where vl.dog_id=v.dog_id and vl.vaccination_type='lepto_l4') then 'infekčným ochoreniam DHPPi' else 'infekčným ochoreniam DHPPi+L' end
          when 'lepto_l4' then 'leptospiróze (L4)' when 'leptospiróza L4' then 'leptospiróze (L4)' else 'kotercovému kašľu' end||'.'
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
        when 'infectious' then case when exists (select 1 from public.vaccinations vl where vl.dog_id=v.dog_id and vl.vaccination_type='lepto_l4') then 'infekčné ochorenia DHPPi' else 'infekčné ochorenia DHPPi+L' end
        when 'lepto_l4' then 'leptospiróza L4' else 'kotercový kašeľ' end
        order by case v.vaccination_type when 'rabies' then 1 when 'infectious' then 2 when 'kennel_cough' then 3 else 4 end) labels
    from latest v join public.dogs d on d.id=v.dog_id and d.active=true
    join public.customer_owner_links l on l.owner_id=d.owner_id
    where v.vaccination_type in ('rabies','infectious','kennel_cough','lepto_l4')
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
        when 'infekčné ochorenia DHPPi' then 'infekčným ochoreniam DHPPi' when 'infekčné ochorenia DHPPi+L' then 'infekčným ochoreniam DHPPi+L'
        when 'lepto_l4' then 'leptospiróze (L4)' when 'leptospiróza L4' then 'leptospiróze (L4)' else 'kotercovému kašľu' end
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
        when 'infekčné ochorenia DHPPi' then 'infekčným ochoreniam DHPPi' when 'infekčné ochorenia DHPPi+L' then 'infekčným ochoreniam DHPPi+L'
        when 'lepto_l4' then 'leptospiróze (L4)' when 'leptospiróza L4' then 'leptospiróze (L4)' else 'kotercovému kašľu' end
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
      and p.total_entries-p.used_entries > 2
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
$function$
;
CREATE OR REPLACE FUNCTION private.enqueue_weekly_booking_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  local_now timestamp := clock_timestamp() AT TIME ZONE 'Europe/Bratislava';
  next_monday date := date_trunc('week',local_now)::date + 7;
  inserted integer := 0;
BEGIN
  IF extract(isodow FROM local_now) <> 7 OR extract(hour FROM local_now) <> 16
     OR extract(minute FROM local_now) <> 0 THEN RETURN 0; END IF;

  INSERT INTO public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body)
  SELECT DISTINCT profile.user_id,'weekly_booking_reminder',
    'Nezabudnite prihlásiť psíka',
    'Rezervujte miesto pre vášho psíka na budúci týždeň dnes do 20:00! Ďakujeme a prajeme pekný zvyšok nedele. 🐶',
    'weekly_booking_reminder',null::bigint,
    'weekly-booking:'||next_monday::text,local_now::date,local_now::date,
    'Nezabudnite prihlásiť psíka',
    'Rezervujte miesto pre vášho psíka na budúci týždeň dnes do 20:00! Ďakujeme a prajeme pekný zvyšok nedele. 🐶'
  FROM public.customer_profiles profile
  JOIN public.customer_owner_links link ON link.user_id=profile.user_id
  JOIN public.dogs dog ON dog.owner_id=link.owner_id AND dog.active=true
  WHERE profile.status='active'
    AND EXISTS (SELECT 1 FROM public.portal_push_subscriptions sub
                WHERE sub.user_id=profile.user_id AND sub.active=true)
    AND (EXISTS (SELECT 1 FROM public.visits visit
                WHERE visit.dog_id=dog.id
                  AND visit.visit_date BETWEEN next_monday-7 AND next_monday-3)
         OR EXISTS (SELECT 1 FROM public.reservations past
                WHERE past.dog_id=dog.id AND past.status IN ('booked','attended')
                  AND past.reservation_date BETWEEN next_monday-14 AND next_monday-3))
    AND NOT EXISTS (SELECT 1 FROM public.customer_booking_requests request
                    WHERE request.dog_id=dog.id
                      AND request.reservation_date BETWEEN next_monday AND next_monday+4
                      AND request.status IN ('pending','approved','cancel_requested'))
    AND NOT EXISTS (SELECT 1 FROM public.reservations reservation
                    WHERE reservation.dog_id=dog.id
                      AND reservation.reservation_date BETWEEN next_monday AND next_monday+4
                      AND reservation.status='booked')
  ON CONFLICT (recipient_user_id,event_key) WHERE event_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT;
  RETURN inserted;
END;
$function$
;
CREATE OR REPLACE FUNCTION private.portal_staff_cancel_reservation_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := (select auth.uid());
  v_is_staff boolean := false;
  v_dog_name text;
begin
  if old.status = 'booked' and new.status = 'cancelled' then
    select exists(select 1 from public.staff s where s.user_id=v_actor and s.active=true)
      into v_is_staff;

    if v_is_staff then
      select d.name into v_dog_name from public.dogs d where d.id=new.dog_id;

      update public.customer_booking_requests q
         set status='cancelled',
             cancellation_reason=coalesce(q.cancellation_reason,'Zrušené Chvostíkovom'),
             cancelled_at=coalesce(q.cancelled_at,now())
       where q.reservation_id=new.id and q.status='approved';

      insert into public.portal_notifications(
        recipient_user_id,notification_type,title,body,entity_type,entity_id
      )
      select distinct l.user_id,
             'booking_cancelled_by_staff',
             'Rezervácia bola zrušená',
             'Rezerváciu pre ' || coalesce(v_dog_name,'psíka') || ' na ' || to_char(new.reservation_date,'DD.MM.YYYY') || ' sme zrušili.',
             'reservation',
             new.id
        from public.dogs d
        join public.customer_owner_links l on l.owner_id=d.owner_id
        left join public.customer_profiles p on p.user_id=l.user_id
       where d.id=new.dog_id
         and coalesce(p.status,'active') <> 'suspended';
    end if;
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.process_dog_care_notifications(p_today date DEFAULT ((clock_timestamp() AT TIME ZONE 'Europe/Bratislava'::text))::date)
 RETURNS TABLE(birthday_created integer, vaccination_created integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_birthdays integer := 0; v_care jsonb;
begin
  if p_today is null then raise exception 'Dátum spracovania nesmie byť prázdny.'; end if;
  insert into public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body
  )
  select l.user_id,'dog_birthday','Narodeniny psíka 🎂',
    private.dog_name_dative(d.name,d.sex)||' želáme všetko najlepšie k '
      ||extract(year from age(p_today,d.birth_date))::integer||'. narodeninám!',
    'dog',d.id,'birthday:'||d.id||':'||extract(year from p_today)::integer,
    p_today,p_today,'Chvostíkovo',
    'Všetko najlepšie k narodeninám! Dnes '||d.name||' oslavuje svoje '
      ||extract(year from age(p_today,d.birth_date))::integer||'. narodeniny. 🎂'
  from public.dogs d join public.customer_owner_links l on l.owner_id=d.owner_id
  where d.active=true and d.birth_date is not null and d.birth_date<p_today
    and extract(month from d.birth_date)=extract(month from p_today)
    and extract(day from d.birth_date)=extract(day from p_today)
  on conflict (recipient_user_id,event_key) where event_key is not null do nothing;
  get diagnostics v_birthdays=row_count;
  v_care:=private.enqueue_care_expiry_milestones(p_today,null);
  return query select v_birthdays,coalesce((v_care->>'vaccination_created')::integer,0);
end
$function$
;
CREATE OR REPLACE FUNCTION private.visit_reminder_candidates(p_day date)
 RETURNS TABLE(recipient_user_id uuid, dog_id bigint, reservation_id bigint, body text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT DISTINCT
   profile.user_id,
   d.id,
   r.id,
   'Dobrý deň, na zajtra ' || pg_catalog.to_char(p_day,'DD. MM. YYYY') ||
   ' máte rezervovaný vstup pre ' ||
   private.dog_name_accusative(coalesce(nullif(pg_catalog.btrim(d.sms_name),''),d.name),d.sex) ||
   CASE
     WHEN
       lower(coalesce(nullif(pg_catalog.btrim(r.taxi_mode),''),'none')) IN ('pickup_dropoff','do/zo','do-zo','roundtrip','both')
       OR lower(coalesce(nullif(pg_catalog.btrim(r.taxi_service),''),'none')) IN ('pickup_dropoff','do/zo','do-zo','roundtrip','both')
       THEN ' aj s vyzdvihnutím a dovozom domov.'
     WHEN
       lower(coalesce(nullif(pg_catalog.btrim(r.taxi_mode),''),'none')) IN ('pickup','do','one_way','one-way','oneway')
       OR lower(coalesce(nullif(pg_catalog.btrim(r.taxi_service),''),'none')) IN ('pickup','do','one_way','one-way','oneway')
       THEN ' aj s vyzdvihnutím.'
     ELSE '.'
   END ||
   ' Pozrite si v aplikácii, kto bude s vaším psíkom v škôlke. 🐾' ||
   CASE
     WHEN r.entry_type='pass'
       THEN ' Prehľad vstupov, zostávajúcich vstupov a platnosť permanentky nájdete v aplikácii.'
     ELSE ''
   END
 FROM public.reservations r
 JOIN public.dogs d
   ON d.id=r.dog_id
  AND d.active
  AND d.visit_reminder_channel IN ('auto','both','push')
 JOIN public.customer_owner_links link ON link.owner_id=d.owner_id
 JOIN public.customer_profiles profile
   ON profile.user_id=link.user_id
  AND profile.status='active'
 WHERE r.reservation_date=p_day
   AND r.status='booked'
   AND NOT EXISTS(
     SELECT 1
     FROM public.customer_booking_requests request
     WHERE request.reservation_id=r.id
       AND request.status='cancel_requested'
   )
   AND EXISTS(
     SELECT 1
     FROM public.portal_push_subscriptions sub
     WHERE sub.user_id=profile.user_id
       AND sub.active
   );
$function$
;
CREATE OR REPLACE FUNCTION public.admin_get_dog_legal_status(p_dog_id bigint)
 RETURNS TABLE(has_customer_link boolean, privacy_notice_acknowledged_at timestamp with time zone, terms_version text, terms_accepted_at timestamp with time zone, active_terms_version text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.staff s
    where s.user_id = auth.uid()
      and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  return query
  with dog as (
    select d.owner_id
    from public.dogs d
    where d.id = p_dog_id
    limit 1
  ),
  linked_users as (
    select l.user_id
    from public.customer_owner_links l
    join dog d on d.owner_id = l.owner_id
  ),
  latest_privacy as (
    select max(p.privacy_notice_acknowledged_at) as acknowledged_at
    from public.customer_profiles p
    where p.user_id in (select lu.user_id from linked_users lu)
      and p.privacy_notice_acknowledged_at is not null
  ),
  latest_terms as (
    select
      a.terms_version as accepted_terms_version,
      a.accepted_at as accepted_terms_at
    from public.portal_terms_acceptances a
    where a.dog_id = p_dog_id
    order by a.accepted_at desc
    limit 1
  ),
  active_terms as (
    select td.version as current_terms_version
    from public.portal_terms_documents td
    where td.active = true
      and td.effective_from <= now()
    order by td.effective_from desc
    limit 1
  )
  select
    exists(select 1 from linked_users),
    (select lp.acknowledged_at from latest_privacy lp),
    (select lt.accepted_terms_version from latest_terms lt),
    (select lt.accepted_terms_at from latest_terms lt),
    (select at.current_terms_version from active_terms at);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.emit_customer_portal_live_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  affected_dog_id bigint;
  affected_scope text;
  affected_entity_id bigint;
begin
  if tg_table_name = 'dogs' then
    affected_dog_id := coalesce(new.id, old.id);
    affected_scope := 'dog';
  elsif tg_table_name = 'passes' then
    affected_dog_id := coalesce(new.dog_id, old.dog_id);
    affected_scope := 'passes';
  elsif tg_table_name = 'vaccinations' then
    affected_dog_id := coalesce(new.dog_id, old.dog_id);
    affected_scope := 'dog';
  else
    affected_dog_id := coalesce(new.dog_id, old.dog_id);
    affected_scope := 'bookings';
  end if;
  affected_entity_id := coalesce(new.id, old.id);
  insert into public.portal_live_events(recipient_user_id, scope, entity_id)
  select distinct links.user_id, affected_scope, affected_entity_id
  from public.dogs dog
  join public.customer_owner_links links on links.owner_id = dog.owner_id
  where dog.id = affected_dog_id;
  return coalesce(new, old);
end
$function$
;
CREATE OR REPLACE FUNCTION public.portal_accept_school_terms(p_dog_id bigint, p_terms_version text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_row public.portal_terms_acceptances%rowtype;v_doc public.portal_terms_documents%rowtype;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version AND active AND effective_from<=now();
 IF v_doc.id IS NULL THEN RAISE EXCEPTION 'Aktuálne podmienky sa nenašli.'; END IF;
 IF p_terms_version>='2026-09-30' THEN RAISE EXCEPTION 'Aktualizujte aplikáciu a vedome prijmite novú verziu podmienok.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active) THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash) ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_accept_school_terms_verified(p_dog_id bigint, p_terms_version text, p_document_hash text, p_acceptance_text text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_uid uuid:=auth.uid();v_doc public.portal_terms_documents%rowtype;v_row public.portal_terms_acceptances%rowtype;
 v_name text;v_email text;v_dog text;
 v_text constant text:='Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.';
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF p_acceptance_text IS DISTINCT FROM v_text THEN RAISE EXCEPTION 'Podmienky musíte vedome prijať.'; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version;
 IF v_doc.id IS NULL OR v_doc.document_hash IS DISTINCT FROM p_document_hash THEN RAISE EXCEPTION 'Verzia dokumentu sa zmenila. Otvorte podmienky znova.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 IF NOT v_doc.active OR v_doc.effective_from>now() OR v_doc.id IS DISTINCT FROM
 (SELECT id FROM public.portal_terms_documents WHERE active AND effective_from<=now() ORDER BY effective_from DESC,id DESC LIMIT 1) THEN
 RAISE EXCEPTION 'Prijmite aktuálnu verziu podmienok.'; END IF;
 SELECT d.name INTO v_dog FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 SELECT p.full_name,u.email INTO v_name,v_email FROM auth.users u LEFT JOIN public.customer_profiles p ON p.user_id=u.id WHERE u.id=v_uid;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash,document_id,acceptance_text,accepted_at,user_name_snapshot,user_email_snapshot,dog_name_snapshot)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash,v_doc.id,v_text,clock_timestamp(),v_name,v_email,v_dog)
 ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_approve_dog_submission(p_submission_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_submission public.customer_dog_submissions%rowtype;
  v_profile public.customer_profiles%rowtype;
  v_owner_id bigint;
  v_dog_id bigint;
  v_vaccine jsonb;
  v_default_entry_type text := 'single';
begin
  if not exists (
    select 1 from public.staff s where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_submission from public.customer_dog_submissions
  where id = p_submission_id and status = 'pending' for update;
  if v_submission.id is null then raise exception 'Profil psíka sa nenašiel alebo už bol spracovaný.'; end if;

  select * into v_profile from public.customer_profiles where user_id = v_submission.user_id;
  if v_profile.user_id is null then raise exception 'Zákaznícky účet sa nenašiel.'; end if;

  select owner_id into v_owner_id from public.customer_owner_links
  where user_id = v_submission.user_id order by created_at limit 1;

  if v_owner_id is null then
    insert into public.owners(name, phone)
    values (v_profile.full_name, v_profile.phone)
    returning id into v_owner_id;

    insert into public.customer_owner_links(user_id, owner_id, approved_by)
    values (v_submission.user_id, v_owner_id, v_staff);
  end if;

  select d.entry_type
    into v_default_entry_type
  from private.dog_entry_type_defaults d
  where d.owner_id=v_owner_id
    and d.dog_name_key=lower(btrim(v_submission.dog_name))
  limit 1;

  v_default_entry_type := coalesce(v_default_entry_type,'single');

  insert into public.dogs(
    owner_id, name, customer_name, sms_name, age_text, birth_date, breed, weight_kg, sex, neutered,
    allergies, temperament, default_entry_type, active
  ) values (
    v_owner_id, btrim(v_submission.dog_name), btrim(v_submission.dog_name),
    nullif(btrim(v_submission.sms_name), ''),
    nullif(btrim(v_submission.age_text), ''), v_submission.birth_date,
    nullif(btrim(v_submission.breed), ''), v_submission.weight_kg,
    v_submission.sex, v_submission.neutered,
    nullif(btrim(v_submission.allergies), ''), nullif(btrim(v_submission.temperament), ''),
    v_default_entry_type, true
  ) returning id into v_dog_id;

  for v_vaccine in select value from jsonb_array_elements(v_submission.vaccinations)
  loop
    if coalesce(v_vaccine->>'type', '') in ('rabies', 'infectious', 'kennel_cough')
       and nullif(v_vaccine->>'valid_until', '') is not null then
      insert into public.vaccinations(
        dog_id, vaccination_type, valid_until, notes
      ) values (
        v_dog_id, v_vaccine->>'type',
        nullif(v_vaccine->>'valid_until', '')::date,
        nullif(v_vaccine->>'notes', '')
      );
    end if;
  end loop;

  update public.customer_dog_submissions
  set status = 'approved', linked_dog_id = v_dog_id
  where id = p_submission_id;

  update public.customer_profiles set status = 'active'
  where user_id = v_submission.user_id;

  insert into public.portal_notifications(
    recipient_user_id, notification_type, title, body, entity_type, entity_id
  ) values (
    v_submission.user_id, 'dog_approved', 'Profil psíka bol schválený',
    'Psík ' || v_submission.dog_name || ' bol priradený k vášmu účtu.',
    'dog', v_dog_id
  );

  return v_dog_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_cancel_reservation(p_reservation_id bigint, p_reason text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_reservation public.reservations%rowtype;
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_reason text := nullif(left(btrim(coalesce(p_reason,'')),500),'');
  v_row public.customer_booking_requests%rowtype;
begin
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select r.* into v_reservation from public.reservations r
  join public.dogs d on d.id=r.dog_id
  join public.customer_owner_links l on l.owner_id=d.owner_id
  where r.id=p_reservation_id and r.status='booked' and l.user_id=v_uid for update of r;
  if v_reservation.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_reservation.reservation_date-1)::timestamp + time '21:00';
  if v_now_local > v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 21:00. Kontaktujte Chvostíkovo.';
  end if;
  update public.reservations set status='cancelled' where id=v_reservation.id;
  -- Both linked owners see the same final state after a reservation cancellation.
  update public.customer_booking_requests
     set status='cancelled',cancelled_at=clock_timestamp(),cancellation_reason=v_reason
   where reservation_id=v_reservation.id and status in ('approved','cancel_requested');
  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,status,reservation_id,projected_entry_number,projected_pass_total,
    taxi_mode,taxi_amount,cancellation_reason,cancelled_at
  ) values (
    v_uid,v_reservation.dog_id,v_reservation.reservation_date,'cancelled',v_reservation.id,
    v_reservation.planned_entry_number,v_reservation.planned_pass_total,
    coalesce(v_reservation.taxi_mode,'none'),coalesce(v_reservation.taxi_amount,0),v_reason,now()
  ) returning * into v_row;
  return v_row;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_day_closed_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.bookings_open is not false then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.bookings_open is not distinct from false then
    return new;
  end if;
  if new.day < (now() at time zone 'Europe/Bratislava')::date then
    return new;
  end if;
  insert into public.portal_notifications(recipient_user_id, notification_type, title, body, entity_type)
  select p.user_id,
         'day_closed',
         'Chvostíkovo bude zatvorené',
         'Dňa ' || to_char(new.day, 'DD. MM. YYYY') || ' bude psia škôlka zatvorená.',
         'closed_day'
    from public.customer_profiles p
   where coalesce(p.status, 'pending') <> 'suspended'
     and exists (
       select 1 from public.customer_owner_links l
       join public.dogs d on d.owner_id=l.owner_id
       where l.user_id=p.user_id and d.active=true
     );
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_link_existing_dog(p_user_id uuid, p_dog_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_owner_id bigint;
  v_profile public.customer_profiles%rowtype;
  v_dog_name text;
  v_customer_name text;
  v_submission_id bigint;
  v_submission public.customer_dog_submissions%rowtype;
  v_web public.web_form_submissions%rowtype;
  v_link_created boolean := false;
  v_push_title text;
  v_push_body text;
  v_owner_name text;
  v_owner_phone text;
  v_existing_owner_links integer := 0;
  v_owner_placeholder boolean := false;
begin
  if not exists (
    select 1 from public.staff s where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_profile from public.customer_profiles where user_id = p_user_id;
  if v_profile.user_id is null then raise exception 'Zákaznícky účet sa nenašiel.'; end if;

  select owner_id, name, customer_name
    into v_owner_id, v_dog_name, v_customer_name
  from public.dogs where id = p_dog_id;
  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;

  if v_owner_id is not null then
    select o.name, o.phone
      into v_owner_name, v_owner_phone
    from public.owners o
    where o.id = v_owner_id;

    select count(*)::integer
      into v_existing_owner_links
    from public.customer_owner_links l
    where l.owner_id = v_owner_id;

    v_owner_placeholder :=
      v_existing_owner_links = 0
      and (
        nullif(btrim(v_owner_name),'') is null
        or lower(btrim(v_owner_name)) = 'majiteľ'
        or lower(btrim(v_owner_name)) like 'majiteľ - %'
        or lower(btrim(v_owner_name)) like 'majiteľ – %'
        or lower(btrim(v_owner_name)) like 'majiteľ — %'
      );
  end if;

  -- Link only an application explicitly naming this dog. Another dog's most
  -- recent submission on the same customer account must never supply its data.
  select s.* into v_submission
    from public.customer_dog_submissions s
   where s.user_id=p_user_id
     and s.status in ('pending','approved')
     and (s.linked_dog_id is null or s.linked_dog_id=p_dog_id)
     and (lower(btrim(s.dog_name))=lower(btrim(v_dog_name))
       or lower(btrim(s.dog_name))=lower(btrim(coalesce(v_customer_name,''))))
   order by case when s.status='pending' then 0 else 1 end,s.created_at desc
   limit 1;
  v_submission_id:=v_submission.id;

  select * into v_web
    from public.web_form_submissions
   where converted_dog_id=p_dog_id and form_type='application'
   order by created_at desc,id desc
   limit 1;

  if v_submission_id is not null then
    v_customer_name:=nullif(btrim(v_submission.dog_name),'');
  end if;

  if v_customer_name is null then
    select nullif(btrim(u.raw_user_meta_data->>'dog_name'), '')
      into v_customer_name
    from auth.users u
    where u.id = p_user_id;
  end if;

  if v_customer_name is null then
    select coalesce(nullif(btrim(customer_name), ''), name)
      into v_customer_name
    from public.dogs where id = p_dog_id;
  end if;

  if v_owner_id is null then
    insert into public.owners(name, phone)
    values (v_profile.full_name, v_profile.phone)
    returning id into v_owner_id;
  end if;

  update public.dogs
  set owner_id = v_owner_id,
      customer_name = coalesce(nullif(btrim(customer_name), ''), v_customer_name, name),
      breed=coalesce(nullif(btrim(breed),''),nullif(btrim(v_submission.breed),''),nullif(btrim(v_web.dog_breed),'')),
      weight_kg=coalesce(weight_kg,v_submission.weight_kg,v_web.dog_weight_kg),
      age_text=coalesce(nullif(btrim(age_text),''),nullif(btrim(v_submission.age_text),''),nullif(btrim(v_web.dog_age_text),'')),
      birth_date=coalesce(birth_date,v_submission.birth_date),
      sex=coalesce(nullif(btrim(sex),''),v_submission.sex,v_web.dog_sex),
      neutered=coalesce(neutered,v_submission.neutered,v_web.dog_neutered),
      allergies=coalesce(nullif(btrim(allergies),''),nullif(btrim(v_submission.allergies),''),nullif(btrim(v_web.dog_info),'')),
      temperament=coalesce(nullif(btrim(temperament),''),nullif(btrim(v_submission.temperament),'')),
      notes=coalesce(nullif(btrim(notes),''),nullif(btrim(v_web.dog_info),''))
  where id = p_dog_id;

  insert into public.customer_owner_links(user_id, owner_id, approved_by)
  values (p_user_id, v_owner_id, v_staff)
  on conflict (user_id, owner_id) do nothing;
  v_link_created := found;

  update public.owners
  set alternate_phone = case
        when v_owner_placeholder
         and nullif(btrim(v_profile.phone),'') is not null
         and nullif(btrim(phone),'') is not null
         and regexp_replace(phone,'[^0-9]','','g') <> regexp_replace(v_profile.phone,'[^0-9]','','g')
         and nullif(btrim(alternate_phone),'') is null
        then phone
        else alternate_phone
      end,
      name = case
        when v_owner_placeholder and nullif(btrim(v_profile.full_name),'') is not null
        then btrim(v_profile.full_name)
        else coalesce(name, v_profile.full_name)
      end,
      phone = case
        when v_owner_placeholder and nullif(btrim(v_profile.phone),'') is not null
        then btrim(v_profile.phone)
        else coalesce(phone, v_profile.phone)
      end
  where id = v_owner_id;

  if v_submission_id is not null then
    update public.customer_dog_submissions
    set status='approved', linked_dog_id=p_dog_id, updated_at=now()
    where id=v_submission_id;
  end if;

  update public.customer_profiles set status = 'active' where user_id = p_user_id;

  if v_link_created then
    v_push_title := coalesce(v_customer_name, v_dog_name) || ' bol/a priradený/á k vášmu profilu 🐾';
    v_push_body := 'Otvorte Chvostíkovo a dokončite nastavenie.';
    insert into public.portal_notifications(
      recipient_user_id, notification_type, title, body,
      entity_type, entity_id, read_at, push_title, push_body
    ) values (
      p_user_id, 'dog_approved', v_push_title, v_push_body,
      'dog', p_dog_id, null, v_push_title, v_push_body
    );
  end if;

  return p_dog_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_pass_renewal_eligible(p_dog_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null or exists(select 1 from public.customer_profiles where user_id=v_uid and status='suspended')
    or not exists(select 1 from public.customer_owner_links l join public.dogs d on d.owner_id=l.owner_id
      where l.user_id=v_uid and d.id=p_dog_id and d.active)
    then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
  return private.recent_pass_renewal_eligible(p_dog_id);
end $function$
;
CREATE OR REPLACE FUNCTION public.portal_request_booking(p_dog_id bigint, p_reservation_date date, p_taxi_mode text DEFAULT 'none'::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_booking_late_exception boolean := false;
  v_capacity integer := 8;
  v_taken integer := 0;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
  v_row public.customer_booking_requests%rowtype;
  v_taxi_mode text := coalesce(nullif(btrim(p_taxi_mode), ''), 'none');
  v_taxi_amount numeric(10,2);
  v_default_entry_type text;
begin
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if v_taxi_mode not in ('none', 'pickup', 'pickup_dropoff') then
    raise exception 'Neplatná voľba taxi.';
  end if;
  v_taxi_amount := case v_taxi_mode when 'pickup' then 5 when 'pickup_dropoff' then 10 else 0 end;

  if p_reservation_date <= v_now_local::date
     or extract(isodow from p_reservation_date) not between 1 and 5
     or p_reservation_date > v_now_local::date + 21 then
    raise exception 'Rezervovať je možné pracovné dni najviac 3 týždne dopredu.';
  end if;

  v_deadline := (p_reservation_date - extract(isodow from p_reservation_date)::integer)::timestamp + time '20:00';

  select d.default_entry_type, coalesce(d.booking_late_exception,false)
    into v_default_entry_type,v_booking_late_exception
  from public.customer_owner_links l
  join public.dogs d on d.owner_id = l.owner_id
  where l.user_id = v_uid
    and d.id = p_dog_id
    and d.active = true
  limit 1;

  if v_default_entry_type is null then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;
  if not v_booking_late_exception and current_setting('chvostikovo.late_request',true) IS DISTINCT FROM '1' and v_now_local >= v_deadline then
    raise exception 'Rezervácie na tento týždeň sa uzavreli v nedeľu o 20:00. Napíšte nám správu.';
  end if;

  if exists (
    select 1
    from (values ('rabies'::text),('infectious'::text),('kennel_cough'::text)) required(vaccination_type)
    where not exists (
      select 1
      from public.vaccinations v
      where v.dog_id = p_dog_id
        and v.vaccination_type = required.vaccination_type
        and v.valid_until is not null
        and v.valid_until >= p_reservation_date
    )
  ) then
    raise exception 'Pred rezerváciou doplňte platnosť všetkých povinných očkovaní tak, aby platili v deň rezervácie.';
  end if;

  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.vaccination_type='lepto_l4')
    and not exists (select 1 from public.vaccinations v where v.dog_id=p_dog_id and v.vaccination_type='lepto_l4' and v.valid_until>=p_reservation_date) then
    raise exception 'Leptospiróza L4 nie je platná v deň návštevy. Aktualizujte dátum aj fotografiu očkovania.';
  end if;
  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.requires_proof_after_id is not null) then
    raise exception 'Po obnovení očkovania nahrajte novú fotografiu očkovacieho preukazu.';
  end if;
  if not exists (
    select 1
    from public.vaccination_proofs vp
    where vp.dog_id = p_dog_id
      and vp.is_current = true
  ) then
    raise exception 'Pred rezerváciou nahrajte aspoň jednu fotografiu očkovacieho preukazu.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_reservation_date::text, 7241));

  if exists (
    select 1 from public.reservations r
    where r.dog_id = p_dog_id
      and r.reservation_date = p_reservation_date
      and r.status = 'booked'
  ) or exists (
    select 1 from public.customer_booking_requests q
    where q.dog_id = p_dog_id
      and q.reservation_date = p_reservation_date
      and q.status in ('pending', 'approved', 'cancel_requested')
  ) then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
  end if;

  select coalesce(s.capacity, 8) into v_capacity
  from (select p_reservation_date as day) x
  left join public.portal_day_settings s on s.day = x.day;

  if exists (
    select 1 from public.portal_day_settings
    where day = p_reservation_date and bookings_open = false
  ) then
    raise exception 'Rezervácie na tento deň sú zatvorené.';
  end if;

  select
    (select count(*) from public.reservations r where r.reservation_date = p_reservation_date and r.status = 'booked') +
    (select count(*) from public.customer_booking_requests q where q.reservation_date = p_reservation_date and q.status = 'pending')
  into v_taken;

  if v_taken >= v_capacity then
    raise exception 'Na tento deň už nie je voľné miesto.';
  end if;

  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,projected_entry_number,
    projected_pass_total,taxi_mode,taxi_amount
  ) values (v_uid,p_dog_id,p_reservation_date,null,null,v_taxi_mode,v_taxi_amount)
  returning * into v_row;
  perform private.replan_dog_reservations(p_dog_id,v_now_local::date);
  select * into v_row from public.customer_booking_requests where id=v_row.id;

  return v_row;
exception
  when unique_violation then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_request_pass(p_dog_id bigint, p_total_entries integer)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.customer_pass_requests%rowtype;
  v_today date := (now() at time zone 'Europe/Bratislava')::date;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
begin
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if p_total_entries <> 10 then
    raise exception 'Zákaznícky portál umožňuje prejaviť záujem iba o 10-vstupovú permanentku.';
  end if;

  if exists(
    select 1 from public.customer_profiles
    where user_id=v_uid and status='suspended'
  ) then
    raise exception 'Účet je pozastavený. Kontaktujte Chvostíkovo telefonicky.';
  end if;

  if not exists (
    select 1
      from public.customer_owner_links l
      join public.dogs d on d.owner_id=l.owner_id
     where l.user_id=v_uid and d.id=p_dog_id and d.active=true
  ) then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(p_dog_id);

  if exists (
    select 1 from public.customer_pass_requests
     where dog_id=p_dog_id and status='pending'
  ) then
    raise exception 'Záujem o novú permanentku už evidujeme.';
  end if;

  if exists (
    select 1 from public.passes
     where dog_id=p_dog_id
       and status='queued'
       and used_entries<total_entries
  ) then
    raise exception 'Psík už má pripravenú ďalšiu permanentku.';
  end if;

  select * into v_pass
    from public.passes
   where dog_id=p_dog_id
     and status='active'
     and used_entries<total_entries
     and (coalesce(no_expiry,false) or valid_until is null or valid_until>=v_today)
   order by coalesce(valid_from,purchased_on,created_at::date),id
   limit 1;

  if v_pass.id is not null then
    select
      (select count(*)
         from public.reservations r
        where r.dog_id=p_dog_id
          and r.status='booked'
          and r.entry_type='pass'
          and r.reservation_date>=v_today)
      +
      (select count(*)
         from public.customer_booking_requests q
        where q.dog_id=p_dog_id
          and q.status='pending'
          and q.reservation_date>=v_today
          and q.projected_pass_total=v_pass.total_entries)
      into v_future_pass_count;

    if v_pass.used_entries + v_future_pass_count < v_pass.total_entries then
      raise exception 'Záujem o novú permanentku môžete odoslať po rezervovaní posledného vstupu z aktuálnej permanentky.';
    end if;
  end if;

  if not private.recent_pass_renewal_eligible(p_dog_id) then
    raise exception 'Novú permanentku možno naplánovať iba po poslednom rezervovanom vstupe alebo po nedávnom skončení permanentky.';
  end if;

  insert into public.customer_pass_requests(user_id,dog_id,total_entries)
  values(v_uid,p_dog_id,10)
  returning * into v_row;

  perform private.replan_dog_reservations(p_dog_id,v_today);
  return v_row;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.portal_set_optional_l4(p_dog_id bigint, p_valid_until date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id WHERE d.id=p_dog_id AND l.user_id=auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF; IF p_valid_until IS NULL AND EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=p_dog_id AND s.vaccination_type='lepto_l4') THEN RAISE EXCEPTION 'Samostatnú L4 nemožno odstrániť zo zdravotnej evidencie. Ak je zadaná omylom alebo máte DHPPi+L, kontaktujte škôlku.'; END IF; DELETE FROM public.vaccinations WHERE dog_id=p_dog_id AND vaccination_type='lepto_l4'; IF p_valid_until IS NOT NULL THEN INSERT INTO public.vaccinations(dog_id,vaccination_type,valid_until) VALUES(p_dog_id,'lepto_l4',p_valid_until); END IF; RETURN jsonb_build_object('valid_until',p_valid_until); END $function$
;