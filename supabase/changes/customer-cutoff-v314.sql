CREATE OR REPLACE FUNCTION public.portal_cancel_booking(p_request_id bigint, p_reason text DEFAULT NULL::text)
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
  v_reason text := nullif(left(btrim(coalesce(p_reason,'')),500),'');
begin
  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select * into v_row from public.customer_booking_requests
  where id=p_request_id and user_id=v_uid for update;
  if v_row.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_row.reservation_date-1)::timestamp + time '19:00';
  if v_now_local >= v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
  end if;
  if v_row.status not in ('pending','approved') then raise exception 'Túto rezerváciu už nie je možné zrušiť.'; end if;
  if v_row.status='approved' and v_row.reservation_id is not null then
    update public.reservations set status='cancelled' where id=v_row.reservation_id and status='booked';
  end if;
  update public.customer_booking_requests set status='cancelled',cancellation_reason=v_reason,cancelled_at=now()
  where id=p_request_id returning * into v_row;
  perform private.replan_dog_reservations(v_row.dog_id,v_now_local::date);
  return v_row;
end;
$function$;


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
  perform private.lock_pool_v244((select dog_id from public.reservations where id=p_reservation_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select r.* into v_reservation from public.reservations r
  join public.dogs d on d.id=r.dog_id
  join public.customer_owner_links l on l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
  where r.id=p_reservation_id and r.status='booked' and l.user_id=v_uid for update of r;
  if v_reservation.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_reservation.reservation_date-1)::timestamp + time '19:00';
  if v_now_local >= v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
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

