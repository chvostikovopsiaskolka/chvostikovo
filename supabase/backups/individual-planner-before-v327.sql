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
         OR (r.source='customer_portal' AND v_interest.id IS NOT NULL AND r.entry_type='single'))
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
