DO $rollback$ BEGIN
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'08dbaca92cebc85bc648e4570ee5deff' THEN RAISE EXCEPTION 'Live baseline changed';END IF;
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-booking-runtime-v269-20261016')<>'6573f74a9902edc5da6d178de4243da8' THEN RAISE EXCEPTION 'Backup differs';END IF;
UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-booking-runtime-v269-20261016') WHERE key='stable-v10-clean';END $rollback$;
