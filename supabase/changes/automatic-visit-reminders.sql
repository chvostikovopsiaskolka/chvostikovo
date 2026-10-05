ALTER TABLE public.dogs DROP CONSTRAINT dogs_visit_reminder_channel_check;
ALTER TABLE public.dogs ADD CONSTRAINT dogs_visit_reminder_channel_check CHECK (visit_reminder_channel IN ('auto','sms','both','push'));
ALTER TABLE public.dogs ALTER COLUMN visit_reminder_channel SET DEFAULT 'auto';
-- Existing defaults and the two original pilot profiles become automatic. Explicit dual mode remains intact.
UPDATE public.dogs SET visit_reminder_channel='auto' WHERE visit_reminder_channel='sms' OR (visit_reminder_channel='push' AND owner_id IN (SELECT owner_id FROM public.customer_owner_links WHERE user_id IN (SELECT user_id FROM public.customer_profiles WHERE email IN ('chvostikovo.psiaskolka@gmail.com','riskix.leder@gmail.com'))));
CREATE OR REPLACE FUNCTION private.visit_reminder_candidates(p_day date)
 RETURNS TABLE(recipient_user_id uuid, dog_id bigint, reservation_id bigint, body text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT DISTINCT profile.user_id,d.id,r.id,
  'Dobrý deň, na zajtra '||pg_catalog.to_char(p_day,'DD. MM. YYYY')||' máte rezerváciu pre '||
  coalesce(nullif(pg_catalog.btrim(d.sms_name),''),d.name)||'.'||
  CASE WHEN coalesce(nullif(r.taxi_mode,'none'),nullif(r.taxi_service,'none')) IN ('pickup_dropoff','do/zo','do-zo') THEN ' Psí taxi: vyzdvihnutie aj dovoz domov.'
       WHEN coalesce(nullif(r.taxi_mode,'none'),nullif(r.taxi_service,'none')) IN ('pickup','do','one_way') THEN ' Psí taxi: jednosmerná jazda.' ELSE '' END||
  CASE WHEN r.entry_type='pass' THEN ' Prehľad vstupov, zostávajúcich vstupov a platnosť permanentky nájdete v aplikácii.' ELSE '' END
 FROM public.reservations r
 JOIN public.dogs d ON d.id=r.dog_id AND d.active AND d.visit_reminder_channel IN ('auto','both','push')
 JOIN public.customer_owner_links link ON link.owner_id=d.owner_id
 JOIN public.customer_profiles profile ON profile.user_id=link.user_id AND profile.status='active'
 WHERE r.reservation_date=p_day AND r.status='booked'
 AND NOT EXISTS(SELECT 1 FROM public.customer_booking_requests request WHERE request.reservation_id=r.id AND request.status='cancel_requested')
 AND EXISTS(SELECT 1 FROM public.portal_push_subscriptions sub WHERE sub.user_id=profile.user_id AND sub.active);
$function$
;
REVOKE ALL ON FUNCTION private.visit_reminder_candidates(date) FROM PUBLIC,anon,authenticated;
