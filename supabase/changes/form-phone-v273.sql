CREATE OR REPLACE FUNCTION public.enqueue_web_form_confirmation_sms()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF new.form_type NOT IN ('lead','application') OR coalesce(new.phone,'')='' THEN
    RETURN new;
  END IF;
  INSERT INTO public.web_form_sms_outbox (
    submission_id,form_type,phone,owner_name,source_ref,language,available_at
  ) VALUES (
    new.id,new.form_type,new.phone,new.owner_name,new.source_ref,
    CASE WHEN new.form_type='lead' AND coalesce(new.interest_reason,'') LIKE 'EN ·%'
      THEN 'en' ELSE 'sk' END,
    new.created_at + interval '2 minutes'
  ) ON CONFLICT (submission_id) DO NOTHING;
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.correct_web_lead_phone_once(p_submission_id bigint, p_token_hash text, p_new_phone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_id bigint;
  v_created_at timestamptz;
  v_sms_status text;
  v_queued boolean := false;
BEGIN
  IF p_submission_id IS NULL OR p_submission_id <= 0
    OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_new_phone IS NULL OR p_new_phone !~ '^[+][1-9][0-9]{6,14}$'
  THEN
    RETURN jsonb_build_object('ok',false);
  END IF;

  SELECT id,created_at INTO v_id,v_created_at
  FROM public.web_form_submissions
  WHERE id = p_submission_id AND form_type IN ('lead','application')
    AND created_at >= now()-interval '15 minutes'
    AND coalesce(raw_payload->>'_phone_edit_hash','')=p_token_hash
  FOR UPDATE;
  IF v_id IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;

  UPDATE public.web_form_submissions
    SET phone=p_new_phone,
        raw_payload=(raw_payload-'_phone_edit_hash')
          || jsonb_build_object('phone',p_new_phone,'_phone_edited_at',now())
  WHERE id=v_id;

  SELECT status INTO v_sms_status
  FROM public.web_form_sms_outbox WHERE submission_id=v_id FOR UPDATE;

  IF v_sms_status='pending' THEN
    UPDATE public.web_form_sms_outbox SET
      phone=p_new_phone,
      available_at=greatest(available_at,v_created_at+interval '2 minutes'),
      updated_at=now()
    WHERE submission_id=v_id AND status='pending';
    v_queued := true;
  ELSIF v_sms_status='failed' THEN
    UPDATE public.web_form_sms_outbox SET
      phone=p_new_phone,status='pending',attempts=0,
      available_at=greatest(now(),v_created_at+interval '2 minutes'),
      claimed_at=null,last_error=null,updated_at=now()
    WHERE submission_id=v_id AND status='failed';
    v_queued := true;
  END IF;

  RETURN jsonb_build_object('ok',true,'sms_queued',v_queued);
END;
$function$

;
