-- Default stays SMS. Existing staff-only dogs RLS controls this setting.
ALTER TABLE public.dogs ADD COLUMN visit_reminder_channel text NOT NULL DEFAULT 'sms'
 CHECK (visit_reminder_channel IN ('sms','both','push'));

CREATE FUNCTION private.visit_reminder_candidates(p_day date)
RETURNS TABLE(recipient_user_id uuid, dog_id bigint, reservation_id bigint, body text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
 SELECT DISTINCT profile.user_id,d.id,r.id,
  'Dobrý deň, na zajtra '||pg_catalog.to_char(p_day,'DD. MM. YYYY')||' máte rezerváciu pre '||
  coalesce(nullif(pg_catalog.btrim(d.sms_name),''),d.name)||'.'||
  CASE WHEN coalesce(nullif(r.taxi_mode,'none'),nullif(r.taxi_service,'none')) IN ('pickup_dropoff','do/zo','do-zo') THEN ' Psí taxi: vyzdvihnutie aj dovoz domov.'
       WHEN coalesce(nullif(r.taxi_mode,'none'),nullif(r.taxi_service,'none')) IN ('pickup','do','one_way') THEN ' Psí taxi: jednosmerná jazda.' ELSE '' END||
  CASE WHEN r.entry_type='pass' THEN ' Prehľad vstupov, zostávajúcich vstupov a platnosť permanentky nájdete v aplikácii.' ELSE '' END
 FROM public.reservations r
 JOIN public.dogs d ON d.id=r.dog_id AND d.active AND d.visit_reminder_channel IN ('both','push')
 JOIN public.customer_owner_links link ON link.owner_id=d.owner_id
 JOIN public.customer_profiles profile ON profile.user_id=link.user_id AND profile.status='active'
 WHERE r.reservation_date=p_day AND r.status='booked'
 AND NOT EXISTS(SELECT 1 FROM public.customer_booking_requests request WHERE request.reservation_id=r.id AND request.status='cancel_requested')
 AND EXISTS(SELECT 1 FROM public.portal_push_subscriptions sub WHERE sub.user_id=profile.user_id AND sub.active);
$function$;
REVOKE ALL ON FUNCTION private.visit_reminder_candidates(date) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.enqueue_visit_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $function$
DECLARE local_now timestamp:=clock_timestamp() AT TIME ZONE 'Europe/Bratislava'; inserted integer;
BEGIN
 IF extract(hour FROM local_now)<>19 OR extract(minute FROM local_now)<>15 THEN RETURN 0; END IF;
 INSERT INTO public.portal_notifications(recipient_user_id,notification_type,title,body,entity_type,entity_id,event_key,visible_from,visible_until,push_title,push_body)
 SELECT c.recipient_user_id,'visit_reminder','Zajtra sa tešíme na vášho psíka 🐾',c.body,'reservation',c.reservation_id,
 'visit-reminder:'||c.dog_id::text||':'||(local_now::date+1)::text,local_now::date,local_now::date+1,
 'Zajtra sa tešíme na vášho psíka 🐾',c.body
 FROM private.visit_reminder_candidates(local_now::date+1) c
 ON CONFLICT(recipient_user_id,event_key) WHERE event_key IS NOT NULL DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;RETURN inserted;
END;
$function$;
REVOKE ALL ON FUNCTION private.enqueue_visit_reminders() FROM PUBLIC,anon,authenticated;
-- pg_cron is UTC; hourly execution + local-time guard handles summer/winter time.
SELECT cron.schedule('chvostikovo-visit-reminders-1915','15 * * * *','select private.enqueue_visit_reminders();');
