DO $$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean')<>'6573f74a9902edc5da6d178de4243da8' THEN RAISE EXCEPTION 'Live admin changed';END IF;
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='backup-admin-before-booking-review-v267-20261016')<>'5994fec60a130478defbfb1920af14f3' THEN RAISE EXCEPTION 'Backup differs';END IF;
 UPDATE public.frontend_snapshots SET html=(SELECT html FROM public.frontend_snapshots WHERE key='backup-admin-before-booking-review-v267-20261016') WHERE key='stable-v10-clean';
END $$;
