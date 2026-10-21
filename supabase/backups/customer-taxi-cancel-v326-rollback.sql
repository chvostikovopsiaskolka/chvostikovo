-- First selectively revert the v326 customer controls to stop new calls.
-- Drop only this new RPC; retain existing audit/notifications and newer releases.
DROP FUNCTION IF EXISTS public.portal_cancel_taxi_v326(bigint,bigint);
-- Then, only if admin-push still matches v326, restore admin-push-before-v326.ts.
