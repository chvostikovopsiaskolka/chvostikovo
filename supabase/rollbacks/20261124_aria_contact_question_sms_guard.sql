-- Restore original 24.11.2026 production behavior (no source-based SMS exemption).
-- WARNING: This may queue SMS again for new Aria contact questions.
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
