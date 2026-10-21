BEGIN;
DO $guard$
BEGIN
 PERFORM 1 FROM public.frontend_snapshots WHERE key='stable-v10-clean' AND md5(html)='17ef940be116618aa0fadd8f281513fa' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Admin changed since AI release; use selective rollback'; END IF;
 IF md5(pg_get_functiondef('public.admin_traffic_dashboard_v266(date,date)'::regprocedure))<>'5c1675232036b903403ea77fd7234568' THEN RAISE EXCEPTION 'Traffic RPC changed since AI release'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.frontend_snapshots WHERE key='backup-admin-before-ai-referral-20261021' AND md5(html)='84a2c9c9c0d483eeaf15835221ceb610') THEN RAISE EXCEPTION 'Rollback backup mismatch'; END IF;
END $guard$;
UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-ai-referral-20261021') WHERE key='stable-v10-clean' AND md5(html)='17ef940be116618aa0fadd8f281513fa';
CREATE OR REPLACE FUNCTION public.admin_traffic_dashboard_v266(p_from date, p_to date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active IS TRUE) THEN
  RAISE EXCEPTION 'Prístup má iba oprávnený administrátor.' USING ERRCODE='42501';
 END IF;
 result:=public.admin_marketing_dashboard(p_from,p_to);
 RETURN result || jsonb_build_object(
 'traffic',coalesce((SELECT jsonb_agg(t ORDER BY report_date,page_group,source_channel) FROM (
  SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
   CASE WHEN path LIKE '/en/%' OR path='/en' THEN 'EN' WHEN path LIKE '/psia-skolka-kosice%' THEN 'LEAD'
    WHEN path LIKE '/psia-skolka-pre-steniatka%' THEN 'STENIATKA' ELSE 'WEB' END page_group,
   coalesce(source_channel,'direct') source_channel,count(*) landings
  FROM public.website_landing_events
  WHERE created_at >= (p_from::timestamp AT TIME ZONE 'Europe/Bratislava') AND created_at < ((p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
   AND path NOT LIKE '/hero-test%'
  GROUP BY 1,2,3)t),'[]'::jsonb),
 'activity',coalesce((SELECT jsonb_agg(t ORDER BY report_date,page_group,event_name,event_source) FROM (
  SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
   CASE WHEN path LIKE '/en/%' OR path='/en' THEN 'EN' WHEN path LIKE '/psia-skolka-kosice%' THEN 'LEAD'
    WHEN path LIKE '/psia-skolka-pre-steniatka%' THEN 'STENIATKA' ELSE 'WEB' END page_group,
   coalesce(event_name,'') event_name,coalesce(event_source,'') event_source,count(*) events
  FROM public.website_interaction_events
  WHERE created_at >= (p_from::timestamp AT TIME ZONE 'Europe/Bratislava') AND created_at < ((p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
   AND path NOT LIKE '/hero-test%'
  GROUP BY 1,2,3,4)t),'[]'::jsonb),
 'contacts',coalesce((SELECT jsonb_agg(t ORDER BY report_date,page_group) FROM (
  SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
   CASE WHEN coalesce(raw_payload->>'landing_page',source_ref,'') ~ '/en(/|$)' THEN 'EN'
    WHEN coalesce(raw_payload->>'landing_page',source_ref,'') LIKE '%psia-skolka-kosice%' THEN 'LEAD'
    WHEN coalesce(raw_payload->>'landing_page',source_ref,'') LIKE '%psia-skolka-pre-steniatka%' THEN 'STENIATKA'
    WHEN coalesce(raw_payload->>'landing_page',source_ref,'') ~ '^(/|https?://(www\.)?chvostikovo\.sk)' THEN 'WEB' ELSE 'NEPRIRADENE' END page_group,
   count(*) FILTER(WHERE NOT(lower(coalesce(owner_name,'')) ~ '(test|skúšk|skusk|demo|asdf|xxx)'
    OR lower(coalesce(source_ref,'')) LIKE '%test%' OR lower(coalesce(raw_payload->>'is_test',''))='true'
    OR (lower(btrim(coalesce(owner_name,''))) IN ('marek','marek leder') AND created_at<'2026-10-11T00:00:00+02:00'::timestamptz))) real_leads
  FROM public.web_form_submissions
  WHERE created_at >= (p_from::timestamp AT TIME ZONE 'Europe/Bratislava') AND created_at < ((p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
  GROUP BY 1,2)t),'[]'::jsonb));
END $function$
;
COMMIT;
-- Redeploy supabase/backups/website-landing-event-before-ai-v341.ts (verify_jwt=false).
-- Keep ai_referral allowed and existing rows; do not erase raw analytics. Check newer releases first.
