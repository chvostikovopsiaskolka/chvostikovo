CREATE OR REPLACE FUNCTION private.ai_source_normalize_v341(v text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $fn$
 SELECT regexp_replace(regexp_replace(regexp_replace(regexp_replace(
 replace(replace(replace(lower(btrim(coalesce(v,''))),'%2e','.'),'%2f','/'),'%3a',':'),
 '^https?://',''),'^www\.',''),'/$',''),'\.$','');
$fn$;
REVOKE ALL ON FUNCTION private.ai_source_normalize_v341(text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.ai_referral_provider_v341(src text, medium text, referrer text, channel text DEFAULT '', fbclid boolean DEFAULT false) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $fn$
DECLARE u text:=private.ai_source_normalize_v341(src); h text; v text; tagged boolean:=btrim(coalesce(src,''))<>'';
BEGIN
 IF channel NOT IN ('','utm_other','referral','google_organic','bing_organic','ai_referral') OR coalesce(fbclid,false)
  OR coalesce(medium,'') ~* '(paid|cpc|ppc|display|cpm|cpv|sponsored)' THEN RETURN NULL; END IF;
 h:=private.ai_source_normalize_v341(split_part(split_part(split_part(regexp_replace(lower(btrim(coalesce(referrer,''))),'^https?://',''), '/',1),'?',1),'#',1));
 IF NOT tagged AND h NOT IN ('chatgpt.com','chat.openai.com','perplexity.ai','gemini.google.com','claude.ai','copilot.microsoft.com','copilot.com') THEN RETURN NULL; END IF;
 v:=CASE WHEN tagged THEN u ELSE h END;
 RETURN CASE WHEN v IN ('chatgpt','chatgpt.com','chat.openai.com','openai','openai.com') THEN 'chatgpt'
  WHEN v IN ('perplexity','perplexity.ai') THEN 'perplexity'
  WHEN v IN ('gemini','gemini.google.com') THEN 'gemini'
  WHEN v IN ('claude','claude.ai') THEN 'claude'
  WHEN v IN ('copilot','copilot.microsoft.com','copilot.com') THEN 'copilot' END;
END $fn$;
REVOKE ALL ON FUNCTION private.ai_referral_provider_v341(text,text,text,text,boolean) FROM PUBLIC,anon,authenticated;

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
 'ai_landings',coalesce((SELECT jsonb_agg(t ORDER BY report_date,provider,path) FROM (
 SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
 CASE WHEN path LIKE '/en/%' OR path='/en' THEN 'EN' WHEN path LIKE '/psia-skolka-kosice%' THEN 'LEAD'
 WHEN path LIKE '/psia-skolka-pre-steniatka%' THEN 'STENIATKA' ELSE 'WEB' END page_group,
 private.ai_referral_provider_v341(utm_source,utm_medium,referrer_host,source_channel,has_fbclid) provider,
 split_part(split_part(path,'?',1),'#',1) path,count(*) landings
 FROM public.website_landing_events
 WHERE created_at >= (p_from::timestamp AT TIME ZONE 'Europe/Bratislava') AND created_at < ((p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
 AND path NOT LIKE '/hero-test%' AND private.ai_referral_provider_v341(utm_source,utm_medium,referrer_host,source_channel,has_fbclid) IS NOT NULL
 GROUP BY 1,2,3,4)t),'[]'::jsonb),
 'ai_forms',coalesce((SELECT jsonb_agg(t ORDER BY report_date,provider) FROM (
 SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
 CASE WHEN coalesce(raw_payload->>'landing_page',source_ref,'') ~ '/en(/|$)' THEN 'EN'
 WHEN coalesce(raw_payload->>'landing_page',source_ref,'') LIKE '%psia-skolka-kosice%' THEN 'LEAD'
 WHEN coalesce(raw_payload->>'landing_page',source_ref,'') LIKE '%psia-skolka-pre-steniatka%' THEN 'STENIATKA'
 WHEN coalesce(raw_payload->>'landing_page',source_ref,'') ~ '^(/|https?://(www\.)?chvostikovo\.sk)' THEN 'WEB' ELSE 'NEPRIRADENE' END page_group,
 private.ai_referral_provider_v341(raw_payload->>'traffic_source',raw_payload->>'traffic_medium',raw_payload->>'referrer','',false) provider,
 count(*) submissions
 FROM public.web_form_submissions
 WHERE created_at >= (p_from::timestamp AT TIME ZONE 'Europe/Bratislava') AND created_at < ((p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
 AND form_type='lead' AND NOT(lower(coalesce(owner_name,'')) ~ '(test|skúšk|skusk|demo|asdf|xxx)'
 OR lower(coalesce(source_ref,'')) LIKE '%test%' OR lower(coalesce(raw_payload->>'is_test',''))='true'
 OR (lower(btrim(coalesce(owner_name,''))) IN ('marek','marek leder') AND created_at<'2026-10-11T00:00:00+02:00'::timestamptz))
 AND private.ai_referral_provider_v341(raw_payload->>'traffic_source',raw_payload->>'traffic_medium',raw_payload->>'referrer','',false) IS NOT NULL
 GROUP BY 1,2,3)t),'[]'::jsonb),
 'traffic',coalesce((SELECT jsonb_agg(t ORDER BY report_date,page_group,source_channel) FROM (
  SELECT (created_at AT TIME ZONE 'Europe/Bratislava')::date report_date,
   CASE WHEN path LIKE '/en/%' OR path='/en' THEN 'EN' WHEN path LIKE '/psia-skolka-kosice%' THEN 'LEAD'
    WHEN path LIKE '/psia-skolka-pre-steniatka%' THEN 'STENIATKA' ELSE 'WEB' END page_group,
   CASE WHEN private.ai_referral_provider_v341(utm_source,utm_medium,referrer_host,source_channel,has_fbclid) IS NOT NULL THEN 'ai_referral' ELSE coalesce(source_channel,'direct') END source_channel,count(*) landings
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
ALTER TABLE public.website_landing_events DROP CONSTRAINT website_landing_events_source_channel_check;
ALTER TABLE public.website_landing_events ADD CONSTRAINT website_landing_events_source_channel_check CHECK (source_channel IN ('meta_paid','meta_referral','utm_other','referral','direct','internal_navigation','google_paid','bing_paid','instagram_organic','facebook_organic','google_organic','bing_organic','tiktok_organic','youtube_organic','linkedin_organic','threads_organic','reddit_organic','pinterest_organic','yahoo_organic','duckduckgo_organic','ecosia_organic','seznam_organic','brave_organic','startpage_organic','qwant_organic','yandex_organic','x_organic','ai_referral'));
