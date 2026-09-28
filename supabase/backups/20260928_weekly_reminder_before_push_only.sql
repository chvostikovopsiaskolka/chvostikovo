CREATE OR REPLACE FUNCTION private.enqueue_weekly_booking_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
