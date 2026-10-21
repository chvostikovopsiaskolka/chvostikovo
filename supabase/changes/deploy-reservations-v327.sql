DO $guard$ BEGIN
 IF md5(pg_get_functiondef('private.replan_individual_v243(bigint,date)'::regprocedure))<>'f91955c156ce686ac99299448ec1dd15' THEN
  RAISE EXCEPTION 'Individual planner baseline changed';
 END IF;
END $guard$;
CREATE TABLE private.customer_reservation_rollback_v327(key text PRIMARY KEY,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.customer_reservation_rollback_v327 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.customer_reservation_rollback_v327 FROM PUBLIC,anon,authenticated;
INSERT INTO private.customer_reservation_rollback_v327(key,payload) VALUES('planner_before',to_jsonb(pg_get_functiondef('private.replan_individual_v243(bigint,date)'::regprocedure)));
INSERT INTO private.customer_reservation_rollback_v327(key,payload)
SELECT 'bella_before',jsonb_build_object('reservations',(SELECT jsonb_agg(to_jsonb(r)) FROM public.reservations r WHERE r.id IN(419,420) AND r.dog_id=77),'passes',(SELECT jsonb_agg(to_jsonb(p)) FROM public.passes p WHERE p.id=63 AND p.dog_id=77),'requests',(SELECT jsonb_agg(to_jsonb(q)) FROM public.customer_booking_requests q WHERE q.dog_id=77 AND q.reservation_date>='2026-10-21'));
CREATE OR REPLACE FUNCTION private.replan_individual_v243(p_dog_id bigint, p_from_date date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_from date := greatest(coalesce(p_from_date,(clock_timestamp() at time zone 'Europe/Bratislava')::date),date '2026-08-25');
  v_interest public.customer_pass_requests%rowtype;
  v_assign jsonb := '{}'::jsonb;
  v_virtual integer := 0;
  v_current integer;
  v_number integer;
  v_pass public.passes%rowtype;
  v_row record;
  v_type text;
  v_total integer;
  v_default_type text;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(p_dog_id);
  SELECT default_entry_type INTO v_default_type FROM public.dogs WHERE id=p_dog_id;
  IF v_default_type='free' THEN
    UPDATE public.customer_booking_requests SET projected_entry_number=NULL,projected_pass_total=NULL,planned_pass_request_id=NULL
     WHERE dog_id=p_dog_id AND status='pending'
       AND (projected_entry_number IS NOT NULL OR projected_pass_total IS NOT NULL OR planned_pass_request_id IS NOT NULL);
    RETURN;
  END IF;
  PERFORM private.ensure_current_pass(p_dog_id);
  SELECT * INTO v_interest FROM public.customer_pass_requests
   WHERE dog_id=p_dog_id AND status='pending'
   ORDER BY requested_at,id LIMIT 1;
  -- Include pending requests in the same chronological ledger as booked visits.
  -- A pending interest has no pass row, price, or usage.
  FOR v_row IN
    SELECT 'reservation' AS kind,r.id,r.reservation_date,r.entry_type,
           r.pass_locked,r.pass_id,r.source_label,r.source_ref
      FROM public.reservations r
     WHERE r.dog_id=p_dog_id AND r.status='booked' AND r.reservation_date>=v_from
       AND (r.entry_type='pass'
         OR r.source_label='Čaká na kúpu permanentky'
         OR (r.source='customer_portal' AND r.entry_type='single'
             AND (r.billing_choice='auto' OR v_interest.id IS NOT NULL)))
    UNION ALL
    SELECT 'request',q.id,q.reservation_date,NULL::text,false,NULL::bigint,NULL::text,NULL::text
      FROM public.customer_booking_requests q
     WHERE q.dog_id=p_dog_id AND q.status='pending' AND q.reservation_date>=v_from
    ORDER BY reservation_date,kind,id
  LOOP
    v_pass := NULL;
    v_type := null;
    IF v_row.kind='reservation' AND v_row.pass_locked AND v_row.pass_id IS NOT NULL THEN
      SELECT * INTO v_pass FROM public.passes WHERE id=v_row.pass_id AND dog_id=p_dog_id;
    ELSE
      SELECT * INTO v_pass FROM public.passes pp
       WHERE pp.dog_id=p_dog_id AND pp.status IN ('active','queued')
         AND pp.used_entries<pp.total_entries
         AND (pp.valid_from IS NULL OR pp.valid_from<=v_row.reservation_date)
         AND (coalesce(pp.no_expiry,false) OR pp.valid_until IS NULL OR pp.valid_until>=v_row.reservation_date)
         AND coalesce((v_assign->>(pp.id::text))::integer,pp.used_entries)<pp.total_entries
       ORDER BY CASE WHEN pp.status='active' THEN 0 ELSE 1 END,
                coalesce(pp.valid_from,pp.purchased_on,date '1900-01-01'),pp.created_at,pp.id
       LIMIT 1;
    END IF;
    IF v_pass.id IS NOT NULL THEN
      v_current := coalesce((v_assign->>(v_pass.id::text))::integer,v_pass.used_entries);
      v_number := CASE WHEN v_row.pass_locked AND v_row.kind='reservation'
                      THEN greatest(v_current+1,coalesce((SELECT planned_entry_number FROM public.reservations WHERE id=v_row.id),0))
                      ELSE v_current+1 END;
      IF v_number<=v_pass.total_entries THEN
        v_assign := jsonb_set(v_assign,ARRAY[v_pass.id::text],to_jsonb(v_number),true);
        v_type := 'pass';
        v_total := v_pass.total_entries;
      END IF;
    END IF;
    IF v_type IS NULL AND v_interest.id IS NOT NULL AND v_virtual<v_interest.total_entries THEN
      v_virtual := v_virtual+1;
      v_number := v_virtual;
      v_total := v_interest.total_entries;
      v_type := 'unpaid';
    END IF;
    IF v_row.kind='request' THEN
      UPDATE public.customer_booking_requests
         SET projected_entry_number=CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
             projected_pass_total=CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
             planned_pass_request_id=CASE WHEN v_type='unpaid' THEN v_interest.id ELSE NULL END
       WHERE id=v_row.id
         AND (projected_entry_number,projected_pass_total,planned_pass_request_id)
             IS DISTINCT FROM
             (CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
              CASE WHEN v_type='unpaid' THEN v_interest.id ELSE NULL END);
    ELSIF NOT v_row.pass_locked THEN
      UPDATE public.reservations
         SET entry_type=CASE WHEN v_type='pass' THEN 'pass' ELSE 'single' END,
             pass_id=CASE WHEN v_type='pass' THEN v_pass.id ELSE NULL END,
             planned_entry_number=CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
             planned_pass_total=CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
             source_label=CASE WHEN v_type='unpaid' THEN 'Čaká na kúpu permanentky'
                               WHEN source_label='Čaká na kúpu permanentky' THEN NULL ELSE source_label END
       WHERE id=v_row.id
         AND (entry_type,pass_id,planned_entry_number,planned_pass_total,source_label)
             IS DISTINCT FROM
             (CASE WHEN v_type='pass' THEN 'pass' ELSE 'single' END,
              CASE WHEN v_type='pass' THEN v_pass.id ELSE NULL END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
              CASE WHEN v_type='unpaid' THEN 'Čaká na kúpu permanentky'
                    WHEN v_row.source_label='Čaká na kúpu permanentky' THEN NULL ELSE v_row.source_label END);
    END IF;
  END LOOP;
  -- Keep already approved customer cards in step with the reservation ledger,
  -- including purchase confirmation or a handled interest without a purchase.
  UPDATE public.customer_booking_requests q
     SET projected_entry_number=r.planned_entry_number,
         projected_pass_total=r.planned_pass_total,
         planned_pass_request_id=CASE WHEN r.source_label='Čaká na kúpu permanentky'
                                      THEN v_interest.id ELSE NULL END
    FROM public.reservations r
   WHERE q.dog_id=p_dog_id AND q.status='approved' AND q.reservation_id=r.id
     AND r.reservation_date>=v_from AND r.status='booked'
     AND (q.projected_entry_number,q.projected_pass_total,q.planned_pass_request_id)
         IS DISTINCT FROM
         (r.planned_entry_number,r.planned_pass_total,
          CASE WHEN r.source_label='Čaká na kúpu permanentky' THEN v_interest.id ELSE NULL END);
END
$function$;


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
