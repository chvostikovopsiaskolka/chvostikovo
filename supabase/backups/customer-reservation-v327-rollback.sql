-- First selectively revert v327 customer UI after checking newer releases.
-- Backend: restore only the original individual planner. Its ACL stays unchanged.
DO $rollback$
DECLARE saved text;
BEGIN
 SELECT payload #>> '{}' INTO saved FROM private.customer_reservation_rollback_v327 WHERE key='planner_before';
 IF saved IS NULL THEN RAISE EXCEPTION 'Missing v327 planner backup'; END IF;
 EXECUTE saved;
END $rollback$;
DROP FUNCTION IF EXISTS public.portal_request_reservation_taxi_v327(bigint,text);
-- Keep the private backup and normal audit. Corrected Bella plan is intentional;
-- do not bulk-restore reservations, pass usage, taxi requests, or notifications.
