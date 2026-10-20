CREATE OR REPLACE FUNCTION private.daycare_default_capacity_v322()
RETURNS integer LANGUAGE sql STABLE SET search_path=''
AS $$ SELECT coalesce((SELECT setting_value::integer FROM public.app_settings
 WHERE setting_key='daycare_default_capacity' AND setting_value ~ '^([1-9]|[12][0-9]|30)$'),8) $$;
REVOKE ALL ON FUNCTION private.daycare_default_capacity_v322() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.portal_set_default_capacity_v322(p_capacity integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_day date; v_occupied integer;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=(SELECT auth.uid()) AND active)
 THEN RAISE EXCEPTION 'Nemáte oprávnenie.' USING ERRCODE='42501'; END IF;
 IF p_capacity IS NULL OR p_capacity<1 OR p_capacity>30 THEN RAISE EXCEPTION 'Kapacita musí byť celé číslo od 1 do 30.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('default-capacity-v322',7241));
 SELECT day,count(*)::integer INTO v_day,v_occupied FROM (
  SELECT reservation_date AS day FROM public.reservations WHERE status='booked' AND reservation_date >= (now() AT TIME ZONE 'Europe/Bratislava')::date
  UNION ALL
  SELECT reservation_date AS day FROM public.customer_booking_requests WHERE status='pending' AND reservation_date >= (now() AT TIME ZONE 'Europe/Bratislava')::date
 ) occupied
 WHERE NOT EXISTS(SELECT 1 FROM public.portal_day_settings s WHERE s.day=occupied.day)
 GROUP BY day HAVING count(*)>p_capacity ORDER BY day LIMIT 1;
 IF v_day IS NOT NULL THEN RAISE EXCEPTION 'Dňa % je už obsadených % miest. Kapacitu nemožno znížiť pod tento počet.',v_day,v_occupied; END IF;
 INSERT INTO public.app_settings(setting_key,setting_value,updated_at) VALUES('daycare_default_capacity',p_capacity::text,now())
 ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at;
 RETURN p_capacity;
END $$;
REVOKE ALL ON FUNCTION public.portal_set_default_capacity_v322(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_set_default_capacity_v322(integer) TO authenticated,service_role;
