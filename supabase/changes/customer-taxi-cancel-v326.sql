-- Additive, owner-scoped taxi cancellation. No booking/pass/capacity mutation.
CREATE FUNCTION public.portal_cancel_taxi_v326(p_request_id bigint DEFAULT NULL, p_reservation_id bigint DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_dog_id bigint;
  v_res_id bigint;
  v_q public.customer_booking_requests%rowtype;
  v_res public.reservations%rowtype;
  v_date date;
  v_name text;
  v_changed boolean := false;
  v_now timestamp := now() AT TIME ZONE 'Europe/Bratislava';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF (p_request_id IS NULL) = (p_reservation_id IS NULL) THEN
    RAISE EXCEPTION 'Vyberte jednu rezerváciu.';
  END IF;
  IF p_request_id IS NOT NULL THEN
    SELECT dog_id INTO v_dog_id FROM public.customer_booking_requests WHERE id=p_request_id;
  ELSE
    SELECT dog_id INTO v_dog_id FROM public.reservations WHERE id=p_reservation_id;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.dogs d
    JOIN public.customer_owner_links l ON l.owner_id=d.owner_id
      AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
    JOIN public.customer_profiles p ON p.user_id=l.user_id AND p.status='active'
    WHERE d.id=v_dog_id AND l.user_id=v_uid
  ) THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
  PERFORM private.lock_pool_v244(v_dog_id);
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_q FROM public.customer_booking_requests
      WHERE id=p_request_id AND dog_id=v_dog_id AND user_id=v_uid FOR UPDATE;
    IF v_q.id IS NULL OR v_q.status NOT IN ('pending','approved') THEN
      RAISE EXCEPTION 'Rezervácia sa nenašla.';
    END IF;
    v_res_id := v_q.reservation_id;
    v_date := v_q.reservation_date;
  ELSE
    v_res_id := p_reservation_id;
  END IF;
  IF v_res_id IS NOT NULL THEN
    SELECT * INTO v_res FROM public.reservations WHERE id=v_res_id AND dog_id=v_dog_id FOR UPDATE;
    IF v_res.id IS NULL OR v_res.status <> 'booked' THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
    v_date := v_res.reservation_date;
  ELSIF v_q.status <> 'pending' THEN
    RAISE EXCEPTION 'Rezervácia sa nenašla.';
  END IF;
  IF v_now >= (v_date-1)::timestamp + time '19:00' THEN
    RAISE EXCEPTION 'Taxík je možné zrušiť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
  END IF;
  v_changed := coalesce(v_res.taxi_mode,'none') <> 'none'
    OR coalesce(v_q.taxi_mode,'none') <> 'none' OR v_q.taxi_change_status='pending'
    OR EXISTS (SELECT 1 FROM public.customer_booking_requests q WHERE q.reservation_id=v_res_id
      AND q.status='approved' AND (q.taxi_mode<>'none' OR q.taxi_change_status='pending'));
  IF coalesce(v_changed,false) THEN
    IF v_res_id IS NOT NULL THEN
      UPDATE public.reservations SET taxi_mode='none',taxi_service='none',taxi_amount=0 WHERE id=v_res_id;
    END IF;
    UPDATE public.customer_booking_requests
      SET taxi_mode='none',taxi_amount=0,requested_taxi_mode=NULL,requested_taxi_amount=NULL,
          taxi_change_status=NULL,taxi_change_requested_at=NULL,taxi_change_decided_at=now(),
          taxi_change_decided_by=v_uid,taxi_change_note='Taxík zrušil zákazník'
      WHERE (id=p_request_id OR reservation_id=v_res_id) AND status IN ('pending','approved');
    SELECT name INTO v_name FROM public.dogs WHERE id=v_dog_id;
    INSERT INTO public.portal_notifications(recipient_user_id,notification_type,title,body,entity_type,entity_id)
      SELECT DISTINCT s.user_id,'taxi_cancelled_admin','Taxík bol zrušený',
        'Používateľ zrušil taxík pre '||coalesce(v_name,'psíka')||' na '||to_char(v_date,'DD.MM.YYYY')||'. Rezervácia škôlky zostáva platná.',
        CASE WHEN v_res_id IS NOT NULL THEN 'reservation' ELSE 'booking_request' END,
        coalesce(v_res_id,p_request_id)
      FROM public.staff s WHERE s.active=true AND s.user_id IS NOT NULL;
  END IF;
  RETURN jsonb_build_object('reservation_id',v_res_id,'request_id',p_request_id,'changed',coalesce(v_changed,false));
END;
$function$;
REVOKE ALL ON FUNCTION public.portal_cancel_taxi_v326(bigint,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portal_cancel_taxi_v326(bigint,bigint) TO authenticated, service_role;
