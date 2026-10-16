-- All fixtures and queued trigger effects are rolled back. No SMS/push/Meta send.
-- is_test=false deliberately exercises the real CRM linking branch, which excludes
-- is_test=true submissions; all names and numbers below remain synthetic.
BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.staff WHERE active ORDER BY user_id LIMIT 1),true);
SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $test$
DECLARE lead_id bigint; app_id bigint; dogs jsonb; tok text:=repeat('c',64); due timestamptz; result jsonb;
BEGIN
 dogs:=jsonb_build_array(
  jsonb_build_object('dog_name','Synthetic First','dog_breed','Labrador','dog_weight_kg',25,'dog_sex','male','dog_age_text','2 roky','dog_neutered',true,'interest_reason','Občas podľa potreby','dog_temperament','Synthetic QA','dog_allergies',''),
  jsonb_build_object('dog_name','Synthetic Second','dog_breed','Retriever','dog_weight_kg',25,'dog_sex','female','dog_age_text','3 roky','dog_neutered',false,'interest_reason','Občas podľa potreby','dog_temperament','Synthetic QA','dog_allergies',''));
 INSERT INTO public.web_form_submissions(form_type,owner_name,phone,consent,raw_payload)
 VALUES('lead','Synthetic Form Stability QA','+421000000000',true,jsonb_build_object('is_test',false,'synthetic_rollback_check_v275',true)) RETURNING id INTO lead_id;
 INSERT INTO public.web_form_submissions(form_type,owner_name,phone,consent,raw_payload)
 VALUES('application','Synthetic Form Stability QA','+421000000000',true,jsonb_build_object('is_test',false,'synthetic_rollback_check_v275',true,'dogs',dogs,'_phone_edit_hash',tok)) RETURNING id INTO app_id;
 IF (SELECT crm_lead_id FROM public.web_form_submissions WHERE id=app_id) IS DISTINCT FROM lead_id THEN RAISE EXCEPTION 'Delayed application did not link to lead';END IF;
 IF (SELECT jsonb_array_length(raw_payload->'dogs') FROM public.web_form_submissions WHERE id=app_id)<>2 THEN RAISE EXCEPTION 'Second dog lost';END IF;
 SELECT available_at INTO due FROM public.web_form_sms_outbox WHERE submission_id=app_id;
 IF due<now()+interval '119 seconds' THEN RAISE EXCEPTION 'SMS delay missing';END IF;
 result:=public.correct_web_lead_phone_once(app_id,tok,'+421000000001');
 IF result->>'ok'<>'true' OR result->>'sms_queued'<>'true' THEN RAISE EXCEPTION 'Phone correction failed';END IF;
 IF EXISTS(SELECT 1 FROM public.web_form_sms_outbox WHERE submission_id=app_id AND (phone<>'+421000000001' OR available_at<due)) THEN RAISE EXCEPTION 'Wrong SMS destination or earlier deadline';END IF;
 IF (SELECT crm_lead_id FROM public.web_form_submissions WHERE id=app_id) IS DISTINCT FROM lead_id THEN RAISE EXCEPTION 'Correction lost CRM link';END IF;
 IF public.correct_web_lead_phone_once(app_id,tok,'+421000000002')->>'ok'<>'false' THEN RAISE EXCEPTION 'Phone token reusable';END IF;
 PERFORM set_config('chvo.test_app_v275',app_id::text,true);
END $test$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
DO $test$ BEGIN
 UPDATE public.web_form_submissions SET status='archived' WHERE id=current_setting('chvo.test_app_v275')::bigint;
 IF NOT FOUND THEN RAISE EXCEPTION 'Active staff cannot archive application';END IF;
END $test$;
RESET ROLE;
SELECT jsonb_build_object('service_insert_lead_and_two_dog_application',true,'crm_link',true,'one_use_phone_edit',true,'sms_delay_and_destination',true,'staff_archive',true,'will_rollback',true) verification;
ROLLBACK;
