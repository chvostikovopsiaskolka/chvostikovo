-- One staff action links one or two existing dogs atomically. No data migration.
CREATE FUNCTION public.portal_link_dogs_inline_v252(p_user_id uuid,p_dog_ids bigint[],p_intro_confirmed boolean) RETURNS bigint[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_owner bigint; v_id bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 IF p_intro_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'Prístup schváľte až po úvodnej návšteve a overení vlastníctva.'; END IF;
 IF p_dog_ids IS NULL OR cardinality(p_dog_ids) NOT BETWEEN 1 AND 2 OR array_ndims(p_dog_ids)<>1 OR array_position(p_dog_ids,NULL) IS NOT NULL OR (SELECT count(DISTINCT x) FROM unnest(p_dog_ids)x)<>cardinality(p_dog_ids) THEN RAISE EXCEPTION 'Vyberte jedného alebo dvoch rôznych psíkov.'; END IF;
 PERFORM 1 FROM public.customer_profiles WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Zákaznícky účet sa nenašiel.'; END IF;
 PERFORM 1 FROM public.dogs WHERE id=ANY(p_dog_ids) ORDER BY id FOR UPDATE;
 IF (SELECT count(*) FROM public.dogs WHERE id=ANY(p_dog_ids) AND active AND owner_id IS NOT NULL)<>cardinality(p_dog_ids) OR (SELECT count(DISTINCT owner_id) FROM public.dogs WHERE id=ANY(p_dog_ids))<>1 THEN RAISE EXCEPTION 'Vyberte existujúcich aktívnych psíkov toho istého overeného majiteľa.'; END IF;
 SELECT owner_id INTO v_owner FROM public.dogs WHERE id=p_dog_ids[1];
 FOREACH v_id IN ARRAY p_dog_ids LOOP
  PERFORM public.portal_link_dog_verified_v251(p_user_id,v_id,v_owner,true,'Personál kliknutím na Schváliť potvrdil úvodnú návštevu a overené vlastníctvo vybraného existujúceho psa.');
 END LOOP;
 RETURN p_dog_ids;
END $$;
REVOKE ALL ON FUNCTION public.portal_link_dogs_inline_v252(uuid,bigint[],boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_link_dogs_inline_v252(uuid,bigint[],boolean) TO authenticated;
