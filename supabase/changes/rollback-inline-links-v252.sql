DO $$ DECLARE h text; BEGIN
 SELECT html INTO h FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
 IF md5(h)<>'7bf12b84b5e64ef628cb4a62d4c3ac59' THEN RAISE EXCEPTION 'Snapshot changed; rebase rollback'; END IF;
 SELECT html INTO h FROM public.frontend_snapshots WHERE key='backup-admin-before-inline-links-v252-20261015';
 IF h IS NULL OR md5(h)<>'829c660075986f00c3e549d385002af9' THEN RAISE EXCEPTION 'Backup missing or changed'; END IF;
 UPDATE public.frontend_snapshots SET html=h WHERE key='stable-v10-clean';
END $$;
-- Keep scoped authorization, API v56, audit and all saved links.
