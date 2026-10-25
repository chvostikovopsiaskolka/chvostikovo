CREATE OR REPLACE FUNCTION private.visit_reminder_candidates(p_day date)
 RETURNS TABLE(recipient_user_id uuid, dog_id bigint, reservation_id bigint, body text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT DISTINCT
   profile.user_id,
   d.id,
   r.id,
   'Dobrý deň, na zajtra ' || pg_catalog.to_char(p_day,'DD. MM. YYYY') ||
   ' máte rezervovaný vstup pre ' ||
   private.dog_name_accusative(coalesce(nullif(pg_catalog.btrim(d.sms_name),''),d.name),d.sex) ||
   CASE
     WHEN
       lower(coalesce(nullif(pg_catalog.btrim(r.taxi_mode),''),'none')) IN ('pickup_dropoff','do/zo','do-zo','roundtrip','both')
       OR lower(coalesce(nullif(pg_catalog.btrim(r.taxi_service),''),'none')) IN ('pickup_dropoff','do/zo','do-zo','roundtrip','both')
       THEN ' aj s vyzdvihnutím a dovozom domov.'
     WHEN
       lower(coalesce(nullif(pg_catalog.btrim(r.taxi_mode),''),'none')) IN ('pickup','do','one_way','one-way','oneway')
       OR lower(coalesce(nullif(pg_catalog.btrim(r.taxi_service),''),'none')) IN ('pickup','do','one_way','one-way','oneway')
       THEN ' aj s vyzdvihnutím.'
     WHEN r.taxi_mode='dropoff' OR r.taxi_service='dropoff' THEN ' aj s dovozom domov.'
     ELSE '.'
   END ||
   ' Pozrite si, s kým bude váš psík v škôlke. 🐾'
 FROM public.reservations r
 JOIN public.dogs d
   ON d.id=r.dog_id
  AND d.active
  AND d.visit_reminder_channel IN ('auto','both','push')
 JOIN public.customer_owner_links link ON link.owner_id=d.owner_id AND (link.allowed_dog_ids IS NULL OR d.id=ANY(link.allowed_dog_ids))
 JOIN public.customer_profiles profile
   ON profile.user_id=link.user_id
  AND profile.status='active'
 WHERE r.reservation_date=p_day
   AND r.status='booked'
   AND NOT EXISTS(
     SELECT 1
     FROM public.customer_booking_requests request
     WHERE request.reservation_id=r.id
       AND request.status='cancel_requested'
   )
   AND EXISTS(
     SELECT 1
     FROM public.portal_push_subscriptions sub
     WHERE sub.user_id=profile.user_id
       AND sub.active
   );
$function$

