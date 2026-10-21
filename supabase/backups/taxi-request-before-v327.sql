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
$function$

