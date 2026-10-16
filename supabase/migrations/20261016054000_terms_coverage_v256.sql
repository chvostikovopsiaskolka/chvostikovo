-- Read-only coverage metadata. Never rewrites signed acceptance snapshots.
CREATE OR REPLACE FUNCTION public.portal_owner_terms_history_v256(p_dog_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();result jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.';END IF;
 SELECT coalesce(jsonb_agg(row_data ORDER BY accepted_at DESC),'[]'::jsonb) INTO result
 FROM (
  SELECT a.accepted_at,jsonb_build_object(
   'terms_version',a.terms_version,'document_hash',a.document_hash,'accepted_at',a.accepted_at,
   'acceptance_text',a.acceptance_text,'title',t.title,'body',t.body,
   'dog_name',coalesce(a.dog_name_snapshot,d.name),'owner_name',a.user_name_snapshot,
   'dog_names',coverage.names,'coverage_confirmations',coverage.confirmations) row_data
  FROM public.portal_terms_acceptances a
  JOIN public.portal_terms_documents t ON t.version=a.terms_version AND t.document_hash=a.document_hash
  JOIN public.dogs d ON d.id=a.dog_id
  CROSS JOIN LATERAL (
   SELECT jsonb_agg(coalesce(b.dog_name_snapshot,bd.name) ORDER BY bd.id) names,
    jsonb_agg(jsonb_build_object('dog_name',coalesce(b.dog_name_snapshot,bd.name),'accepted_at',b.accepted_at) ORDER BY bd.id) confirmations
   FROM public.portal_terms_acceptances b JOIN public.dogs bd ON bd.id=b.dog_id
   WHERE b.user_id=uid AND b.terms_version=a.terms_version AND b.document_hash=a.document_hash
    AND bd.owner_id=d.owner_id AND b.acceptance_text IS NOT NULL
    AND EXISTS(SELECT 1 FROM public.customer_owner_links l WHERE l.user_id=uid AND l.owner_id=bd.owner_id AND (l.allowed_dog_ids IS NULL OR bd.id=ANY(l.allowed_dog_ids)))
  ) coverage
  WHERE a.user_id=uid AND a.dog_id=p_dog_id
   AND EXISTS(SELECT 1 FROM public.customer_owner_links l WHERE l.user_id=uid AND l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)))
 ) rows;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_owner_terms_history_v256(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_owner_terms_history_v256(bigint) TO authenticated;
