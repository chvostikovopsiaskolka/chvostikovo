-- 2026-11-23: staff-only aggregate for Aria question and form funnel.
-- Designed for the existing website_interaction_events + web_form_submissions.
-- No PII leaves the RPC: only grouped event and receipt counts, not raw payloads.
-- No schema, RLS or INSERT/UPDATE changes. Deploy before admin analytics UI.
CREATE OR REPLACE FUNCTION public.admin_aria_chat_analytics_v1(
  p_from date, p_to date, p_mode text DEFAULT 'lead'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $aria_report$
DECLARE
  v_prefix text;
  v_form_prefix text;
  v_path_prefix text;
  v_opened bigint := 0;
  v_interest_started bigint := 0;
  v_other_started bigint := 0;
  v_puppy_started bigint := 0;
  v_interest_sent bigint := 0;
  v_other_sent bigint := 0;
  v_puppy_sent bigint := 0;
  v_questions jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active IS TRUE
  ) THEN
    RAISE EXCEPTION 'Prístup má iba oprávnený administrátor.' USING ERRCODE='42501';
  END IF;
  IF p_mode NOT IN ('lead','preview') OR p_mode IS NULL
    OR p_from IS NULL OR p_to IS NULL OR p_to < p_from
    OR p_to-p_from > 365 OR p_to > current_date+1
  THEN
    RAISE EXCEPTION 'Neplatný rozsah Aria reportu.' USING ERRCODE='22023';
  END IF;

  v_prefix := CASE WHEN p_mode='preview' THEN 'aria_preview_v3_chat_' ELSE 'lead_landing_aria_chat_' END;
  v_form_prefix := CASE WHEN p_mode='preview' THEN 'aria_preview_chat_' ELSE 'lead_landing_aria_chat_' END;
  v_path_prefix := CASE WHEN p_mode='preview' THEN '/test-aria' ELSE '/psia-skolka-kosice' END;

  SELECT
    count(*) FILTER (WHERE event_source=v_prefix||'open'),
    count(*) FILTER (WHERE event_source=v_prefix||'form_start_interest'),
    count(*) FILTER (WHERE event_source=v_prefix||'form_start_other'),
    count(*) FILTER (WHERE event_source=v_prefix||'form_start_puppy_contact')
  INTO v_opened,v_interest_started,v_other_started,v_puppy_started
  FROM public.website_interaction_events
  WHERE created_at >= p_from::timestamptz AND created_at < (p_to+1)::timestamptz
    AND event_name='explore_daycare'
    AND event_source LIKE v_prefix||'%'
    AND path LIKE v_path_prefix||'%';

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('id', q.id, 'label', q.label, 'clicks', q.clicks)
    ORDER BY q.clicks DESC, q.position
  ), '[]'::jsonb) INTO v_questions
  FROM (
    SELECT k.position,k.id,k.label,count(e.id) AS clicks
    FROM (VALUES
      (1,'pricing','Cenník','question_pricing'),
      (2,'requirements','Podmienky prijatia','question_requirements'),
      (3,'location','Kde nás nájdete','question_location'),
      (4,'space','Priestory škôlky','question_space'),
      (5,'caretakers','Kto sa stará o psíkov','question_caretakers'),
      (6,'first_visit','Prvá návšteva','question_first_visit'),
      (7,'puppy','Šteniatka','question_puppy'),
      (8,'other','Iná otázka','other_open')
    ) AS k(position,id,label,suffix)
    LEFT JOIN public.website_interaction_events e
      ON e.event_source = v_prefix||k.suffix
      AND e.event_name='explore_daycare'
      AND e.created_at >= p_from::timestamptz
      AND e.created_at < (p_to+1)::timestamptz
      AND e.path LIKE v_path_prefix||'%'
    GROUP BY k.position,k.id,k.label
  ) q;

  -- The database receipt, not a browser success event, is authoritative.
  -- Contact messages are deliberately NOT paid Meta/GA4 lead conversions.
  SELECT
    count(*) FILTER (WHERE raw_payload->>'cta_source'=v_form_prefix||'interest'),
    count(*) FILTER (WHERE raw_payload->>'cta_source'=v_form_prefix||'other'),
    count(*) FILTER (WHERE raw_payload->>'cta_source'=v_form_prefix||'puppy_contact')
  INTO v_interest_sent,v_other_sent,v_puppy_sent
  FROM public.web_form_submissions
  WHERE created_at >= p_from::timestamptz AND created_at < (p_to+1)::timestamptz
    AND form_type='lead'
    AND raw_payload->>'cta_source' IN (
      v_form_prefix||'interest', v_form_prefix||'other', v_form_prefix||'puppy_contact'
    )
    AND source_ref LIKE v_path_prefix||'%';

  RETURN jsonb_build_object(
    'schema',1,'mode',p_mode,'from',p_from,'to',p_to,
    'opened',v_opened,
    'interest_started',v_interest_started,
    'other_started',v_other_started,
    'puppy_started',v_puppy_started,
    'interest_sent',v_interest_sent,
    'other_sent',v_other_sent,
    'puppy_sent',v_puppy_sent,
    'questions',v_questions
  );
END;
$aria_report$;

REVOKE ALL ON FUNCTION public.admin_aria_chat_analytics_v1(date,date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_aria_chat_analytics_v1(date,date,text) TO authenticated;
