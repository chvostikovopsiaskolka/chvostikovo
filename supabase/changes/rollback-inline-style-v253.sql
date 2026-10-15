DO $$ DECLARE h text;BEGIN
 SELECT html INTO h FROM frontend_snapshots WHERE key='stable-v10-clean' FOR UPDATE;
 IF md5(h)<>'e8fc02fdd98e98accf81a01f9ea38422' THEN RAISE EXCEPTION 'LIVE changed; rebase rollback';END IF;
 SELECT html INTO h FROM frontend_snapshots WHERE key='backup-admin-before-inline-style-v253-20261015';
 IF h IS NULL OR md5(h)<>'7bf12b84b5e64ef628cb4a62d4c3ac59' THEN RAISE EXCEPTION 'Backup missing or changed';END IF;
 UPDATE frontend_snapshots SET html=h WHERE key='stable-v10-clean';END $$;
