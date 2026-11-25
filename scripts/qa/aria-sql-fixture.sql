\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.staff(user_id uuid PRIMARY KEY,active boolean NOT NULL);
CREATE TABLE public.website_interaction_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now(),path text NOT NULL,event_name text NOT NULL,event_source text,language text NOT NULL DEFAULT 'sk',source_channel text NOT NULL,utm_source text,utm_medium text,utm_campaign text,utm_content text,utm_term text,utm_id text,has_fbclid boolean NOT NULL DEFAULT false,meta_click_hash text CHECK(meta_click_hash IS NULL OR meta_click_hash ~ '^[0-9a-f]{64}$'),referrer_host text,browser_context text,browser_family text,device_type text,navigation_type text,attempt_id uuid);
CREATE UNIQUE INDEX website_interaction_events_meta_once_uidx ON public.website_interaction_events(meta_click_hash,event_name,coalesce(event_source,'')) WHERE meta_click_hash IS NOT NULL;
CREATE UNIQUE INDEX website_interaction_events_attempt_once_uidx ON public.website_interaction_events(attempt_id,event_name) WHERE attempt_id IS NOT NULL;
CREATE TABLE public.web_form_submissions(created_at timestamptz NOT NULL DEFAULT now(),raw_payload jsonb,source_ref text);
ALTER TABLE public.website_interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
INSERT INTO public.website_interaction_events(path,event_name,event_source,source_channel,meta_click_hash) VALUES('/psia-skolka-kosice/','explore_daycare','lead_landing_aria_chat_question_pricing','meta_paid',repeat('a',64));
\ir ../../supabase/aria-chat-analytics-v2.review.sql
INSERT INTO public.staff VALUES('11111111-1111-4111-8111-111111111111',true),('22222222-2222-4222-8222-222222222222',false);
-- All fixtures synthetic, local DB only. No website, Meta or CRM endpoint is called.
INSERT INTO public.website_interaction_events(path,event_name,event_source,source_channel,aria_chat_id,aria_visit_id,aria_sequence,aria_action,aria_detail,aria_form_attempt_id,aria_environment)
SELECT '/psia-skolka-kosice/','aria_chat_event','lead_landing_aria_chat_'||action||coalesce('_'||detail,''),'meta_paid','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444',seq,action,detail,attempt::uuid,'production'
FROM (VALUES(1,'open',NULL,NULL),(2,'question','pricing',NULL),(3,'question','pricing',NULL),(4,'question','requirements',NULL),(5,'interest_open',NULL,NULL),(6,'form_open','interest',NULL),(7,'form_start','interest',NULL),(8,'form_attempt','interest','55555555-5555-4555-8555-555555555555'),(9,'form_error','interest','55555555-5555-4555-8555-555555555555'),(10,'form_attempt','interest','66666666-6666-4666-8666-666666666666'),(11,'form_submit','interest','66666666-6666-4666-8666-666666666666'),(12,'close',NULL,NULL),(13,'reopen',NULL,NULL),(14,'leave',NULL,NULL)) t(seq,action,detail,attempt);
INSERT INTO public.web_form_submissions(raw_payload,source_ref) VALUES(jsonb_build_object('cta_source','lead_landing_aria_chat_interest','form_attempt_id','66666666-6666-4666-8666-666666666666'),'/psia-skolka-kosice/');
INSERT INTO public.website_interaction_events(path,event_name,event_source,source_channel,aria_chat_id,aria_visit_id,aria_sequence,aria_action,aria_environment) VALUES('/psia-skolka-kosice/','aria_chat_event','lead_landing_aria_chat_open','direct','77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888',1,'open','qa');
DO $$ BEGIN
 IF has_function_privilege('anon','public.admin_aria_chat_analytics_v2(date,date,text)','execute') THEN RAISE EXCEPTION 'anon allowed'; END IF;
 IF NOT has_function_privilege('authenticated','public.admin_aria_chat_analytics_v2(date,date,text)','execute') THEN RAISE EXCEPTION 'authenticated RPC missing'; END IF;
 BEGIN
 INSERT INTO public.website_interaction_events(path,event_name,event_source,source_channel,aria_chat_id,aria_visit_id,aria_sequence,aria_action,aria_detail,aria_environment) VALUES('/psia-skolka-kosice/','aria_chat_event','lead_landing_aria_chat_question_unknown','direct','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444',15,'question','unknown','production');
 RAISE EXCEPTION 'unknown question allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
 INSERT INTO public.website_interaction_events(path,event_name,event_source,source_channel,aria_chat_id,aria_visit_id,aria_sequence,aria_action,aria_detail,aria_environment) VALUES('/psia-skolka-kosice/','aria_chat_event','lead_landing_aria_chat_question_pricing','direct','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444',2,'question','pricing','production');
 RAISE EXCEPTION 'duplicate sequence allowed'; EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (SELECT count(*) FROM public.website_interaction_events WHERE event_name='explore_daycare')<>1 THEN RAISE EXCEPTION 'legacy row changed'; END IF;
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
DO $$ BEGIN
 BEGIN PERFORM public.admin_aria_chat_analytics_v2(current_date,current_date,'production'); RAISE EXCEPTION 'inactive staff allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',false);
DO $$ BEGIN
 BEGIN PERFORM public.admin_aria_chat_analytics_v2(current_date,current_date,'production'); RAISE EXCEPTION 'nonstaff allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$ DECLARE d jsonb;q jsonb;f jsonb;today date := (now() AT TIME ZONE 'Europe/Bratislava')::date; BEGIN
 d:=public.admin_aria_chat_analytics_v2(today,today,'production');
 IF d->'summary'->>'conversations'<>'1' OR d->'summary'->>'question_openings'<>'3' OR d->'summary'->>'unique_questions_sum'<>'2' OR d->'summary'->>'repeated_question_openings'<>'1' OR d->'summary'->>'reopens'<>'1' OR d->'summary'->>'final_leave'<>'1' THEN RAISE EXCEPTION 'summary mismatch %',d; END IF;
 SELECT x INTO q FROM jsonb_array_elements(d->'questions') x WHERE x->>'id'='requirements';
 IF q->>'interest_after'<>'1' OR q->>'final_exit_after'<>'1' THEN RAISE EXCEPTION 'attribution mismatch %',q; END IF;
 SELECT x INTO f FROM jsonb_array_elements(d->'forms') x WHERE x->>'kind'='interest';
 IF f->>'attempts'<>'2' OR f->>'errors'<>'1' OR f->>'retries_after_error'<>'1' OR f->>'db_received'<>'1' THEN RAISE EXCEPTION 'form mismatch %',f; END IF;
 IF d->'interest_after_n'->0->>'openings'<>'3' THEN RAISE EXCEPTION 'interest steps mismatch'; END IF;
 d:=public.admin_aria_chat_analytics_v2(today,today,'qa');
 IF d->'summary'->>'conversations'<>'1' OR d->'summary'->>'question_openings'<>'0' THEN RAISE EXCEPTION 'QA isolation mismatch'; END IF;
 BEGIN PERFORM public.admin_aria_chat_analytics_v2(today-100,today,'production'); RAISE EXCEPTION 'invalid range accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'ARIA SQL fixture: PASS' AS result;
