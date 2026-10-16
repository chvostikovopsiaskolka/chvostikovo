DO $publish275$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'66f5ff1b4ae2ac53c850200376f85a23' OR (SELECT md5(html) FROM public.frontend_snapshots WHERE key='staging-admin-stability-v275-20261016')<>'e598134cb674e673e06c5daf61c1e94a' THEN RAISE EXCEPTION 'Publish checksums changed';END IF;
 UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='staging-admin-stability-v275-20261016') WHERE key='stable-v10-clean';
END $publish275$; SELECT md5(html) hash,length(html) chars FROM public.frontend_snapshots WHERE key='stable-v10-clean';
