-- REVIEW CANDIDATE ONLY. Convert to an official Supabase migration after backup,
-- staging SQL/permission tests and owner-approved release sequence.
-- Existing collector and table, no historical rewrite or second event table.
BEGIN;
ALTER TABLE public.website_interaction_events
  ADD COLUMN aria_chat_id uuid,
  ADD COLUMN aria_visit_id uuid,
  ADD COLUMN aria_sequence integer,
  ADD COLUMN aria_action text,
  ADD COLUMN aria_detail text,
  ADD COLUMN aria_form_attempt_id uuid,
  ADD COLUMN aria_environment text;
ALTER TABLE public.website_interaction_events ADD CONSTRAINT website_aria_context_v2_chk CHECK (
  CASE WHEN event_name = 'aria_chat_event' THEN
    aria_chat_id IS NOT NULL AND aria_visit_id IS NOT NULL AND aria_sequence IS NOT NULL AND aria_sequence BETWEEN 1 AND 10000
    AND aria_action IS NOT NULL AND aria_environment IS NOT NULL AND aria_environment IN ('production','qa')
    AND meta_click_hash IS NULL AND attempt_id IS NULL
    AND path = '/psia-skolka-kosice/'
    AND CASE
      WHEN aria_action IN ('question','auto_question') THEN aria_detail IS NOT NULL AND aria_detail IN ('pricing','requirements','caretakers','puppy','location','space','first_visit','reservation')
      WHEN aria_action IN ('form_open','form_start','form_attempt','form_error','form_submit') THEN aria_detail IS NOT NULL AND aria_detail IN ('interest','other','puppy_contact')
      ELSE aria_action IN ('open','reopen','resume','close','leave','interest_open','other_open','puppy_check_open','puppy_precheck_passed','puppy_precheck_info') AND aria_detail IS NULL
    END
    AND (aria_form_attempt_id IS NULL OR aria_action IN ('form_attempt','form_error','form_submit'))
    AND (aria_action NOT IN ('form_attempt','form_submit') OR aria_form_attempt_id IS NOT NULL)
    AND event_source IS NOT NULL
    AND event_source = 'lead_landing_aria_chat_' || aria_action || coalesce('_'||aria_detail,'')
  ELSE aria_chat_id IS NULL AND aria_visit_id IS NULL AND aria_sequence IS NULL AND aria_action IS NULL
    AND aria_detail IS NULL AND aria_form_attempt_id IS NULL AND aria_environment IS NULL END
);
CREATE UNIQUE INDEX website_aria_sequence_v2_uidx ON public.website_interaction_events(aria_chat_id,aria_sequence) WHERE aria_chat_id IS NOT NULL;
CREATE INDEX website_aria_cohort_v2_idx ON public.website_interaction_events(aria_environment,created_at,aria_chat_id) WHERE event_name='aria_chat_event';
CREATE OR REPLACE FUNCTION public.admin_aria_chat_analytics_v2(p_from date,p_to date,p_mode text DEFAULT 'production')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $report$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active IS TRUE) THEN
   RAISE EXCEPTION 'Staff only' USING ERRCODE='42501';
 END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to < p_from OR p_to-p_from > 92 OR p_to > (now() AT TIME ZONE 'Europe/Bratislava')::date OR p_mode IS NULL OR p_mode NOT IN ('production','qa') THEN
   RAISE EXCEPTION 'Invalid Aria report range' USING ERRCODE='22023';
 END IF;
 WITH bounds AS (
   SELECT p_from::timestamp AT TIME ZONE 'Europe/Bratislava' AS start_at,
          (p_to+1)::timestamp AT TIME ZONE 'Europe/Bratislava' AS end_at
 ), candidate_ids AS (
   SELECT DISTINCT e.aria_chat_id FROM public.website_interaction_events e,bounds b
   WHERE e.event_name='aria_chat_event' AND e.aria_environment=p_mode AND e.created_at>=b.start_at AND e.created_at<b.end_at
 ), all_rows AS MATERIALIZED (
   SELECT e.aria_chat_id AS chat,e.aria_visit_id AS visit,e.aria_sequence AS seq,e.aria_action AS action,
          e.aria_detail AS detail,e.aria_form_attempt_id AS attempt,e.created_at,e.source_channel
   FROM candidate_ids c JOIN public.website_interaction_events e ON e.aria_chat_id=c.aria_chat_id
   WHERE e.event_name='aria_chat_event' AND e.aria_environment=p_mode
 ), cohort AS (
   SELECT chat FROM all_rows GROUP BY chat HAVING min(created_at)>=(SELECT start_at FROM bounds) AND min(created_at)<(SELECT end_at FROM bounds)
 ), ev AS MATERIALIZED (
   SELECT r.* FROM all_rows r JOIN cohort c USING(chat)
 ), chats AS (
   SELECT chat,(array_agg(visit ORDER BY seq))[1] AS visit,min(seq) AS first_seq,max(seq) AS last_seq,count(*) AS observed,
      max(created_at) AS last_at,
      count(*) FILTER(WHERE action='open') AS opened,
      count(*) FILTER(WHERE action='reopen') AS reopened,
      count(*) FILTER(WHERE action='resume') AS resumed,
      count(*) FILTER(WHERE action='question') AS manual_clicks,
      count(*) FILTER(WHERE action IN ('question','auto_question')) AS question_opens,
      count(DISTINCT detail) FILTER(WHERE action IN ('question','auto_question')) AS unique_questions,
      (array_agg(detail ORDER BY seq) FILTER(WHERE action='question'))[1] AS first_manual,
      (array_agg(detail ORDER BY seq) FILTER(WHERE action IN ('question','auto_question')))[1] AS first_opened,
      (array_agg(action ORDER BY seq DESC) FILTER(WHERE action IN ('open','reopen','resume','close','leave')))[1] AS last_lifecycle,
      max(seq) FILTER(WHERE action IN ('close','leave')) AS exit_seq,
      count(*) FILTER(WHERE action='interest_open') AS interest_count,
      count(*) FILTER(WHERE action='form_submit' AND detail='interest') AS interest_submits,
      string_agg(detail,' → ' ORDER BY seq) FILTER(WHERE action IN ('question','auto_question')) AS path,
      (array_agg(source_channel ORDER BY seq))[1] AS channel
   FROM ev GROUP BY chat
 ), interest AS (
   SELECT i.chat,i.seq,
     coalesce((SELECT q.detail FROM ev q WHERE q.chat=i.chat AND q.seq<i.seq AND q.action IN ('question','auto_question') ORDER BY q.seq DESC LIMIT 1),'none') AS question,
     (SELECT count(*) FROM ev q WHERE q.chat=i.chat AND q.seq<i.seq AND q.action IN ('question','auto_question')) AS openings
   FROM ev i WHERE i.action='interest_open'
 ), exits AS (
   SELECT c.chat,c.last_lifecycle,
     coalesce((SELECT q.detail FROM ev q WHERE q.chat=c.chat AND q.seq<c.exit_seq AND q.action IN ('question','auto_question') ORDER BY q.seq DESC LIMIT 1),'none') AS question
   FROM chats c WHERE c.last_lifecycle IN ('close','leave')
 ), question_stats AS (
   SELECT q.id,
     (SELECT count(*) FROM ev e WHERE e.action='question' AND e.detail=q.id) AS clicks,
     (SELECT count(*) FROM ev e WHERE e.action='auto_question' AND e.detail=q.id) AS automatic,
     (SELECT count(DISTINCT chat) FROM ev e WHERE e.action IN ('question','auto_question') AND e.detail=q.id) AS conversations,
     (SELECT count(*) FROM chats c WHERE c.first_manual=q.id) AS first_click,
     (SELECT count(*) FROM chats c WHERE c.first_opened=q.id) AS first_opened,
     (SELECT count(*) FROM interest i WHERE i.question=q.id) AS interest_after,
     (SELECT count(*) FROM exits x WHERE x.question=q.id) AS final_exit_after
   FROM (VALUES ('pricing'),('requirements'),('caretakers'),('puppy'),('location'),('space'),('first_visit'),('reservation')) q(id)
 ), form_stats AS (
   SELECT f.kind,
     (SELECT count(*) FROM ev WHERE detail=f.kind AND action='form_open') AS opened,
     (SELECT count(*) FROM ev WHERE detail=f.kind AND action='form_start') AS started,
     (SELECT count(DISTINCT attempt) FROM ev WHERE detail=f.kind AND action='form_attempt') AS attempts,
     (SELECT count(*) FROM ev WHERE detail=f.kind AND action='form_error') AS errors,
     (SELECT count(DISTINCT a.attempt) FROM ev a WHERE a.detail=f.kind AND a.action='form_attempt'
       AND EXISTS (SELECT 1 FROM ev e WHERE e.chat=a.chat AND e.detail=a.detail AND e.action='form_error' AND e.seq<a.seq)) AS retries_after_error,
     (SELECT count(DISTINCT attempt) FROM ev WHERE detail=f.kind AND action='form_submit') AS browser_confirmed,
     (SELECT count(DISTINCT a.attempt) FROM ev a WHERE a.detail=f.kind AND a.action='form_attempt' AND a.attempt IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.web_form_submissions w WHERE w.created_at>=a.created_at-interval '5 minutes'
         AND w.created_at<a.created_at+interval '35 minutes' AND w.raw_payload->>'form_attempt_id'=a.attempt::text
         AND w.raw_payload->>'cta_source'='lead_landing_aria_chat_'||f.kind
         AND w.source_ref ~ '^(/|https://(www\.)?chvostikovo\.sk/)psia-skolka-kosice(/|\?|#|$)')) AS db_received
   FROM (VALUES ('interest'),('other'),('puppy_contact')) f(kind)
 )
 SELECT jsonb_build_object(
  'schema',2,'mode',p_mode,'from',p_from,'to',p_to,
  'summary',(SELECT jsonb_build_object(
    'conversations',count(*),'visits_with_chat',count(DISTINCT visit),'conversations_with_open',count(*) FILTER(WHERE opened>0),
    'open_events',coalesce(sum(opened+reopened),0),'reopens',coalesce(sum(reopened),0),'page_resumes',coalesce(sum(resumed),0),
    'faq_conversations',count(*) FILTER(WHERE question_opens>0),'manual_clicks',coalesce(sum(manual_clicks),0),
    'question_openings',coalesce(sum(question_opens),0),'unique_questions_sum',coalesce(sum(unique_questions),0),
    'repeated_question_openings',coalesce(sum(question_opens-unique_questions),0),
    'avg_questions_all',coalesce(round(avg(question_opens),2),0),
    'avg_questions_active',coalesce(round(avg(question_opens) FILTER(WHERE question_opens>0),2),0),
    'avg_unique_questions',coalesce(round(avg(unique_questions),2),0),
    'interest_clicks',coalesce(sum(interest_count),0),'interest_conversations',count(*) FILTER(WHERE interest_count>0),
    'interest_without_question',(SELECT count(*) FROM interest WHERE question='none'),
    'interest_submitted_conversations',count(*) FILTER(WHERE interest_submits>0),
    'final_close',count(*) FILTER(WHERE last_lifecycle='close'),'final_leave',count(*) FILTER(WHERE last_lifecycle='leave'),
    'unobserved_end',count(*) FILTER(WHERE coalesce(last_lifecycle,'') NOT IN ('close','leave') AND last_at<now()-interval '30 minutes'),
    'incomplete_sequences',count(*) FILTER(WHERE first_seq<>1 OR last_seq<>observed),
    'without_open',count(*) FILTER(WHERE opened=0)) FROM chats),
  'questions',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY clicks+automatic DESC,id),'[]'::jsonb) FROM question_stats q),
  'forms',(SELECT coalesce(jsonb_agg(to_jsonb(f) ORDER BY kind),'[]'::jsonb) FROM form_stats f),
  'interest_after_n',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY openings),'[]'::jsonb) FROM (SELECT openings,count(*) AS clicks FROM interest GROUP BY openings)t),
  'paths',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY conversations DESC,path),'[]'::jsonb) FROM (SELECT path,count(*) AS conversations FROM chats WHERE path IS NOT NULL GROUP BY path ORDER BY conversations DESC,path LIMIT 20)t),
  'sources',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY conversations DESC,channel),'[]'::jsonb) FROM (SELECT channel,count(*) AS conversations FROM chats GROUP BY channel)t),
  'exit_without_question',(SELECT count(*) FROM exits WHERE question='none')
 ) INTO result;
 RETURN result;
END
$report$;
REVOKE ALL ON FUNCTION public.admin_aria_chat_analytics_v2(date,date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_aria_chat_analytics_v2(date,date,text) TO authenticated;
COMMIT;
-- Rollback: disable new client first, restore collector v14, revoke RPC access.
-- Keep existing rows/nullable columns; destructive cleanup requires separate approval.
