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
$function$;


CREATE OR REPLACE FUNCTION public.portal_request_late_booking(p_dog_id bigint, p_reservation_date date, p_message text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $late$
DECLARE
  v_uid uuid := (select auth.uid());
  v_booking public.customer_booking_requests%rowtype;
  v_conversation_id bigint;
  v_message public.portal_messages%rowtype;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF char_length(btrim(coalesce(p_message,''))) < 1 OR char_length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Napíšte správu s dĺžkou najviac 2000 znakov.';
  END IF;
  PERFORM set_config('chvostikovo.late_request','1',true);
  v_booking := public.portal_request_booking(p_dog_id,p_reservation_date,'none');
  INSERT INTO public.portal_conversations(customer_user_id)
    VALUES (v_uid)
    ON CONFLICT (customer_user_id) DO UPDATE SET updated_at=now()
    RETURNING id INTO v_conversation_id;
  INSERT INTO public.portal_messages(conversation_id,sender_user_id,sender_role,body,booking_request_id)
    VALUES (v_conversation_id,v_uid,'customer',btrim(p_message),v_booking.id)
    RETURNING * INTO v_message;
  RETURN jsonb_build_object('booking',to_jsonb(v_booking),'message',to_jsonb(v_message));
END;
$late$;
REVOKE ALL ON FUNCTION public.portal_request_late_booking(bigint,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portal_request_late_booking(bigint,date,text) TO authenticated;
