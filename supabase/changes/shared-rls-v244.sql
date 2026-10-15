ALTER POLICY portal_terms_acceptances_customer_insert ON public.portal_terms_acceptances WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (customer_owner_links l
     JOIN dogs d ON ((d.owner_id = l.owner_id)))
  WHERE ((l.user_id = auth.uid()) AND (d.id = portal_terms_acceptances.dog_id) AND (d.active = true) AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))))) AND (EXISTS ( SELECT 1
   FROM portal_terms_documents t
  WHERE ((t.version = portal_terms_acceptances.terms_version) AND (t.active = true) AND (t.effective_from <= now()))))));
