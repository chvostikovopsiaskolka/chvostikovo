DO $rollback275$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'e598134cb674e673e06c5daf61c1e94a' OR (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-stability-v275-20261016')<>'66f5ff1b4ae2ac53c850200376f85a23' THEN RAISE EXCEPTION 'Rollback checksums changed';END IF;
 UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-stability-v275-20261016') WHERE key='stable-v10-clean';
END $rollback275$;
