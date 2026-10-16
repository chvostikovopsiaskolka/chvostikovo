DO $$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'5994fec60a130478defbfb1920af14f3' THEN RAISE EXCEPTION 'Live admin changed'; END IF;
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-traffic-v266-20261016')<>'e0cd8f3987a9b90bc17032e3a39c5484' THEN RAISE EXCEPTION 'Backup differs'; END IF;
 UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-traffic-v266-20261016') WHERE key='stable-v10-clean';
END $$;
-- Keep the additive staff-only RPC, imported metrics and original reporting history.
