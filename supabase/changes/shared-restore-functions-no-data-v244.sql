-- Additional code rollback, permitted only before any shared operations were committed.
BEGIN;
DO $$ DECLARE r record; BEGIN
 IF EXISTS(SELECT 1 FROM public.pass_dogs) OR EXISTS(SELECT 1 FROM public.customer_pass_requests WHERE dog_ids IS NOT NULL)
 OR EXISTS(SELECT 1 FROM private.shared_operations_v244) OR EXISTS(SELECT 1 FROM public.customer_profiles WHERE registration_dog_names IS NOT NULL)
 THEN RAISE EXCEPTION 'Shared or new registration data exist. Use the operational rollback and preserve shared accounting.'; END IF;
 FOR r IN SELECT definition FROM private.shared_release_backup_v244 ORDER BY identity LOOP EXECUTE r.definition; END LOOP;
END $$;
UPDATE private.shared_release_v244 SET enabled=false WHERE singleton;
COMMIT;
-- Additive structures remain disabled; no customer history is dropped or rewritten.
