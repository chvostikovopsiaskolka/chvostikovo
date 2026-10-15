-- Emergency stop only, not applied during deployment. Keep request/consent/audit history.
REVOKE EXECUTE ON FUNCTION public.portal_request_dogs_batch_v254(bigint[],jsonb,uuid) FROM authenticated;
-- After forward repair and validation:
-- GRANT EXECUTE ON FUNCTION public.portal_request_dogs_batch_v254(bigint[],jsonb,uuid) TO authenticated;
