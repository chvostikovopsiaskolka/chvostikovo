CREATE OR REPLACE FUNCTION private.resolve_web_recovery_v273() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.web_form_recoveries_v273 r SET resolved_submission_id=new.id,recovery_payload='{}'::jsonb
 WHERE r.resolved_submission_id IS NULL AND r.form_type=new.form_type AND r.phone=new.phone
 AND lower(btrim(r.owner_name))=lower(btrim(new.owner_name)) AND r.created_at>=now()-interval '24 hours';
 RETURN new;
END $$;
-- Bounded operational recovery storage, separate from the normal client register.
SELECT cron.schedule('web-form-recovery-retention-v273','25 2 * * *',$job$DELETE FROM public.web_form_recoveries_v273 WHERE created_at<now()-interval '30 days'$job$);
