-- V-029/V-030. Staging source; apply only after the complete test suite passes.
ALTER TABLE public.customer_owner_links ADD COLUMN allowed_dog_ids bigint[];
ALTER TABLE public.customer_owner_links ALTER COLUMN allowed_dog_ids SET DEFAULT '{}';
ALTER TABLE public.customer_profiles ADD COLUMN registration_dog_names text[];
ALTER TABLE public.customer_pass_requests ADD COLUMN dog_ids bigint[];
ALTER TABLE public.customer_booking_requests ADD COLUMN projected_pass_id bigint REFERENCES public.passes(id);
ALTER TABLE public.customer_booking_requests ADD COLUMN billing_choice text NOT NULL DEFAULT 'auto' CHECK (billing_choice IN ('auto','single','planned'));
ALTER TABLE public.reservations ADD COLUMN billing_choice text NOT NULL DEFAULT 'auto' CHECK (billing_choice IN ('auto','single','planned'));
CREATE TABLE public.pass_dogs (
  pass_id bigint NOT NULL REFERENCES public.passes(id) ON DELETE RESTRICT,
  dog_id bigint NOT NULL REFERENCES public.dogs(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid NOT NULL,
  PRIMARY KEY(pass_id,dog_id)
);
CREATE INDEX pass_dogs_by_dog ON public.pass_dogs(dog_id,pass_id);
ALTER TABLE public.pass_dogs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pass_dogs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pass_dogs TO authenticated;
CREATE POLICY pass_dogs_staff_read ON public.pass_dogs FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.staff s WHERE s.user_id=(SELECT auth.uid()) AND s.active));
CREATE TABLE private.shared_operations_v244 (
  user_id uuid NOT NULL, operation_id uuid NOT NULL, kind text NOT NULL,
  payload jsonb NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,operation_id)
);
CREATE TABLE private.shared_audit_v244 (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor uuid, entity text NOT NULL, entity_id text NOT NULL,
  old_value jsonb,new_value jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.shared_operations_v244 ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.shared_audit_v244 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.shared_operations_v244,private.shared_audit_v244 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.owns_dog_v244(p_user uuid,p_dog bigint) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id JOIN public.customer_profiles p ON p.user_id=l.user_id
 WHERE l.user_id=p_user AND d.id=p_dog AND d.active AND p.status='active'
 AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)))
$$;
REVOKE ALL ON FUNCTION private.owns_dog_v244(uuid,bigint) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.lock_pool_v244(p_dog bigint) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE own bigint; BEGIN
 SELECT owner_id INTO own FROM public.dogs WHERE id=p_dog;
 IF own IS NULL THEN RAISE EXCEPTION 'Psík nemá overeného majiteľa.'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(-own);
 RETURN own;
END $$;
REVOKE ALL ON FUNCTION private.lock_pool_v244(bigint) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.shared_dog_v244(p_dog bigint) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.pass_dogs m JOIN public.passes p ON p.id=m.pass_id WHERE m.dog_id=p_dog AND p.status IN ('active','queued','used_up'))
 OR EXISTS(SELECT 1 FROM public.customer_pass_requests q WHERE p_dog=ANY(q.dog_ids) AND q.status='pending')
$$;
REVOKE ALL ON FUNCTION private.shared_dog_v244(bigint) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.audit_shared_v244() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a jsonb; b jsonb; BEGIN
 IF TG_OP<>'INSERT' THEN a:=to_jsonb(old); END IF;
 IF TG_OP<>'DELETE' THEN b:=to_jsonb(new); END IF;
 IF a IS DISTINCT FROM b THEN
 INSERT INTO private.shared_audit_v244(actor,entity,entity_id,old_value,new_value)
 VALUES(auth.uid(),TG_TABLE_NAME,coalesce(b->>'id',a->>'id',b->>'user_id',a->>'user_id',b->>'pass_id',a->>'pass_id'),a,b);
 END IF;
 RETURN coalesce(new,old);
END $$;
CREATE TRIGGER shared_membership_audit AFTER INSERT OR UPDATE OR DELETE ON public.pass_dogs FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();
CREATE TRIGGER owner_assignment_audit AFTER INSERT OR UPDATE OR DELETE ON public.customer_owner_links FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();
CREATE TRIGGER pass_purchase_audit_v244 AFTER INSERT OR UPDATE OR DELETE ON public.passes FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();

-- Pure chronological planner. The same result drives preview, commit and replanning.
CREATE FUNCTION private.shared_plan_v244(p_owner bigint,p_extra jsonb DEFAULT '[]') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rec record; p public.passes%rowtype; interest public.customer_pass_requests%rowtype;
 used_map jsonb:='{}'; virtual_map jsonb:='{}'; out_rows jsonb:='[]';
 num integer; chosen bigint; total integer; req bigint; mode text;
BEGIN
 FOR rec IN
  SELECT x.* FROM (
   SELECT 'reservation'::text kind,r.id,r.dog_id,r.reservation_date,r.pass_locked,r.pass_id,r.planned_entry_number,r.billing_choice,0::integer ord
   FROM public.reservations r JOIN public.dogs d ON d.id=r.dog_id
   WHERE d.owner_id=p_owner AND r.status='booked' AND r.reservation_date>=(clock_timestamp() AT TIME ZONE 'Europe/Bratislava')::date
   UNION ALL
   SELECT 'request',q.id,q.dog_id,q.reservation_date,false,NULL::bigint,NULL::integer,q.billing_choice,0
   FROM public.customer_booking_requests q JOIN public.dogs d ON d.id=q.dog_id
   WHERE d.owner_id=p_owner AND q.status='pending' AND q.reservation_date>=(clock_timestamp() AT TIME ZONE 'Europe/Bratislava')::date
   UNION ALL
   SELECT 'extra',e.ordinality::bigint,(e.value->>'dog_id')::bigint,(e.value->>'date')::date,false,NULL::bigint,NULL::integer,coalesce(e.value->>'billing_choice','auto'),e.ordinality::integer
   FROM jsonb_array_elements(p_extra) WITH ORDINALITY e
  ) x ORDER BY reservation_date,dog_id,CASE kind WHEN 'reservation' THEN 0 WHEN 'request' THEN 1 ELSE 2 END,id
 LOOP
  p:=NULL; interest:=NULL; chosen:=NULL; num:=NULL; total:=NULL; req:=NULL; mode:='single';
  IF (SELECT default_entry_type FROM public.dogs WHERE id=rec.dog_id)='free' THEN mode:='free';
  ELSIF rec.billing_choice<>'single' THEN
   SELECT pp.* INTO p FROM public.passes pp
   WHERE (pp.dog_id=rec.dog_id OR EXISTS(SELECT 1 FROM public.pass_dogs m WHERE m.pass_id=pp.id AND m.dog_id=rec.dog_id))
    AND pp.status IN ('active','queued')
    AND (pp.valid_from IS NULL OR pp.valid_from<=rec.reservation_date)
    AND (pp.no_expiry OR pp.valid_until IS NULL OR pp.valid_until>=rec.reservation_date)
    AND coalesce((used_map->>pp.id::text)::integer,pp.used_entries)<pp.total_entries
    AND (NOT rec.pass_locked OR pp.id=rec.pass_id)
   ORDER BY CASE pp.status WHEN 'active' THEN 0 ELSE 1 END,coalesce(pp.valid_from,pp.purchased_on,pp.created_at::date),pp.id LIMIT 1;
   IF p.id IS NOT NULL THEN
    num:=coalesce((used_map->>p.id::text)::integer,p.used_entries)+1;
    used_map:=jsonb_set(used_map,ARRAY[p.id::text],to_jsonb(num));chosen:=p.id;total:=p.total_entries;mode:='pass';
   ELSIF rec.pass_locked AND rec.pass_id IS NOT NULL THEN
    RAISE EXCEPTION 'Uzamknutá rezervácia prekračuje zostatok permanentky. Vyžaduje kontrolu personálom.';
   ELSE
    SELECT q.* INTO interest FROM public.customer_pass_requests q
    WHERE q.status='pending' AND (q.dog_id=rec.dog_id OR rec.dog_id=ANY(q.dog_ids))
     AND coalesce((virtual_map->>q.id::text)::integer,0)<q.total_entries
    ORDER BY q.requested_at,q.id LIMIT 1;
    IF interest.id IS NOT NULL THEN
     num:=coalesce((virtual_map->>interest.id::text)::integer,0)+1;
     virtual_map:=jsonb_set(virtual_map,ARRAY[interest.id::text],to_jsonb(num));
     total:=interest.total_entries;req:=interest.id;mode:='planned';
    END IF;
   END IF;
  END IF;
  out_rows:=out_rows||jsonb_build_array(jsonb_build_object('kind',rec.kind,'id',rec.id,'dog_id',rec.dog_id,'date',rec.reservation_date,'mode',mode,'pass_id',chosen,'entry_number',num,'total',total,'pass_request_id',req));
 END LOOP;
 RETURN out_rows;
END $$;
REVOKE ALL ON FUNCTION private.shared_plan_v244(bigint,jsonb) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.apply_shared_plan_v244(p_owner bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE x jsonb; old_guard text:=current_setting('chvostikovo.shared_planning',true); BEGIN
 IF old_guard='1' THEN RETURN; END IF;
 PERFORM set_config('chvostikovo.shared_planning','1',true);
 FOR x IN SELECT value FROM jsonb_array_elements(private.shared_plan_v244(p_owner)) LOOP
  IF x->>'kind'='request' THEN
   UPDATE public.customer_booking_requests SET projected_pass_id=(x->>'pass_id')::bigint,
    projected_entry_number=(x->>'entry_number')::integer,projected_pass_total=(x->>'total')::integer,
    planned_pass_request_id=(x->>'pass_request_id')::bigint
   WHERE id=(x->>'id')::bigint AND (projected_pass_id,projected_entry_number,projected_pass_total,planned_pass_request_id) IS DISTINCT FROM
    ((x->>'pass_id')::bigint,(x->>'entry_number')::integer,(x->>'total')::integer,(x->>'pass_request_id')::bigint);
  ELSIF x->>'kind'='reservation' THEN
   UPDATE public.reservations SET entry_type=CASE WHEN x->>'mode'='pass' THEN 'pass' WHEN x->>'mode'='free' THEN 'free' ELSE 'single' END,
    pass_id=(x->>'pass_id')::bigint,planned_entry_number=(x->>'entry_number')::integer,planned_pass_total=(x->>'total')::integer,
    source_label=CASE WHEN x->>'mode'='planned' THEN 'Čaká na kúpu permanentky' WHEN source_label='Čaká na kúpu permanentky' THEN 'Zákaznícky portál' ELSE source_label END
   WHERE id=(x->>'id')::bigint AND (entry_type,pass_id,planned_entry_number,planned_pass_total) IS DISTINCT FROM
    (CASE WHEN x->>'mode'='pass' THEN 'pass' WHEN x->>'mode'='free' THEN 'free' ELSE 'single' END,(x->>'pass_id')::bigint,(x->>'entry_number')::integer,(x->>'total')::integer);
  END IF;
 END LOOP;
 UPDATE public.customer_booking_requests q SET projected_pass_id=r.pass_id,projected_entry_number=r.planned_entry_number,projected_pass_total=r.planned_pass_total,
 planned_pass_request_id=CASE WHEN r.source_label='Čaká na kúpu permanentky' THEN (SELECT pr.id FROM public.customer_pass_requests pr WHERE pr.status='pending' AND (pr.dog_id=q.dog_id OR q.dog_id=ANY(pr.dog_ids)) ORDER BY pr.requested_at,pr.id LIMIT 1) ELSE NULL END
 FROM public.reservations r JOIN public.dogs d ON d.id=r.dog_id
 WHERE q.reservation_id=r.id AND d.owner_id=p_owner AND q.status='approved' AND r.status='booked';
 PERFORM set_config('chvostikovo.shared_planning',coalesce(old_guard,''),true);
END $$;
REVOKE ALL ON FUNCTION private.apply_shared_plan_v244(bigint) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.portal_request_pass_v244(p_dog_ids bigint[],p_total_entries integer,p_operation_id uuid) RETURNS public.customer_pass_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ids bigint[]; own bigint; row public.customer_pass_requests%rowtype; op private.shared_operations_v244%rowtype; payload jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF NOT coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false) THEN RAISE EXCEPTION 'Spoločné permanentky a rezervácie ešte nie sú sprístupnené.'; END IF;
 SELECT array_agg(DISTINCT x ORDER BY x) INTO ids FROM unnest(p_dog_ids) x;
 IF cardinality(ids) NOT BETWEEN 1 AND 2 OR cardinality(ids)<>cardinality(p_dog_ids) OR p_total_entries NOT IN (10,20) OR p_operation_id IS NULL THEN RAISE EXCEPTION 'Vyberte jedného alebo dvoch psíkov a 10 alebo 20 vstupov.'; END IF;
 own:=private.lock_pool_v244(ids[1]);
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT private.owns_dog_v244(auth.uid(),x)) OR
 (SELECT count(*) FROM public.dogs WHERE id=ANY(ids) AND owner_id=own)<>cardinality(ids) THEN RAISE EXCEPTION 'Psíkovia nemajú spoločného overeného majiteľa.'; END IF;
 payload:=jsonb_build_object('dogs',ids,'entries',p_total_entries);
 SELECT * INTO op FROM private.shared_operations_v244 WHERE user_id=auth.uid() AND operation_id=p_operation_id;
 IF op.operation_id IS NOT NULL THEN
  IF op.kind<>'pass_request' OR op.payload<>payload THEN RAISE EXCEPTION 'Identifikátor bol použitý pre inú požiadavku.'; END IF;
  SELECT * INTO row FROM public.customer_pass_requests WHERE id=(op.result->>'id')::bigint; RETURN row;
 END IF;
 IF EXISTS(SELECT 1 FROM public.customer_pass_requests q WHERE q.status='pending' AND (q.dog_id=ANY(ids) OR q.dog_ids&&ids)) THEN RAISE EXCEPTION 'Pre niektorého psíka už evidujeme žiadosť. Skontrolujte ju s personálom.'; END IF;
 IF EXISTS(SELECT 1 FROM public.passes p WHERE p.status='queued' AND (p.dog_id=ANY(ids) OR EXISTS(SELECT 1 FROM public.pass_dogs m WHERE m.pass_id=p.id AND m.dog_id=ANY(ids)))) THEN RAISE EXCEPTION 'Ďalšia permanentka je už pripravená.'; END IF;
 INSERT INTO public.customer_pass_requests(user_id,dog_id,dog_ids,total_entries) VALUES(auth.uid(),ids[1],ids,p_total_entries) RETURNING * INTO row;
 INSERT INTO private.shared_operations_v244(user_id,operation_id,kind,payload,result) VALUES(auth.uid(),p_operation_id,'pass_request',payload,to_jsonb(row));
 PERFORM private.replan_dog_reservations(ids[1]); RETURN row;
END $$;
REVOKE ALL ON FUNCTION public.portal_request_pass_v244(bigint[],integer,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_request_pass_v244(bigint[],integer,uuid) TO authenticated;

CREATE FUNCTION public.portal_shared_booking_v244(p_items jsonb,p_operation_id uuid,p_expected jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE own bigint; ids bigint[]; payload jsonb; quote jsonb; result jsonb; row public.customer_booking_requests%rowtype; item jsonb; op private.shared_operations_v244%rowtype; day date; old_guard text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF NOT coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false) THEN RAISE EXCEPTION 'Spoločné permanentky a rezervácie ešte nie sú sprístupnené.'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Vyberte psíkov a dni.'; END IF;
 SELECT array_agg(DISTINCT (value->>'dog_id')::bigint ORDER BY (value->>'dog_id')::bigint) INTO ids FROM jsonb_array_elements(p_items);
 IF cardinality(ids) NOT BETWEEN 1 AND 2 OR (SELECT count(DISTINCT (value->>'dog_id',value->>'date')) FROM jsonb_array_elements(p_items))<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Neplatný alebo duplicitný výber.'; END IF;
 own:=private.lock_pool_v244(ids[1]);
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT private.owns_dog_v244(auth.uid(),x)) OR
 (SELECT count(*) FROM public.dogs WHERE id=ANY(ids) AND owner_id=own)<>cardinality(ids) THEN RAISE EXCEPTION 'Psík nie je priradený k vášmu účtu.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF coalesce(item->>'billing_choice','auto') NOT IN ('auto','single','planned') OR coalesce(item->>'taxi_mode','none') NOT IN ('none','pickup','pickup_dropoff') THEN RAISE EXCEPTION 'Neplatný spôsob účtovania alebo taxi.'; END IF;
 END LOOP;
 payload:=p_items;
 IF p_operation_id IS NOT NULL THEN
  SELECT * INTO op FROM private.shared_operations_v244 WHERE user_id=auth.uid() AND operation_id=p_operation_id;
  IF op.operation_id IS NOT NULL THEN
   IF op.kind<>'booking' OR op.payload<>payload THEN RAISE EXCEPTION 'Identifikátor bol použitý pre inú rezerváciu.'; END IF;
   RETURN op.result;
  END IF;
 END IF;
 FOR day IN SELECT DISTINCT (value->>'date')::date FROM jsonb_array_elements(p_items) ORDER BY 1 LOOP
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtextextended(day::text,7241));
 END LOOP;
 SELECT coalesce(jsonb_agg(value ORDER BY (value->>'date'),(value->>'dog_id')::bigint),'[]') INTO quote
 FROM jsonb_array_elements(private.shared_plan_v244(own,p_items)) WHERE value->>'kind'='extra';
 IF p_expected IS NULL THEN RETURN jsonb_build_object('quote',quote,'committed',false); END IF;
 IF p_operation_id IS NULL OR p_expected<>quote THEN RAISE EXCEPTION 'Dostupné vstupy sa zmenili. Skontrolujte nové rozdelenie a potvrďte ho znova.'; END IF;
 -- All inserts share one transaction. Any validation failure rolls back every dog and day.
 old_guard:=current_setting('chvostikovo.booking_batch',true);
 PERFORM set_config('chvostikovo.booking_batch','1',true);
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'date',(value->>'dog_id')::bigint LOOP
  SELECT * INTO row FROM public.portal_request_booking((item->>'dog_id')::bigint,(item->>'date')::date,coalesce(item->>'taxi_mode','none'));
  UPDATE public.customer_booking_requests SET billing_choice=coalesce(item->>'billing_choice','auto'),booking_group_id=CASE WHEN cardinality(ids)=2 THEN md5(p_operation_id::text||(item->>'date'))::uuid ELSE NULL END WHERE id=row.id;
 END LOOP;
 PERFORM private.apply_shared_plan_v244(own);
 SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.reservation_date,q.dog_id),'[]') INTO result
 FROM public.customer_booking_requests q WHERE q.user_id=auth.uid() AND q.status='pending'
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) e WHERE q.dog_id=(e->>'dog_id')::bigint AND q.reservation_date=(e->>'date')::date);
 INSERT INTO private.booking_batch_push_events(dog_id,day_count,dates,dog_ids) SELECT ids[1],count(DISTINCT value->>'date')::smallint,array_agg(DISTINCT value->>'date' ORDER BY value->>'date'),ids FROM jsonb_array_elements(p_items);
 result:=jsonb_build_object('bookings',result,'quote',quote,'committed',true);
 INSERT INTO private.shared_operations_v244(user_id,operation_id,kind,payload,result) VALUES(auth.uid(),p_operation_id,'booking',payload,result);
 PERFORM set_config('chvostikovo.booking_batch',coalesce(old_guard,''),true);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_shared_booking_v244(jsonb,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_shared_booking_v244(jsonb,uuid,jsonb) TO authenticated;

CREATE FUNCTION public.portal_link_dog_verified_v244(p_user_id uuid,p_dog_id bigint,p_owner_id bigint,p_intro_confirmed boolean,p_ownership_note text) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff s WHERE s.user_id=auth.uid() AND s.active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 IF p_intro_confirmed IS DISTINCT FROM true OR length(btrim(coalesce(p_ownership_note,'')))<3 THEN RAISE EXCEPTION 'Potvrďte úvodnú návštevu a overenie vlastníctva.'; END IF;
 PERFORM private.lock_pool_v244(p_dog_id);
 IF NOT EXISTS(SELECT 1 FROM public.dogs WHERE id=p_dog_id AND owner_id=p_owner_id AND active) THEN RAISE EXCEPTION 'Majiteľ psíka sa zmenil. Skontrolujte priradenie.'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_owner_links WHERE user_id=p_user_id AND owner_id<>p_owner_id) THEN RAISE EXCEPTION 'Účet je priradený k inému majiteľovi. Vyžaduje manuálnu kontrolu.'; END IF;
 result:=public.portal_link_existing_dog(p_user_id,p_dog_id);
 IF NOT EXISTS(SELECT 1 FROM private.shared_audit_v244 WHERE actor=auth.uid() AND entity='verified_dog_link' AND entity_id=p_user_id::text||':'||p_dog_id::text) THEN
 INSERT INTO private.shared_audit_v244(actor,entity,entity_id,new_value) VALUES(auth.uid(),'verified_dog_link',p_user_id::text||':'||p_dog_id::text,jsonb_build_object('dog_id',p_dog_id,'owner_id',p_owner_id,'intro_confirmed',true,'verification_note',btrim(p_ownership_note)));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_link_dog_verified_v244(uuid,bigint,bigint,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_link_dog_verified_v244(uuid,bigint,bigint,boolean,text) TO authenticated;

CREATE FUNCTION private.registration_names_v244() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE names text[]; n text; ord integer:=0;
BEGIN
 IF new.raw_user_meta_data ? 'dog_names' THEN
  IF jsonb_typeof(new.raw_user_meta_data->'dog_names')<>'array' THEN RAISE EXCEPTION 'Neplatné mená psíkov.'; END IF;
  SELECT array_agg(regexp_replace(btrim(value),'[[:space:]]+',' ','g') ORDER BY ordinality) INTO names FROM jsonb_array_elements_text(new.raw_user_meta_data->'dog_names') WITH ORDINALITY;
  IF cardinality(names) NOT BETWEEN 1 AND 2 OR cardinality(names) IS NULL OR
    EXISTS(SELECT 1 FROM unnest(names) x WHERE length(x) NOT BETWEEN 1 AND 50 OR x ~ '[,;|/[:cntrl:]]') OR
    (SELECT count(DISTINCT lower(x)) FROM unnest(names) x)<>cardinality(names) OR
    (new.raw_user_meta_data->>'dog_count')::integer IS DISTINCT FROM cardinality(names) THEN
   RAISE EXCEPTION 'Zadajte jedno alebo dve odlišné mená psíkov.';
  END IF;
  IF cardinality(names)=2 AND NOT coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false) THEN RAISE EXCEPTION 'Registrácia dvoch psíkov ešte nie je sprístupnená.'; END IF;
  UPDATE public.customer_profiles SET registration_dog_names=names WHERE user_id=new.id;
  FOREACH n IN ARRAY names LOOP
   ord:=ord+1;
   INSERT INTO public.customer_dog_submissions(user_id,dog_name,status) VALUES(new.id,n,'pending');
  END LOOP;
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER z_registration_names_v244 AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.registration_names_v244();
REVOKE ALL ON FUNCTION private.registration_names_v244() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.guard_pass_member_v244() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE own bigint; member_owner bigint; BEGIN
 SELECT d.owner_id INTO own FROM public.passes p JOIN public.dogs d ON d.id=p.dog_id WHERE p.id=new.pass_id;
 SELECT owner_id INTO member_owner FROM public.dogs WHERE id=new.dog_id;
 IF own IS NULL OR own IS DISTINCT FROM member_owner THEN RAISE EXCEPTION 'Spoločná permanentka vyžaduje rovnakého overeného majiteľa.'; END IF;
 PERFORM private.lock_pool_v244(new.dog_id);
 IF (SELECT count(*) FROM public.pass_dogs WHERE pass_id=new.pass_id AND dog_id<>new.dog_id)>=2 THEN RAISE EXCEPTION 'Permanentku môžu zdieľať najviac dvaja psíkovia.'; END IF;
 RETURN new;
END $$;
CREATE TRIGGER guard_pass_member_v244 BEFORE INSERT OR UPDATE ON public.pass_dogs FOR EACH ROW EXECUTE FUNCTION private.guard_pass_member_v244();
REVOKE ALL ON FUNCTION private.guard_pass_member_v244() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.audit_shared_v244() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER shared_visit_audit_v244 AFTER INSERT OR UPDATE OR DELETE ON public.visits FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();

CREATE FUNCTION private.renumber_shared_visits_v244(p_pass bigint) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE base integer; first_day date; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.pass_dogs WHERE pass_id=p_pass) THEN RETURN; END IF;
 SELECT p.used_entries-(SELECT count(*)::integer FROM public.visits v WHERE v.pass_id=p_pass) INTO base FROM public.passes p WHERE id=p_pass;
 IF base<0 THEN RAISE EXCEPTION 'Počet vstupov sa nezhoduje s históriou návštev. Vyžaduje kontrolu personálom.'; END IF;
 WITH ranked AS (SELECT id,base+row_number() OVER(ORDER BY visit_date,id)::integer n FROM public.visits WHERE pass_id=p_pass)
 UPDATE public.visits v SET pass_entry_number=ranked.n FROM ranked WHERE v.id=ranked.id AND v.pass_entry_number IS DISTINCT FROM ranked.n;
 UPDATE public.reservations r SET planned_entry_number=v.pass_entry_number FROM public.visits v WHERE v.reservation_id=r.id AND v.pass_id=p_pass AND r.planned_entry_number IS DISTINCT FROM v.pass_entry_number;
 SELECT min(visit_date) INTO first_day FROM public.visits WHERE pass_id=p_pass;
 IF base=0 THEN
 UPDATE public.passes SET valid_from=first_day,valid_until=CASE WHEN no_expiry OR first_day IS NULL THEN NULL ELSE (first_day+interval '2 months')::date END WHERE id=p_pass;
 END IF;
END $$;
REVOKE ALL ON FUNCTION private.renumber_shared_visits_v244(bigint) FROM PUBLIC,anon,authenticated;
ALTER TABLE public.customer_owner_links ADD CONSTRAINT at_most_two_explicit_dogs_v244 CHECK(allowed_dog_ids IS NULL OR cardinality(allowed_dog_ids)<=2);
CREATE FUNCTION private.guard_owner_scope_v244() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF new.allowed_dog_ids IS NOT NULL AND EXISTS(SELECT 1 FROM unnest(new.allowed_dog_ids) x WHERE NOT EXISTS(SELECT 1 FROM public.dogs WHERE id=x AND owner_id=new.owner_id)) THEN RAISE EXCEPTION 'Priradiť možno iba psíkov overeného majiteľa.'; END IF;
 RETURN new;
END $$;
CREATE TRIGGER guard_owner_scope_v244 BEFORE INSERT OR UPDATE ON public.customer_owner_links FOR EACH ROW EXECUTE FUNCTION private.guard_owner_scope_v244();
REVOKE ALL ON FUNCTION private.guard_owner_scope_v244() FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pass_dogs TO service_role;
ALTER TABLE public.customer_booking_requests ADD COLUMN booking_group_id uuid;
CREATE INDEX booking_group_v244 ON public.customer_booking_requests(booking_group_id) WHERE booking_group_id IS NOT NULL;
ALTER TABLE private.booking_batch_push_events ADD COLUMN dog_ids bigint[];

CREATE FUNCTION public.portal_approve_booking_group_v244(p_group_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.customer_booking_requests%rowtype; own bigint; out_rows jsonb:='[]';
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 SELECT * INTO q FROM public.customer_booking_requests WHERE booking_group_id=p_group_id ORDER BY id LIMIT 1;
 IF q.id IS NULL THEN RAISE EXCEPTION 'Spoločná rezervácia sa nenašla.'; END IF;
 own:=private.lock_pool_v244(q.dog_id);
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status NOT IN ('pending','approved','cancelled','rejected')) THEN RAISE EXCEPTION 'Spoločná rezervácia vyžaduje kontrolu personálom.'; END IF;
 IF EXISTS(SELECT 1 FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status='pending') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtextextended(q.reservation_date::text,7241));
  IF EXISTS(SELECT 1 FROM public.portal_day_settings WHERE day=q.reservation_date AND NOT bookings_open) OR
   ((SELECT count(*) FROM public.reservations WHERE reservation_date=q.reservation_date AND status='booked')+
    (SELECT count(*) FROM public.customer_booking_requests WHERE reservation_date=q.reservation_date AND status='pending'))>
    coalesce((SELECT capacity FROM public.portal_day_settings WHERE day=q.reservation_date),8) THEN
    RAISE EXCEPTION 'Kapacita alebo dostupnosť dňa sa zmenila. Overte rezervácie pred schválením.';
  END IF;
 END IF;
 PERFORM set_config('chvostikovo.group_approval_v244','1',true);
 FOR q IN SELECT * FROM public.customer_booking_requests WHERE booking_group_id=p_group_id AND status IN ('pending','approved') ORDER BY dog_id FOR UPDATE LOOP
  IF NOT private.owns_dog_v244(q.user_id,q.dog_id) THEN RAISE EXCEPTION 'Oprávnenie rezervovať psíka sa zmenilo.'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(ARRAY['rabies','infectious','kennel_cough']) typ WHERE NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type=typ AND v.valid_until>=q.reservation_date))
   OR EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=q.dog_id AND (s.requires_proof_after_id IS NOT NULL OR s.vaccination_type='lepto_l4' AND NOT EXISTS(SELECT 1 FROM public.vaccinations v WHERE v.dog_id=q.dog_id AND v.vaccination_type='lepto_l4' AND v.valid_until>=q.reservation_date))) THEN RAISE EXCEPTION 'Očkovanie niektorého psíka vyžaduje kontrolu.'; END IF;
  SELECT * INTO q FROM public.portal_approve_booking(q.id,NULL);
  out_rows:=out_rows||to_jsonb(q);
 END LOOP;
 PERFORM set_config('chvostikovo.group_approval_v244','',true);
 RETURN out_rows;
END $$;
REVOKE ALL ON FUNCTION public.portal_approve_booking_group_v244(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_approve_booking_group_v244(uuid) TO authenticated;
CREATE TABLE private.shared_release_v244(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false);
ALTER TABLE private.shared_release_v244 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.shared_release_v244 FROM PUBLIC,anon,authenticated;
INSERT INTO private.shared_release_v244(singleton,enabled) VALUES(true,false);
CREATE FUNCTION public.portal_shared_capabilities_v244() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT jsonb_build_object('shared_passes_v244',coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false)) $$;
REVOKE ALL ON FUNCTION public.portal_shared_capabilities_v244() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_shared_capabilities_v244() TO anon,authenticated;
