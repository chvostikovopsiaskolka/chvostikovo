-- Operational rollback after rollout. Keep shared accounting and audit history intact.
BEGIN;
UPDATE private.shared_release_v244 SET enabled=false WHERE singleton;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.frontend_snapshots WHERE key='backup-admin-before-shared-passes-v244-20261015') THEN
  UPDATE public.frontend_snapshots dst SET html=backup.html
  FROM public.frontend_snapshots backup WHERE dst.key='stable-v10-clean' AND backup.key='backup-admin-before-shared-passes-v244-20261015';
 END IF;
END $$;
COMMIT;
-- Roll the PWA back to backup-customer-before-shared-passes-current-20261015
-- (03e1102bc727dbe65720f6f295b2b30c0bd759ef) using the existing Vercel deployment.
-- Never restore legacy accounting functions while any pass_dogs/shared request rows exist.
-- Never delete pass_dogs, visits, sales or shared_audit_v244 as a rollback shortcut.
