DO $deploy$ DECLARE h text;BEGIN
SELECT html INTO h FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
IF md5(h)<>'669359151b8bb61584b2b1d6355280d0' THEN RAISE EXCEPTION 'Live baseline changed';END IF;
INSERT INTO public.frontend_snapshots(key,html) VALUES('backup-admin-before-planned-label-v271-20261016',h) ON CONFLICT(key) DO NOTHING;
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-planned-label-v271-20261016')<>'669359151b8bb61584b2b1d6355280d0' THEN RAISE EXCEPTION 'Backup differs';END IF;
h:=replace(h,$old$r.planned_pass_request_id?'Nová perma · ':'')$old$,$new$r.planned_pass_request_id?'Naplánované · ':'')$new$);
IF md5(h)<>'10cb4a2eae30c79a4c14ddd4e5090664' THEN RAISE EXCEPTION 'Result differs';END IF;
UPDATE public.frontend_snapshots SET html=h WHERE key='stable-v10-clean';END $deploy$;
