DO $rollback$ BEGIN
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'66f5ff1b4ae2ac53c850200376f85a23' THEN RAISE EXCEPTION 'Live baseline changed';END IF;
IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-form-recovery-v273-20261016')<>'7060e5acc2a672a4a061bbe3aac8a158' THEN RAISE EXCEPTION 'Backup differs';END IF;
UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-form-recovery-v273-20261016') WHERE key='stable-v10-clean';END $rollback$;
