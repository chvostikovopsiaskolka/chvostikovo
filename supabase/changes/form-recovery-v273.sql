CREATE TABLE public.web_form_recoveries_v273(
 attempt_id uuid PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(),
 form_type text NOT NULL CHECK(form_type IN ('lead','application')),
 owner_name text NOT NULL CHECK(length(owner_name) BETWEEN 1 AND 160),
 phone text NOT NULL CHECK(length(phone) BETWEEN 7 AND 40),
 email text CHECK(email IS NULL OR length(email)<=254),
 dog_names text NOT NULL DEFAULT '' CHECK(length(dog_names)<=330),
 interest_reason text NOT NULL DEFAULT '' CHECK(length(interest_reason)<=300),
 source_ref text NOT NULL DEFAULT '/' CHECK(length(source_ref)<=500),
 error_stage text NOT NULL DEFAULT 'received' CHECK(length(error_stage)<=80),
 recovery_payload jsonb NOT NULL DEFAULT '{}' CHECK(octet_length(recovery_payload::text)<=32000),
 resolved_submission_id bigint REFERENCES public.web_form_submissions(id) ON DELETE SET NULL,
 handled_at timestamptz
);
ALTER TABLE public.web_form_recoveries_v273 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.web_form_recoveries_v273 FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON public.web_form_recoveries_v273 TO authenticated;
GRANT ALL ON public.web_form_recoveries_v273 TO service_role;
CREATE POLICY recovery_staff_read ON public.web_form_recoveries_v273 FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.staff s WHERE s.user_id=(SELECT auth.uid()) AND s.active));
CREATE POLICY recovery_staff_handle ON public.web_form_recoveries_v273 FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.staff s WHERE s.user_id=(SELECT auth.uid()) AND s.active)) WITH CHECK(EXISTS(SELECT 1 FROM public.staff s WHERE s.user_id=(SELECT auth.uid()) AND s.active));
-- Staff can mark handled but cannot overwrite a saved contact/payload.
REVOKE UPDATE ON public.web_form_recoveries_v273 FROM authenticated;
GRANT UPDATE(handled_at) ON public.web_form_recoveries_v273 TO authenticated;
CREATE INDEX web_recovery_pending_v273 ON public.web_form_recoveries_v273(created_at DESC) WHERE resolved_submission_id IS NULL AND handled_at IS NULL;
-- Successful submission closes exact attempt and earlier matching contact recoveries.
CREATE FUNCTION private.resolve_web_recovery_v273() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.web_form_recoveries_v273 r SET resolved_submission_id=new.id,recovery_payload='{}'::jsonb
 WHERE r.resolved_submission_id IS NULL AND r.form_type=new.form_type AND r.phone=new.phone
 AND lower(btrim(r.owner_name))=lower(btrim(new.owner_name)) AND r.created_at>=now()-interval '24 hours';
 RETURN new;
END $$;
REVOKE ALL ON FUNCTION private.resolve_web_recovery_v273() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER resolve_web_recovery_v273 AFTER INSERT ON public.web_form_submissions FOR EACH ROW EXECUTE FUNCTION private.resolve_web_recovery_v273();
