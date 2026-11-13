-- v427 emergency source-only rollback. Restores the v392 trigger, including its
-- preexisting NOT NULL incompatibility; do not run unless independently approved.
-- No production photographs, vaccination dates, reviews or proof metadata are altered.
CREATE OR REPLACE FUNCTION private.proof_delete_v392()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE replacement bigint;
BEGIN
 SELECT max(p.id) INTO replacement FROM public.vaccination_proofs p
 WHERE p.dog_id=OLD.dog_id AND p.is_current AND p.id>OLD.id;
 UPDATE private.vaccination_state_v234
 SET accepted_proof_id=CASE WHEN requires_proof_after_id IS NULL THEN replacement ELSE NULL END,
     requires_proof_after_id=CASE WHEN requires_proof_after_id IS NOT NULL THEN requires_proof_after_id WHEN replacement IS NULL THEN OLD.id ELSE NULL END
 WHERE dog_id=OLD.dog_id AND accepted_proof_id=OLD.id;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.proof_delete_v392() FROM PUBLIC,anon,authenticated;
