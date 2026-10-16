DO $deploy$ DECLARE h text;BEGIN
SELECT html INTO h FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
IF md5(h)<>'10cb4a2eae30c79a4c14ddd4e5090664' THEN RAISE EXCEPTION 'Live baseline changed';END IF;
INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-second-usage-v272-20261016',h) ON CONFLICT(key) DO NOTHING;
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-second-usage-v272-20261016')<>'10cb4a2eae30c79a4c14ddd4e5090664' THEN RAISE EXCEPTION 'Backup differs';END IF;
h:=replace(h,$old$if(row.interest_reason)textField('Ako plánuje využívať škôlku',row.interest_reason);$old$,$new$if(Number(row.dog_order)===1&&row.interest_reason)textField('Ako plánuje využívať škôlku',row.interest_reason);$new$);
IF md5(h)<>'7060e5acc2a672a4a061bbe3aac8a158' THEN RAISE EXCEPTION 'Result differs';END IF;
UPDATE public.frontend_snapshots SET html=h WHERE key='stable-v10-clean';END $deploy$;
