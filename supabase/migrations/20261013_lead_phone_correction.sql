-- Atomic, one-time contact correction for an existing enquiry.
-- Rollback: DROP FUNCTION IF EXISTS public.correct_web_lead_phone_once(bigint,text,text);
CREATE OR REPLACE FUNCTION public.correct_web_lead_phone_once(
  p_submission_id bigint, p_token_hash text, p_new_phone text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $$
DECLARE
  v_id bigint;
  v_sms_status text;
  v_queued boolean := false;
BEGIN
  IF p_submission_id IS NULL OR p_submission_id <= 0
    OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_new_phone IS NULL OR p_new_phone !~ '^\+[1-9][0-9]{6,14}$' THEN
    RETURN jsonb_build_object('ok',false);
  END IF;

  SELECT id INTO v_id FROM public.web_form_submissions
  WHERE id=p_submission_id AND form_type='lead'
    AND created_at >= now() - interval '15 minutes'
    AND coalesce(raw_payload->>'_phone_edit_hash','') = p_token_hash
  FOR UPDATE;

  IF v_id IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;

  UPDATE public.web_form_submissions
  SET phone=p_new_phone,
      raw_payload=(raw_payload - '_phone_edit_hash')
        || jsonb_build_object('phone',p_new_phone,'_phone_edited_at',now())
  WHERE id=v_id;

  SELECT status INTO v_sms_status FROM public.web_form_sms_outbox
  WHERE submission_id=v_id FOR UPDATE;

  IF v_sms_status IN ('pending','failed') THEN
    UPDATE public.web_form_sms_outbox
      SET phone=p_new_phone,status='pending',attempts=0,
          available_at=now(),claimed_at=null,last_error=null,updated_at=now()
    WHERE submission_id=v_id;
    v_queued := true;
  END IF;

  RETURN jsonb_build_object('ok',true,'sms_queued',v_queued);
END;
$$;
REVOKE ALL ON FUNCTION public.correct_web_lead_phone_once(bigint,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.correct_web_lead_phone_once(bigint,text,text) TO service_role;
