CREATE TABLE private.owner_terms_copies_v254(acceptance_id bigint PRIMARY KEY,source_acceptance_id bigint NOT NULL,user_id uuid NOT NULL,dog_id bigint NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.owner_terms_copies_v254 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.owner_terms_copies_v254 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.portal_sync_owner_terms_v254(p_terms_version text) RETURNS SETOF public.portal_terms_acceptances LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();doc public.portal_terms_documents%rowtype;t record;src public.portal_terms_acceptances%rowtype;newid bigint;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.';END IF;
 SELECT * INTO doc FROM public.portal_terms_documents WHERE version=p_terms_version AND active AND effective_from<=now() ORDER BY effective_from DESC,id DESC LIMIT 1;
 IF doc.id IS NULL THEN RETURN;END IF;
 PERFORM 1 FROM public.customer_profiles WHERE user_id=uid FOR UPDATE;
 FOR t IN SELECT DISTINCT d.id,d.owner_id,d.name FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id WHERE l.user_id=uid AND d.active AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) LOOP
  SELECT a.* INTO src FROM public.portal_terms_acceptances a JOIN public.dogs d ON d.id=a.dog_id JOIN public.customer_owner_links l ON l.owner_id=d.owner_id AND l.user_id=uid WHERE a.user_id=uid AND d.owner_id=t.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) AND a.terms_version=doc.version AND a.document_hash=doc.document_hash AND a.acceptance_text IS NOT NULL ORDER BY a.accepted_at,a.id LIMIT 1;
  IF src.id IS NOT NULL THEN
   INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash,document_id,acceptance_text,accepted_at,user_name_snapshot,user_email_snapshot,dog_name_snapshot)
   VALUES(uid,t.id,src.terms_version,src.document_hash,src.document_id,src.acceptance_text,src.accepted_at,src.user_name_snapshot,src.user_email_snapshot,t.name)
   ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING id INTO newid;
   IF newid IS NOT NULL THEN INSERT INTO private.owner_terms_copies_v254(acceptance_id,source_acceptance_id,user_id,dog_id) VALUES(newid,src.id,uid,t.id);END IF;
  END IF;
 END LOOP;
 RETURN QUERY SELECT a.* FROM public.portal_terms_acceptances a WHERE a.user_id=uid AND a.terms_version=p_terms_version AND EXISTS(SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id WHERE d.id=a.dog_id AND l.user_id=uid AND d.active AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)));
END $$;
REVOKE ALL ON FUNCTION public.portal_sync_owner_terms_v254(text) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.portal_sync_owner_terms_v254(text) TO authenticated;
CREATE FUNCTION public.portal_accept_owner_terms_v254(p_dog_id bigint,p_terms_version text,p_document_hash text,p_acceptance_text text) RETURNS public.portal_terms_acceptances LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result public.portal_terms_acceptances%rowtype;BEGIN
 result:=public.portal_accept_school_terms_verified(p_dog_id,p_terms_version,p_document_hash,p_acceptance_text);
 PERFORM public.portal_sync_owner_terms_v254(p_terms_version);RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_accept_owner_terms_v254(bigint,text,text,text) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.portal_accept_owner_terms_v254(bigint,text,text,text) TO authenticated;
ALTER TABLE private.booking_batch_push_events ADD COLUMN dog_ids bigint[];
CREATE TABLE private.booking_batches_v254(user_id uuid NOT NULL,request_key uuid NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,request_key));
ALTER TABLE private.booking_batches_v254 ENABLE ROW LEVEL SECURITY;REVOKE ALL ON private.booking_batches_v254 FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.portal_request_dogs_batch_v254(p_dog_ids bigint[],p_bookings jsonb,p_request_key uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();payload jsonb;prior private.booking_batches_v254%rowtype;item jsonb;dog bigint;mode text;row public.customer_booking_requests%rowtype;rows jsonb:='[]';day date;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.';END IF;
 IF p_request_key IS NULL OR p_dog_ids IS NULL OR cardinality(p_dog_ids) NOT BETWEEN 1 AND 2 OR array_ndims(p_dog_ids)<>1 OR array_position(p_dog_ids,NULL) IS NOT NULL OR (SELECT count(DISTINCT x) FROM unnest(p_dog_ids)x)<>cardinality(p_dog_ids) THEN RAISE EXCEPTION 'Vyberte jedného alebo oboch psíkov.';END IF;
 IF jsonb_typeof(p_bookings) IS DISTINCT FROM 'array' OR jsonb_array_length(p_bookings) NOT BETWEEN 1 AND 15 THEN RAISE EXCEPTION 'Vyberte 1 až 15 dní.';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_bookings)x WHERE coalesce(x->>'date','')!~'^\d{4}-\d{2}-\d{2}$') OR (SELECT count(DISTINCT x->>'date') FROM jsonb_array_elements(p_bookings)x)<>jsonb_array_length(p_bookings) THEN RAISE EXCEPTION 'Neplatné alebo duplicitné dni.';END IF;
 payload:=jsonb_build_object('dogs',(SELECT jsonb_agg(x ORDER BY x) FROM unnest(p_dog_ids)x),'bookings',(SELECT jsonb_agg(x ORDER BY x->>'date') FROM jsonb_array_elements(p_bookings)x));
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text||p_request_key::text,254));
 SELECT * INTO prior FROM private.booking_batches_v254 WHERE user_id=uid AND request_key=p_request_key;
 IF prior.request_key IS NOT NULL THEN IF prior.payload IS DISTINCT FROM payload THEN RAISE EXCEPTION 'Identifikátor požiadavky už bol použitý pre iný výber.';END IF;RETURN prior.result;END IF;
 -- All dates and dogs lock in stable order. Each existing RPC rechecks capacity and every dog's vaccination/proof and ownership.
 FOR day IN SELECT (x->>'date')::date FROM jsonb_array_elements(p_bookings)x ORDER BY 1 LOOP PERFORM pg_advisory_xact_lock(hashtextextended(day::text,7241));END LOOP;
 FOR dog IN SELECT x FROM unnest(p_dog_ids)x ORDER BY x LOOP PERFORM pg_advisory_xact_lock(dog);END LOOP;
 PERFORM set_config('chvostikovo.booking_batch','1',true);
 FOR item IN SELECT x FROM jsonb_array_elements(p_bookings)x ORDER BY x->>'date' LOOP
  FOR dog IN SELECT x FROM unnest(p_dog_ids)x ORDER BY x LOOP
   mode:=coalesce(item->'taxi_by_dog'->>dog::text,'none');
   row:=public.portal_request_booking(dog,(item->>'date')::date,mode);
   rows:=rows||jsonb_build_array(to_jsonb(row));
  END LOOP;
 END LOOP;
 PERFORM set_config('chvostikovo.booking_batch','0',true);
 INSERT INTO private.booking_batch_push_events(dog_id,day_count,dates,dog_ids) VALUES(p_dog_ids[1],jsonb_array_length(p_bookings),ARRAY(SELECT x->>'date' FROM jsonb_array_elements(p_bookings)x ORDER BY x->>'date'),p_dog_ids);
 INSERT INTO private.booking_batches_v254(user_id,request_key,payload,result) VALUES(uid,p_request_key,payload,jsonb_build_object('bookings',rows));
 RETURN jsonb_build_object('bookings',rows);
END $$;
REVOKE ALL ON FUNCTION public.portal_request_dogs_batch_v254(bigint[],jsonb,uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.portal_request_dogs_batch_v254(bigint[],jsonb,uuid) TO authenticated;
