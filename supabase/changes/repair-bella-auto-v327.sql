-- Applied only after the v327 guarded function migration and private backup.
BEGIN;
DO $repair$
DECLARE before_used integer;
BEGIN
 IF private.shared_dog_v244(77) THEN RAISE EXCEPTION 'Unexpected shared pass'; END IF;
 IF NOT EXISTS(SELECT 1 FROM private.customer_reservation_rollback_v327 WHERE key='bella_before') THEN RAISE EXCEPTION 'Missing backup'; END IF;
 IF (SELECT count(*) FROM public.reservations WHERE id IN(419,420) AND dog_id=77 AND status='booked' AND billing_choice='auto' AND pass_locked=false)<>2 THEN RAISE EXCEPTION 'Reservation baseline changed'; END IF;
 SELECT used_entries INTO before_used FROM public.passes WHERE id=63 AND dog_id=77;
 PERFORM private.replan_dog_reservations(77,'2026-10-21');
 IF (SELECT used_entries FROM public.passes WHERE id=63) IS DISTINCT FROM before_used THEN RAISE EXCEPTION 'Unexpected usage change'; END IF;
END $repair$;
COMMIT;
