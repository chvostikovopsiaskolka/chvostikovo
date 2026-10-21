CREATE FUNCTION public.portal_request_reservation_taxi_v327(p_reservation_id bigint,p_taxi_mode text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
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
REVOKE ALL ON FUNCTION public.portal_request_reservation_taxi_v327(bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_request_reservation_taxi_v327(bigint,text) TO authenticated,service_role;
