-- Preserve the existing fresh-proof gate when its accepted photo is deleted.
CREATE OR REPLACE FUNCTION private.proof_delete_v392()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE replacement bigint;
BEGIN
 SELECT max(p.id) INTO replacement FROM public.vaccination_proofs p
 WHERE p.dog_id=OLD.dog_id AND p.is_current AND p.id>OLD.id;
 UPDATE private.vaccination_state_v234
 SET accepted_proof_id=replacement,
     requires_proof_after_id=CASE WHEN replacement IS NULL THEN OLD.id ELSE NULL END
 WHERE dog_id=OLD.dog_id AND accepted_proof_id=OLD.id;
 RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION private.proof_delete_v392() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER vaccine_proof_delete_v392 AFTER DELETE ON public.vaccination_proofs
FOR EACH ROW EXECUTE FUNCTION private.proof_delete_v392();
