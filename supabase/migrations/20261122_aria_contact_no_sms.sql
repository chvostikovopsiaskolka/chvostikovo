-- Aria contacts: source-scoped SMS exception for new submissions only.
-- Apply before deploying the two-step Aria question form; shared leads and
-- applications still enqueue SMS. Current trigger: web_form_confirmation_sms_enqueue_trg.
CREATE OR REPLACE FUNCTION public.enqueue_web_form_confirmation_sms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF new.form_type NOT IN ('lead','application') OR coalesce(new.phone,'')='' THEN
    RETURN new;
  END IF;
  -- The verified Edge server requires a validated free-text question
  -- and the allowlisted CTA before inserting a contact row.
  IF new.form_type = 'lead' AND coalesce(new.raw_payload->>'cta_source','') IN
      ('aria_preview_chat_other','lead_landing_aria_chat_other') THEN
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
