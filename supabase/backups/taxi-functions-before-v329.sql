CREATE OR REPLACE FUNCTION private.apply_taxi_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_mode text;
begin
  v_mode := coalesce(new.taxi_mode,new.taxi_service,'none');
  new.taxi_amount := case v_mode
    when 'pickup' then 5.00
    when 'pickup_dropoff' then 10.00
    when 'roundtrip' then 10.00
    else 0.00
  end;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_reservation_taxi()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_mode text := 'none';
begin
  if tg_op = 'INSERT' then
    if coalesce(new.taxi_mode, 'none') <> 'none' then
      v_mode := new.taxi_mode;
    elsif coalesce(new.taxi_service, 'none') <> 'none' then
      v_mode := case new.taxi_service
        when 'roundtrip' then 'pickup_dropoff'
        when 'pickup' then 'pickup'
        else 'none'
      end;
    end if;
  elsif new.taxi_mode is distinct from old.taxi_mode then
    v_mode := coalesce(new.taxi_mode, 'none');
  elsif new.taxi_service is distinct from old.taxi_service then
    v_mode := case new.taxi_service
      when 'roundtrip' then 'pickup_dropoff'
      when 'pickup' then 'pickup'
      else 'none'
    end;
  elsif coalesce(new.taxi_mode, 'none') <> 'none' then
    v_mode := new.taxi_mode;
  elsif coalesce(new.taxi_service, 'none') <> 'none' then
    v_mode := case new.taxi_service
      when 'roundtrip' then 'pickup_dropoff'
      when 'pickup' then 'pickup'
      else 'none'
    end;
  end if;

  new.taxi_mode := case
    when v_mode = 'pickup_dropoff' then 'pickup_dropoff'
    when v_mode = 'pickup' then 'pickup'
    else 'none'
  end;
  new.taxi_service := case
    when new.taxi_mode = 'pickup_dropoff' then 'roundtrip'
    when new.taxi_mode = 'pickup' then 'pickup'
    else 'none'
  end;
  new.taxi_amount := case
    when new.taxi_mode = 'pickup_dropoff' then 10
    when new.taxi_mode = 'pickup' then 5
    else 0
  end;
  return new;
end;
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.portal_request_bookings_batch(p_dog_id bigint, p_bookings jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_item jsonb;
  v_date_text text;
  v_date date;
  v_taxi text;
  v_row public.customer_booking_requests%rowtype;
  v_results jsonb := '[]'::jsonb;
  v_failures jsonb := '[]'::jsonb;
  v_dates text[] := ARRAY[]::text[];
  v_n int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF p_dog_id IS NULL OR p_dog_id < 1 OR jsonb_typeof(p_bookings) <> 'array' THEN
    RAISE EXCEPTION 'Vyberte psíka a dni rezervácie.';
  END IF;
  v_n := jsonb_array_length(p_bookings);
  IF v_n < 1 OR v_n > 15 THEN RAISE EXCEPTION 'Naraz je možné rezervovať 1 až 15 dní.'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_bookings)
  LOOP
    v_date_text := v_item->>'date';
    BEGIN
      IF v_date_text IS NULL OR v_date_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Neplatný dátum rezervácie.';
      END IF;
      v_date := v_date_text::date;
      v_taxi := coalesce(v_item->>'taxi_mode','none');
      IF v_taxi NOT IN ('none','pickup','pickup_dropoff') THEN
        RAISE EXCEPTION 'Neplatná voľba taxi.';
      END IF;
      PERFORM set_config('chvostikovo.booking_batch','1',true);
      v_row := public.portal_request_booking(p_dog_id,v_date,v_taxi);
      v_results := v_results || to_jsonb(v_row);
      v_dates := array_append(v_dates,v_date::text);
    EXCEPTION WHEN OTHERS THEN
      v_failures := v_failures || jsonb_build_object(
        'date',coalesce(v_date_text,''),'error',SQLERRM
      );
    END;
  END LOOP;
  PERFORM set_config('chvostikovo.booking_batch','0',true);
  IF array_length(v_dates,1) > 0 THEN
    BEGIN
      INSERT INTO private.booking_batch_push_events(dog_id,day_count,dates)
      VALUES (p_dog_id,array_length(v_dates,1),v_dates);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Booking saved, batch push failed (error omitted)';
    END;
  END IF;
  RETURN jsonb_build_object('bookings',v_results,'failed',v_failures);
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_shared_booking_v244(p_items jsonb, p_operation_id uuid, p_expected jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE own bigint; ids bigint[]; payload jsonb; quote jsonb; result jsonb; row public.customer_booking_requests%rowtype; item jsonb; op private.shared_operations_v244%rowtype; day date; old_guard text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF NOT coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false) THEN RAISE EXCEPTION 'Spoločné permanentky a rezervácie ešte nie sú sprístupnené.'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Vyberte psíkov a dni.'; END IF;
 SELECT array_agg(DISTINCT (value->>'dog_id')::bigint ORDER BY (value->>'dog_id')::bigint) INTO ids FROM jsonb_array_elements(p_items);
 IF cardinality(ids) NOT BETWEEN 1 AND 2 OR (SELECT count(DISTINCT (value->>'dog_id',value->>'date')) FROM jsonb_array_elements(p_items))<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Neplatný alebo duplicitný výber.'; END IF;
 own:=private.lock_pool_v244(ids[1]);
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT private.owns_dog_v244(auth.uid(),x)) OR
 (SELECT count(*) FROM public.dogs WHERE id=ANY(ids) AND owner_id=own)<>cardinality(ids) THEN RAISE EXCEPTION 'Psík nie je priradený k vášmu účtu.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF coalesce(item->>'billing_choice','auto') NOT IN ('auto','single','planned') OR coalesce(item->>'taxi_mode','none') NOT IN ('none','pickup','pickup_dropoff') THEN RAISE EXCEPTION 'Neplatný spôsob účtovania alebo taxi.'; END IF;
 END LOOP;
 payload:=p_items;
 IF p_operation_id IS NOT NULL THEN
  SELECT * INTO op FROM private.shared_operations_v244 WHERE user_id=auth.uid() AND operation_id=p_operation_id;
  IF op.operation_id IS NOT NULL THEN
   IF op.kind<>'booking' OR op.payload<>payload THEN RAISE EXCEPTION 'Identifikátor bol použitý pre inú rezerváciu.'; END IF;
   RETURN op.result;
  END IF;
 END IF;
 FOR day IN SELECT DISTINCT (value->>'date')::date FROM jsonb_array_elements(p_items) ORDER BY 1 LOOP
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtextextended(day::text,7241));
 END LOOP;
 SELECT coalesce(jsonb_agg(value ORDER BY (value->>'date'),(value->>'dog_id')::bigint),'[]') INTO quote
 FROM jsonb_array_elements(private.shared_plan_v244(own,p_items)) WHERE value->>'kind'='extra';
 IF p_expected IS NULL THEN RETURN jsonb_build_object('quote',quote,'committed',false); END IF;
 IF p_operation_id IS NULL OR p_expected<>quote THEN RAISE EXCEPTION 'Dostupné vstupy sa zmenili. Skontrolujte nové rozdelenie a potvrďte ho znova.'; END IF;
 PERFORM set_config('chvostikovo.shared_quote_v257','1',true);
 -- All inserts share one transaction. Any validation failure rolls back every dog and day.
 old_guard:=current_setting('chvostikovo.booking_batch',true);
 PERFORM set_config('chvostikovo.booking_batch','1',true);
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'date',(value->>'dog_id')::bigint LOOP
  SELECT * INTO row FROM public.portal_request_booking((item->>'dog_id')::bigint,(item->>'date')::date,coalesce(item->>'taxi_mode','none'));
  UPDATE public.customer_booking_requests SET billing_choice=coalesce(item->>'billing_choice','auto'),booking_group_id=CASE WHEN cardinality(ids)=2 THEN md5(p_operation_id::text||(item->>'date'))::uuid ELSE NULL END WHERE id=row.id;
 END LOOP;
 PERFORM private.apply_shared_plan_v244(own);
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.reservation_date,q.dog_id),'[]') INTO result
 FROM public.customer_booking_requests q WHERE q.user_id=auth.uid() AND q.status='pending'
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) e WHERE q.dog_id=(e->>'dog_id')::bigint AND q.reservation_date=(e->>'date')::date);
 INSERT INTO private.booking_batch_push_events(dog_id,day_count,dates,dog_ids) SELECT ids[1],count(DISTINCT value->>'date')::smallint,array_agg(DISTINCT value->>'date' ORDER BY value->>'date'),ids FROM jsonb_array_elements(p_items);
 result:=jsonb_build_object('bookings',result,'quote',quote,'committed',true);
 INSERT INTO private.shared_operations_v244(user_id,operation_id,kind,payload,result) VALUES(auth.uid(),p_operation_id,'booking',payload,result);
 PERFORM set_config('chvostikovo.booking_batch',coalesce(old_guard,''),true);
 PERFORM set_config('chvostikovo.shared_quote_v257','',true);
 RETURN result;
END $function$;

CREATE OR REPLACE FUNCTION public.portal_request_reservation_taxi_v327(p_reservation_id bigint, p_taxi_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_dog_id bigint;
  v_res public.reservations%rowtype;
  v_row public.customer_booking_requests%rowtype;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF p_taxi_mode NOT IN ('pickup','pickup_dropoff') OR p_taxi_mode IS NULL THEN
    RAISE EXCEPTION 'Vyberte možnosť taxi.';
  END IF;
  SELECT dog_id INTO v_dog_id FROM public.reservations WHERE id=p_reservation_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id
      AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
    JOIN public.customer_profiles p ON p.user_id=l.user_id AND p.status='active'
    WHERE d.id=v_dog_id AND l.user_id=v_uid
  ) THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
  PERFORM private.lock_pool_v244(v_dog_id);
  PERFORM q.id FROM public.customer_booking_requests q WHERE q.reservation_id=p_reservation_id
    ORDER BY q.id FOR UPDATE NOWAIT;
  SELECT * INTO v_res FROM public.reservations WHERE id=p_reservation_id AND dog_id=v_dog_id FOR UPDATE NOWAIT;
  IF v_res.id IS NULL OR v_res.status<>'booked' THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
  IF (now() AT TIME ZONE 'Europe/Bratislava') >= (v_res.reservation_date-1)::timestamp+time '19:00' THEN
    RAISE EXCEPTION 'Taxi je možné doplniť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
  END IF;
  SELECT * INTO v_row FROM public.customer_booking_requests WHERE reservation_id=v_res.id
    AND status='approved' AND taxi_change_status='pending' ORDER BY id LIMIT 1;
  IF v_row.id IS NOT NULL THEN
    IF v_row.requested_taxi_mode=p_taxi_mode THEN
      RETURN jsonb_build_object('id',v_row.id,'dog_id',v_row.dog_id,'reservation_date',v_row.reservation_date,'reservation_id',v_row.reservation_id,'status',v_row.status,'taxi_mode',v_row.taxi_mode,'taxi_amount',v_row.taxi_amount,'taxi_change_status',v_row.taxi_change_status,'requested_taxi_mode',v_row.requested_taxi_mode,'projected_entry_number',v_row.projected_entry_number,'projected_pass_total',v_row.projected_pass_total,'can_manage',v_row.user_id=v_uid);
    END IF;
    RAISE EXCEPTION 'Zmena taxi už čaká na schválenie.';
  END IF;
  IF coalesce(v_res.taxi_mode,'none') NOT IN ('none','pickup') OR v_res.taxi_mode=p_taxi_mode THEN
    RAISE EXCEPTION 'Táto možnosť taxi už je pri rezervácii uložená.';
  END IF;
  SELECT * INTO v_row FROM public.customer_booking_requests WHERE reservation_id=v_res.id
    AND status='approved' ORDER BY id LIMIT 1;
  IF v_row.id IS NULL THEN
    INSERT INTO public.customer_booking_requests(user_id,dog_id,reservation_date,status,reservation_id,
      projected_entry_number,projected_pass_total,taxi_mode,taxi_amount,billing_choice)
    VALUES(v_uid,v_res.dog_id,v_res.reservation_date,'approved',v_res.id,
      v_res.planned_entry_number,v_res.planned_pass_total,coalesce(v_res.taxi_mode,'none'),coalesce(v_res.taxi_amount,0),coalesce(v_res.billing_choice,'auto'))
    RETURNING * INTO v_row;
  END IF;
  -- Preserve the existing canonical request, including its original owner and group.
  -- The normal pending-taxi trigger and staff approval workflow are reused.
  UPDATE public.customer_booking_requests SET requested_taxi_mode=p_taxi_mode,
    requested_taxi_amount=CASE WHEN p_taxi_mode='pickup' THEN 5 ELSE 10 END,
    taxi_change_status='pending',taxi_change_requested_at=now(),taxi_change_decided_at=NULL,
    taxi_change_decided_by=NULL,taxi_change_note=NULL WHERE id=v_row.id RETURNING * INTO v_row;
  RETURN jsonb_build_object('id',v_row.id,'dog_id',v_row.dog_id,'reservation_date',v_row.reservation_date,'reservation_id',v_row.reservation_id,'status',v_row.status,'taxi_mode',v_row.taxi_mode,'taxi_amount',v_row.taxi_amount,'taxi_change_status',v_row.taxi_change_status,'requested_taxi_mode',v_row.requested_taxi_mode,'projected_entry_number',v_row.projected_entry_number,'projected_pass_total',v_row.projected_pass_total,'can_manage',v_row.user_id=v_uid);
EXCEPTION WHEN lock_not_available OR deadlock_detected THEN
  RAISE EXCEPTION 'Rezervácia sa práve aktualizuje. Skúste to znova.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_request_taxi_change(p_request_id bigint, p_taxi_mode text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.customer_booking_requests%rowtype;
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_amount numeric(10,2);
begin
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if p_taxi_mode not in ('pickup','pickup_dropoff') then
    raise exception 'Vyberte vyzdvihnutie alebo vyzdvihnutie aj dovoz.';
  end if;
  v_amount := case when p_taxi_mode='pickup' then 5 else 10 end;

  select * into v_row
  from public.customer_booking_requests
  where id=p_request_id and user_id=v_uid
  for update;

  if v_row.id is null or v_row.status <> 'approved' or v_row.reservation_id is null then
    raise exception 'Schválená rezervácia sa nenašla.';
  end if;
  if v_row.taxi_change_status = 'pending' then
    raise exception 'Zmena taxi už čaká na schválenie.';
  end if;
  v_deadline := (v_row.reservation_date-1)::timestamp + time '19:00';
  if v_now_local >= v_deadline then
    raise exception 'Taxi je možné doplniť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
  end if;
  if v_row.taxi_mode = p_taxi_mode then
    raise exception 'Táto možnosť taxi už je pri rezervácii uložená.';
  end if;
  if v_row.taxi_mode = 'pickup_dropoff' then
    raise exception 'Rezervácia už obsahuje vyzdvihnutie aj dovoz.';
  end if;
  if v_row.taxi_mode = 'pickup' and p_taxi_mode <> 'pickup_dropoff' then
    raise exception 'K existujúcemu vyzdvihnutiu môžete doplniť už len dovoz.';
  end if;

  update public.customer_booking_requests
  set requested_taxi_mode=p_taxi_mode,
      requested_taxi_amount=v_amount,
      taxi_change_status='pending',
      taxi_change_requested_at=now(),
      taxi_change_decided_at=null,
      taxi_change_decided_by=null,
      taxi_change_note=null
  where id=v_row.id
  returning * into v_row;

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.portal_approve_taxi_change(p_request_id bigint, p_decision_note text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_row public.customer_booking_requests%rowtype;
  v_taxi_service text;
begin
  if not exists (
    select 1 from public.staff s where s.user_id=v_staff and s.active=true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_row
  from public.customer_booking_requests
  where id=p_request_id
  for update;

  if v_row.id is null or v_row.status <> 'approved' or
     v_row.taxi_change_status <> 'pending' or v_row.reservation_id is null then
    raise exception 'Čakajúca zmena taxi sa nenašla.';
  end if;

  v_taxi_service := case when v_row.requested_taxi_mode='pickup_dropoff'
    then 'roundtrip' else v_row.requested_taxi_mode end;

  update public.reservations
  set taxi_mode=v_row.requested_taxi_mode,
      taxi_service=v_taxi_service,
      taxi_amount=v_row.requested_taxi_amount
  where id=v_row.reservation_id and status='booked';

  if not found then raise exception 'Aktívna rezervácia sa nenašla.'; end if;

  update public.customer_booking_requests
  set taxi_mode=requested_taxi_mode,
      taxi_amount=requested_taxi_amount,
      taxi_change_status='approved',
      taxi_change_decided_at=now(),
      taxi_change_decided_by=v_staff,
      taxi_change_note=nullif(left(btrim(coalesce(p_decision_note,'')),500),'')
  where id=v_row.id
  returning * into v_row;

  insert into public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id
  ) values (
    v_row.user_id,'taxi_change_approved','Taxi bolo schválené',
    case v_row.taxi_mode
      when 'pickup' then 'K rezervácii na '||to_char(v_row.reservation_date,'DD.MM.YYYY')||' sme pridali vyzdvihnutie ráno / dovoz domov (+5 €).'
      else 'K rezervácii na '||to_char(v_row.reservation_date,'DD.MM.YYYY')||' sme pridali vyzdvihnutie aj dovoz (+10 €).'
    end,
    'booking_request',v_row.id
  );

  return v_row;
end;
$function$;

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
 JOIN public.customer_owner_links link ON link.owner_id=d.owner_id AND (link.allowed_dog_ids IS NULL OR d.id=ANY(link.allowed_dog_ids))
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
$function$;