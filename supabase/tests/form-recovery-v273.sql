-- Transaction-only synthetic fixtures; no SMS/push requests can commit.
BEGIN;
DO $test$ DECLARE id1 bigint;id2 bigint;a jsonb;b jsonb;due timestamptz;tok text:=repeat('a',64);dog jsonb;BEGIN
 dog:=jsonb_build_object('dog_name','Synthetic Dog','dog_breed','Labrador','dog_weight_kg',25,'dog_sex','male','dog_age_text','2 roky','dog_neutered',false,'interest_reason','Občas podľa potreby','dog_allergies','','dog_temperament','Synthetic QA');
 INSERT INTO public.web_form_submissions(form_type,owner_name,phone,consent,raw_payload) VALUES('lead','Synthetic Recovery QA','+421000000000',true,jsonb_build_object('is_test',true,'_phone_edit_hash',tok)) RETURNING id INTO id1;
 INSERT INTO public.web_form_submissions(form_type,owner_name,phone,consent,raw_payload) VALUES('application','Synthetic Recovery QA','+421000000000',true,jsonb_build_object('is_test',true,'_phone_edit_hash',tok,'dogs',jsonb_build_array(dog))) RETURNING id INTO id2;
 SELECT available_at INTO due FROM public.web_form_sms_outbox WHERE submission_id=id2;
 IF due<now()+interval '119 seconds' THEN RAISE EXCEPTION 'Application SMS is not delayed';END IF;
 a:=public.correct_web_lead_phone_once(id1,tok,'+421000000001');b:=public.correct_web_lead_phone_once(id2,tok,'+421000000002');
 IF a->>'ok'<>'true' OR b->>'ok'<>'true' OR a->>'sms_queued'<>'true' OR b->>'sms_queued'<>'true' THEN RAISE EXCEPTION 'Correction failed';END IF;
 IF public.correct_web_lead_phone_once(id2,tok,'+421000000003')->>'ok'<>'false' THEN RAISE EXCEPTION 'Correction replay allowed';END IF;
 IF EXISTS(SELECT 1 FROM public.web_form_sms_outbox WHERE submission_id=id2 AND (phone<>'+421000000002' OR available_at<due)) THEN RAISE EXCEPTION 'SMS destination/deadline differs';END IF;
END $test$;
INSERT INTO public.web_form_recoveries_v273(attempt_id,form_type,owner_name,phone,error_stage) VALUES('00000000-0000-4000-8000-000000000273','lead','Synthetic Recovery QA','+421000000000','server_error');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','0f3cff61-dd34-42aa-a6a5-540db801a1e2',true);
DO $$ BEGIN IF (SELECT count(*) FROM public.web_form_recoveries_v273 WHERE attempt_id='00000000-0000-4000-8000-000000000273')<>1 THEN RAISE EXCEPTION 'Staff cannot view recovery';END IF;END $$;
SELECT set_config('request.jwt.claim.sub','9e82bb5f-d2b5-464c-966a-efd68de3a3f5',true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.web_form_recoveries_v273 WHERE attempt_id='00000000-0000-4000-8000-000000000273') THEN RAISE EXCEPTION 'Customer can view recovery';END IF;END $$;
ROLLBACK;
