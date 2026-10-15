DO $$ DECLARE h text; BEGIN
 SELECT html INTO h FROM public.frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
 IF md5(h)<>'829c660075986f00c3e549d385002af9' THEN RAISE EXCEPTION 'Snapshot changed; rebase rollback'; END IF;
 SELECT html INTO h FROM public.frontend_snapshots WHERE key='backup-admin-before-verified-links-v251-20261015';
 IF h IS NULL OR md5(h)<>'664b6216a4abad04112f7bd0d50c5b3b' THEN RAISE EXCEPTION 'Backup missing or changed'; END IF;
 UPDATE public.frontend_snapshots SET html=h WHERE key='stable-v10-clean';
END $$;
-- Keep API v56, scopes, audit and verified SQL. Legacy approval buttons intentionally reject.
