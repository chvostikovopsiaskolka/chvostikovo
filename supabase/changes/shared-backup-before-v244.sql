-- Run once immediately before any production migration. Does not alter customer records.
BEGIN;
DO $$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean') IS DISTINCT FROM 'ad0e44ab84c454b75b747b3f08da254d' THEN
  RAISE EXCEPTION 'Admin snapshot changed: fetch and review the current source before continuing.';
 END IF;
END $$;
INSERT INTO public.frontend_snapshots(key,html)
SELECT 'backup-admin-before-shared-passes-v244-20261015',html FROM public.frontend_snapshots WHERE key='stable-v10-clean'
ON CONFLICT(key) DO NOTHING;
CREATE TABLE IF NOT EXISTS private.shared_release_backup_v244(
 identity text PRIMARY KEY, definition text NOT NULL, checksum text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.shared_release_backup_v244 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.shared_release_backup_v244 FROM PUBLIC,anon,authenticated;
INSERT INTO private.shared_release_backup_v244(identity,definition,checksum)
SELECT p.oid::regprocedure::text,pg_get_functiondef(p.oid),md5(pg_get_functiondef(p.oid))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') AND p.prokind='f' AND p.proname IN (
 'replan_dog_reservations','portal_request_booking','portal_request_pass','portal_cancel_reservation','portal_set_optional_l4','portal_pass_renewal_eligible',
 'portal_accept_school_terms','portal_accept_school_terms_verified','portal_link_existing_dog','portal_approve_pass_request','portal_approve_booking',
 'purchase_pass','mark_no_show','set_pass_used_entries','set_pass_role','portal_cancel_booking','portal_reject_booking','portal_mark_pass_interest_handled',
 'portal_reject_pass_request','finalize_day','emit_customer_portal_live_event','enqueue_weekly_booking_reminders','enqueue_care_expiry_milestones',
 'portal_staff_cancel_reservation_notify','visit_reminder_candidates','process_dog_care_notifications','portal_day_closed_notify','admin_get_dog_legal_status','portal_approve_dog_submission'
) ON CONFLICT(identity) DO NOTHING;
COMMIT;
