BEGIN;
DO $guard$ BEGIN
IF pg_get_functiondef('portal_approve_booking_group_v244(uuid)'::regprocedure)<>$before$CREATE OR REPLACE FUNCTION public.portal_approve_booking_group_v244(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE q public.customer_booking_requests%rowtype; own bigint; out_rows jsonb:='[]';
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 SELECT * INTO q FROM public.customer_booking_requests WHERE booking_group_id=p_group_id ORDER BY id LIMIT 1;
 IF q.id IS NULL THEN RAISE EXCEPTION 'Spoločná rezervácia sa nenašla.'; END IF;
 own:=private.lock_pool_v244(q.dog_id);
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status NOT IN ('pending','approved','cancelled','rejected')) THEN RAISE EXCEPTION 'Spoločná rezervácia vyžaduje kontrolu personálom.'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status='pending') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtextextended(q.reservation_date::text,7241));
  IF EXISTS(SELECT 1 FROM public.portal_day_settings WHERE day=q.reservation_date AND NOT bookings_open) OR
   ((SELECT count(*) FROM public.reservations WHERE reservation_date=q.reservation_date AND status='booked')+
    (SELECT count(*) FROM public.customer_booking_requests WHERE reservation_date=q.reservation_date AND status='pending'))>
    coalesce((SELECT capacity FROM public.portal_day_settings WHERE day=q.reservation_date),8) THEN
    RAISE EXCEPTION 'Kapacita alebo dostupnosť dňa sa zmenila. Overte rezervácie pred schválením.';
  END IF;
 END IF;
 PERFORM set_config('chvostikovo.group_approval_v244','1',true);
 FOR q IN SELECT * FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status IN ('pending','approved') ORDER BY dog_id FOR UPDATE LOOP
  IF NOT private.owns_dog_v244(q.user_id,q.dog_id) THEN RAISE EXCEPTION 'Oprávnenie rezervovať psíka sa zmenilo.'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(ARRAY['rabies','infectious','kennel_cough']) typ WHERE NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type=typ AND v.valid_until>=q.reservation_date))
   OR EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=q.dog_id AND (s.requires_proof_after_id IS NOT NULL OR s.vaccination_type='lepto_l4' AND NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type='lepto_l4' AND v.valid_until>=q.reservation_date))) THEN RAISE EXCEPTION 'Očkovanie niektorého psíka vyžaduje kontrolu.'; END IF;
  SELECT * INTO q FROM public.portal_approve_booking(q.id,NULL);
  out_rows:=out_rows||to_jsonb(q);
 END LOOP;
 PERFORM set_config('chvostikovo.group_approval_v244','',true);
 RETURN out_rows;
END $function$
$before$ THEN RAISE EXCEPTION 'Function baseline changed';END IF;
IF pg_get_functiondef('portal_request_booking(bigint,date,text)'::regprocedure)<>$before$CREATE OR REPLACE FUNCTION public.portal_request_booking(p_dog_id bigint, p_reservation_date date, p_taxi_mode text DEFAULT 'none'::text)
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
  perform private.lock_pool_v244(p_dog_id);
  if private.shared_dog_v244(p_dog_id) and current_setting('chvostikovo.shared_quote_v257',true) is distinct from '1' then raise exception 'Obnovte aplikáciu a skontrolujte rozdelenie vstupov spoločnej permanentky.';end if;
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
  join public.dogs d on d.owner_id = l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
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
$before$ THEN RAISE EXCEPTION 'Function baseline changed';END IF;
IF pg_get_functiondef('portal_set_day_closed(date,boolean,text)'::regprocedure)<>$before$CREATE OR REPLACE FUNCTION public.portal_set_day_closed(p_day date, p_closed boolean, p_note text DEFAULT NULL::text)
 RETURNS portal_day_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_row public.portal_day_settings%rowtype;
begin
  if v_staff is null or not exists (
    select 1
    from public.staff s
    where s.user_id = v_staff
      and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  if p_day is null or p_closed is null then
    raise exception 'Vyberte platný dátum.';
  end if;

  insert into public.portal_day_settings(day, capacity, bookings_open, note, updated_at)
  values (
    p_day,
    8,
    not p_closed,
    case when p_closed then coalesce(nullif(btrim(p_note), ''), 'Zatvorené') else null end,
    now()
  )
  on conflict (day) do update
    set bookings_open = excluded.bookings_open,
        note = excluded.note,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$function$
$before$ THEN RAISE EXCEPTION 'Function baseline changed';END IF;
IF EXISTS(SELECT 1 FROM public.app_settings WHERE setting_key='daycare_default_capacity') OR to_regprocedure('public.portal_set_default_capacity_v322(integer)') IS NOT NULL THEN RAISE EXCEPTION 'Setting already exists';END IF;
END $guard$;
CREATE OR REPLACE FUNCTION private.daycare_default_capacity_v322()
RETURNS integer LANGUAGE sql STABLE SET search_path=''
AS $$ SELECT coalesce((SELECT setting_value::integer FROM public.app_settings
 WHERE setting_key='daycare_default_capacity' AND setting_value ~ '^([1-9]|[12][0-9]|30)$'),8) $$;
REVOKE ALL ON FUNCTION private.daycare_default_capacity_v322() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.portal_set_default_capacity_v322(p_capacity integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_day date; v_occupied integer;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=(SELECT auth.uid()) AND active)
 THEN RAISE EXCEPTION 'Nemáte oprávnenie.' USING ERRCODE='42501'; END IF;
 IF p_capacity IS NULL OR p_capacity<1 OR p_capacity>30 THEN RAISE EXCEPTION 'Kapacita musí byť celé číslo od 1 do 30.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('default-capacity-v322',7241));
 SELECT day,count(*)::integer INTO v_day,v_occupied FROM (
  SELECT reservation_date AS day FROM public.reservations WHERE status='booked' AND reservation_date >= (now() AT TIME ZONE 'Europe/Bratislava')::date
  UNION ALL
  SELECT reservation_date AS day FROM public.customer_booking_requests WHERE status='pending' AND reservation_date >= (now() AT TIME ZONE 'Europe/Bratislava')::date
 ) occupied
 WHERE NOT EXISTS(SELECT 1 FROM public.portal_day_settings s WHERE s.day=occupied.day)
 GROUP BY day HAVING count(*)>p_capacity ORDER BY day LIMIT 1;
 IF v_day IS NOT NULL THEN RAISE EXCEPTION 'Dňa % je už obsadených % miest. Kapacitu nemožno znížiť pod tento počet.',v_day,v_occupied; END IF;
 INSERT INTO public.app_settings(setting_key,setting_value,updated_at) VALUES('daycare_default_capacity',p_capacity::text,now())
 ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at;
 RETURN p_capacity;
END $$;
REVOKE ALL ON FUNCTION public.portal_set_default_capacity_v322(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_set_default_capacity_v322(integer) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.portal_approve_booking_group_v244(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE q public.customer_booking_requests%rowtype; own bigint; out_rows jsonb:='[]';
BEGIN
 PERFORM pg_advisory_xact_lock_shared(hashtextextended('default-capacity-v322',7241));
 IF NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 SELECT * INTO q FROM public.customer_booking_requests WHERE booking_group_id=p_group_id ORDER BY id LIMIT 1;
 IF q.id IS NULL THEN RAISE EXCEPTION 'Spoločná rezervácia sa nenašla.'; END IF;
 own:=private.lock_pool_v244(q.dog_id);
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status NOT IN ('pending','approved','cancelled','rejected')) THEN RAISE EXCEPTION 'Spoločná rezervácia vyžaduje kontrolu personálom.'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status='pending') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtextextended(q.reservation_date::text,7241));
  IF EXISTS(SELECT 1 FROM public.portal_day_settings WHERE day=q.reservation_date AND NOT bookings_open) OR
   ((SELECT count(*) FROM public.reservations WHERE reservation_date=q.reservation_date AND status='booked')+
    (SELECT count(*) FROM public.customer_booking_requests WHERE reservation_date=q.reservation_date AND status='pending'))>
    coalesce((SELECT capacity FROM public.portal_day_settings WHERE day=q.reservation_date),private.daycare_default_capacity_v322()) THEN
    RAISE EXCEPTION 'Kapacita alebo dostupnosť dňa sa zmenila. Overte rezervácie pred schválením.';
  END IF;
 END IF;
 PERFORM set_config('chvostikovo.group_approval_v244','1',true);
 FOR q IN SELECT * FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status IN ('pending','approved') ORDER BY dog_id FOR UPDATE LOOP
  IF NOT private.owns_dog_v244(q.user_id,q.dog_id) THEN RAISE EXCEPTION 'Oprávnenie rezervovať psíka sa zmenilo.'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(ARRAY['rabies','infectious','kennel_cough']) typ WHERE NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type=typ AND v.valid_until>=q.reservation_date))
   OR EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=q.dog_id AND (s.requires_proof_after_id IS NOT NULL OR s.vaccination_type='lepto_l4' AND NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type='lepto_l4' AND v.valid_until>=q.reservation_date))) THEN RAISE EXCEPTION 'Očkovanie niektorého psíka vyžaduje kontrolu.'; END IF;
  SELECT * INTO q FROM public.portal_approve_booking(q.id,NULL);
  out_rows:=out_rows||to_jsonb(q);
 END LOOP;
 PERFORM set_config('chvostikovo.group_approval_v244','',true);
 RETURN out_rows;
END $function$
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
  v_capacity integer := private.daycare_default_capacity_v322();
  v_taken integer := 0;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
  v_row public.customer_booking_requests%rowtype;
  v_taxi_mode text := coalesce(nullif(btrim(p_taxi_mode), ''), 'none');
  v_taxi_amount numeric(10,2);
  v_default_entry_type text;
begin
  perform pg_advisory_xact_lock_shared(hashtextextended('default-capacity-v322',7241));
  perform private.lock_pool_v244(p_dog_id);
  if private.shared_dog_v244(p_dog_id) and current_setting('chvostikovo.shared_quote_v257',true) is distinct from '1' then raise exception 'Obnovte aplikáciu a skontrolujte rozdelenie vstupov spoločnej permanentky.';end if;
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
  join public.dogs d on d.owner_id = l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
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

  select coalesce(s.capacity, private.daycare_default_capacity_v322()) into v_capacity
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

CREATE OR REPLACE FUNCTION public.portal_set_day_closed(p_day date, p_closed boolean, p_note text DEFAULT NULL::text)
 RETURNS portal_day_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_row public.portal_day_settings%rowtype;
begin
  if v_staff is null or not exists (
    select 1
    from public.staff s
    where s.user_id = v_staff
      and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  if p_day is null or p_closed is null then
    raise exception 'Vyberte platný dátum.';
  end if;

  insert into public.portal_day_settings(day, capacity, bookings_open, note, updated_at)
  values (
    p_day,
    private.daycare_default_capacity_v322(),
    not p_closed,
    case when p_closed then coalesce(nullif(btrim(p_note), ''), 'Zatvorené') else null end,
    now()
  )
  on conflict (day) do update
    set bookings_open = excluded.bookings_open,
        note = excluded.note,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$function$
;
DO $seed$ BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended('default-capacity-v322',7241));
IF EXISTS(SELECT 1 FROM (SELECT reservation_date FROM public.reservations WHERE status='booked' UNION ALL SELECT reservation_date FROM public.customer_booking_requests WHERE status='pending') occupied WHERE reservation_date >= (now() AT TIME ZONE 'Europe/Bratislava')::date AND NOT EXISTS(SELECT 1 FROM public.portal_day_settings s WHERE s.day=occupied.reservation_date) GROUP BY reservation_date HAVING count(*)>10) THEN RAISE EXCEPTION 'Occupancy exceeds initial 10';END IF;
INSERT INTO public.app_settings(setting_key,setting_value,updated_at) VALUES('daycare_default_capacity','10',now());
END $seed$;
COMMIT;