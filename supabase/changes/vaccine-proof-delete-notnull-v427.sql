-- v427: narrow, backward-compatible repair for deleting a current vaccination proof.
-- Live private.vaccination_state_v234.accepted_proof_id is NOT NULL DEFAULT 0.
-- Earlier v392 trigger wrote NULL on deletion with no newer proof and raised 23502.
-- Keep the vaccination fresh-proof gate, owner scope and all other columns unchanged.
DO $guard$
DECLARE prior text;
BEGIN
  SELECT pg_get_functiondef('private.proof_delete_v392()'::regprocedure) INTO prior;
  IF position('accepted_proof_id=CASE WHEN requires_proof_after_id IS NULL THEN replacement ELSE NULL END' in prior)=0
  THEN RAISE EXCEPTION 'v427 proof-delete baseline mismatch; inspect current live trigger first'; END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION private.proof_delete_v392()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE replacement bigint;
BEGIN
 SELECT max(p.id) INTO replacement FROM public.vaccination_proofs p
 WHERE p.dog_id=OLD.dog_id AND p.is_current AND p.id>OLD.id;
 UPDATE private.vaccination_state_v234
 SET accepted_proof_id=COALESCE(CASE WHEN requires_proof_after_id IS NULL THEN replacement ELSE NULL END,0),
     requires_proof_after_id=CASE WHEN requires_proof_after_id IS NOT NULL THEN requires_proof_after_id WHEN replacement IS NULL THEN OLD.id ELSE NULL END
 WHERE dog_id=OLD.dog_id AND accepted_proof_id=OLD.id;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.proof_delete_v392() FROM PUBLIC,anon,authenticated;
