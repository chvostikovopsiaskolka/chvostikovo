-- Expression-index maintenance executes the pure normalizer as the updating role.
-- Do not grant private schema access or bypass the existing active-staff RLS.
GRANT EXECUTE ON FUNCTION private.crm_phone_v263(text) TO authenticated;
-- Rollback: REVOKE EXECUTE ON FUNCTION private.crm_phone_v263(text) FROM authenticated;
