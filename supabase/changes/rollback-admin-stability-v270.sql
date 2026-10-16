DO $rollback$ BEGIN
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'669359151b8bb61584b2b1d6355280d0' THEN RAISE EXCEPTION 'Live baseline changed';END IF;
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-crm-photos-v270-20261016')<>'08dbaca92cebc85bc648e4570ee5deff' THEN RAISE EXCEPTION 'Backup differs';END IF;
UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-crm-photos-v270-20261016') WHERE key='stable-v10-clean';END $rollback$;
