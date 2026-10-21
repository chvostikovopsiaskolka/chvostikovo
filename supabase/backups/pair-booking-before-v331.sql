CREATE OR REPLACE FUNCTION public.portal_request_dogs_batch_v254(p_dog_ids bigint[], p_bookings jsonb, p_request_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 PERFORM private.lock_pool_v244(p_dog_ids[1]);
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
END $function$;
