-- TEST Aria contact-only sources require NO SMS, while ordinary daycare interests
-- and applications continue to enqueue normally. Apply BEFORE frontend release.
-- Current production trigger public.web_form_confirmation_sms_enqueue_trg.
CREATE OR REPLACE FUNCTION public.enqueue_web_form_confirmation_sms()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF new.form_type NOT IN ('lead','application') OR coalesce(new.phone,'')='' THEN
    RETURN new;
  END IF;
  IF new.form_type='lead' AND coalesce(new.raw_payload->>'cta_source','') IN
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
