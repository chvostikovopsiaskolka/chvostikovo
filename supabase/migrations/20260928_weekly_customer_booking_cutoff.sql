-- Keep the existing booking, capacity and pass planner; replace only its deadline.
ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS booking_late_exception boolean NOT NULL DEFAULT false;

DO $migration$
DECLARE
  definition text;
  old_deadline text := $old$v_deadline := (p_reservation_date - 1)::timestamp + time '21:00';
  if v_now_local > v_deadline then
    raise exception 'Rezervácia sa uzavrela deň vopred o 21:00.';
  end if;$old$;
  old_owner text := $old$select d.default_entry_type
    into v_default_entry_type$old$;
  old_auth text := $old$if v_default_entry_type is null then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;$old$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='portal_request_booking'
    AND pg_get_function_identity_arguments(p.oid)='p_dog_id bigint, p_reservation_date date, p_taxi_mode text';
  IF definition IS NULL OR position(old_deadline IN definition)=0
    OR position(old_owner IN definition)=0 OR position(old_auth IN definition)=0 THEN
    RAISE EXCEPTION 'LIVE booking function differs from inspected version; no changes applied';
  END IF;
  definition := replace(definition,'v_deadline timestamp;',
    'v_deadline timestamp;'||E'\n  v_booking_late_exception boolean := false;');
  definition := replace(definition,old_deadline,
    $new$v_deadline := (p_reservation_date - extract(isodow from p_reservation_date)::integer)::timestamp + time '20:00';$new$);
  definition := replace(definition,old_owner,
    $new$select d.default_entry_type, coalesce(d.booking_late_exception,false)
    into v_default_entry_type,v_booking_late_exception$new$);
  definition := replace(definition,old_auth,
    $new$if v_default_entry_type is null then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;
  if not v_booking_late_exception and v_now_local >= v_deadline then
    raise exception 'Rezervácie na tento týždeň sa uzavreli v nedeľu o 20:00. Napíšte nám správu.';
  end if;$new$);
  EXECUTE definition;
END;
$migration$;

-- Reuse the existing notification table, unique event key, push trigger and cron job.
CREATE OR REPLACE FUNCTION private.enqueue_weekly_booking_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  local_now timestamp := clock_timestamp() AT TIME ZONE 'Europe/Bratislava';
  next_monday date := date_trunc('week',local_now)::date + 7;
  inserted integer := 0;
BEGIN
  IF extract(isodow FROM local_now) <> 7 OR extract(hour FROM local_now) <> 18
     OR extract(minute FROM local_now) <> 5 THEN RETURN 0; END IF;

  INSERT INTO public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body)
  SELECT DISTINCT profile.user_id,'weekly_booking_reminder',
    'Nezabudnite prihlásiť psíka 🐾',
    'Ak chcete prihlásiť psíka na budúci týždeň, rezervujte mu dni dnes do 20:00.',
    'weekly_booking_reminder',null,
    'weekly-booking:'||next_monday::text,local_now::date,local_now::date,
    'Nezabudnite prihlásiť psíka 🐾',
    'Ak chcete prihlásiť psíka na budúci týždeň, rezervujte mu dni dnes do 20:00.'
  FROM public.customer_profiles profile
  JOIN public.customer_owner_links link ON link.user_id=profile.user_id
  JOIN public.dogs dog ON dog.owner_id=link.owner_id AND dog.active=true
  WHERE profile.status='active'
    AND EXISTS (SELECT 1 FROM public.portal_push_subscriptions sub
                WHERE sub.user_id=profile.user_id AND sub.active=true)
    AND EXISTS (SELECT 1 FROM public.visits visit
                WHERE visit.dog_id=dog.id
                  AND visit.visit_date BETWEEN next_monday-7 AND next_monday-3)
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
$function$;

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname='chvostikovo-weekly-booking-reminders'),
  schedule := '5 * * * 0');
