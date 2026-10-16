CREATE FUNCTION public.portal_shared_bootstrap_v260() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('enabled',coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false),
 'memberships',coalesce((SELECT jsonb_agg(jsonb_build_object('pass_id',m.pass_id,'dog_id',m.dog_id)) FROM public.pass_dogs m WHERE private.owns_dog_v244(auth.uid(),m.dog_id)),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.portal_shared_bootstrap_v260() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_shared_bootstrap_v260() TO authenticated;

CREATE FUNCTION private.guard_shared_dog_owner_v260() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF old.owner_id IS DISTINCT FROM new.owner_id AND EXISTS(SELECT 1 FROM public.pass_dogs WHERE dog_id=old.id) THEN
  RAISE EXCEPTION 'Psík má spoločnú permanentku. Zmenu majiteľa musí najprv vyriešiť personál s históriou čerpania.';
 END IF;RETURN new;
END $$;
REVOKE ALL ON FUNCTION private.guard_shared_dog_owner_v260() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_shared_dog_owner_v260 BEFORE UPDATE OF owner_id ON public.dogs FOR EACH ROW EXECUTE FUNCTION private.guard_shared_dog_owner_v260();
