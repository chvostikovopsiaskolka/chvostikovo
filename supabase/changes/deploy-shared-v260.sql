BEGIN;
DO $baseline$ BEGIN
 IF (SELECT md5(html) FROM public.frontend_snapshots WHERE key='stable-v10-clean') IS DISTINCT FROM 'e8fc02fdd98e98accf81a01f9ea38422' THEN RAISE EXCEPTION 'Admin baseline changed';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='mark_no_show' AND md5(pg_get_functiondef(p.oid))='0ac84765c78c2ef4e56cc79248eb98d6') THEN RAISE EXCEPTION 'Baseline changed: mark_no_show';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_approve_booking' AND md5(pg_get_functiondef(p.oid))='38b166926c78982b60ab6428b511e55a') THEN RAISE EXCEPTION 'Baseline changed: portal_approve_booking';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_approve_pass_request' AND md5(pg_get_functiondef(p.oid))='c03769162cf9757025b5b1e33961e604') THEN RAISE EXCEPTION 'Baseline changed: portal_approve_pass_request';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_cancel_booking' AND md5(pg_get_functiondef(p.oid))='791d1ba817e37769db2d11d68f4a8a91') THEN RAISE EXCEPTION 'Baseline changed: portal_cancel_booking';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_cancel_reservation' AND md5(pg_get_functiondef(p.oid))='74dc13810eb8bd06b91fd97ebeae6bbe') THEN RAISE EXCEPTION 'Baseline changed: portal_cancel_reservation';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_mark_pass_interest_handled' AND md5(pg_get_functiondef(p.oid))='fbb3c23170431109d4d4284917692cd4') THEN RAISE EXCEPTION 'Baseline changed: portal_mark_pass_interest_handled';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_reject_booking' AND md5(pg_get_functiondef(p.oid))='607485fe07cb85ae1776a5e99dab3999') THEN RAISE EXCEPTION 'Baseline changed: portal_reject_booking';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_reject_pass_request' AND md5(pg_get_functiondef(p.oid))='edea8bca4ab3d10ef812a1b92543dfb4') THEN RAISE EXCEPTION 'Baseline changed: portal_reject_pass_request';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_request_booking' AND md5(pg_get_functiondef(p.oid))='9a031ea0251cd0f39697a29b8fc6beff') THEN RAISE EXCEPTION 'Baseline changed: portal_request_booking';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_request_pass' AND md5(pg_get_functiondef(p.oid))='f8314a48862c28e3248b9445b37ce15b') THEN RAISE EXCEPTION 'Baseline changed: portal_request_pass';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='purchase_pass' AND md5(pg_get_functiondef(p.oid))='2078559e0f5270ae1e649db38423cc9e') THEN RAISE EXCEPTION 'Baseline changed: purchase_pass';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='set_pass_role' AND md5(pg_get_functiondef(p.oid))='896a62ddc2589cd70782b7f2c31e4eb1') THEN RAISE EXCEPTION 'Baseline changed: set_pass_role';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='set_pass_used_entries' AND md5(pg_get_functiondef(p.oid))='1f299ec0d632b928be0d927ab0b7c51f') THEN RAISE EXCEPTION 'Baseline changed: set_pass_used_entries';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='ensure_current_pass' AND md5(pg_get_functiondef(p.oid))='b732b75a3aa009638982b301b18b3d09') THEN RAISE EXCEPTION 'Baseline changed: ensure_current_pass';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='finalize_day' AND md5(pg_get_functiondef(p.oid))='6601f37762c1770c3bbbe29a8a4c6ec3') THEN RAISE EXCEPTION 'Baseline changed: finalize_day';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='refresh_daily_financial' AND md5(pg_get_functiondef(p.oid))='94b9fc1b56c23206a15a417e1dd59624') THEN RAISE EXCEPTION 'Baseline changed: refresh_daily_financial';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='replan_after_pass_change' AND md5(pg_get_functiondef(p.oid))='6dcbf9f0c6a20d3a401d2050991e10e9') THEN RAISE EXCEPTION 'Baseline changed: replan_after_pass_change';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='replan_after_reservation_change' AND md5(pg_get_functiondef(p.oid))='dd19abacb255949908be87a0e29a5d28') THEN RAISE EXCEPTION 'Baseline changed: replan_after_reservation_change';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='replan_dog_reservations' AND md5(pg_get_functiondef(p.oid))='5b4663457048d53fdad7260825030489') THEN RAISE EXCEPTION 'Baseline changed: replan_dog_reservations';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_request_bookings_batch' AND md5(pg_get_functiondef(p.oid))='299b769a27947c05fdd72b90d8658928') THEN RAISE EXCEPTION 'Baseline changed: portal_request_bookings_batch';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_request_dogs_batch_v254' AND md5(pg_get_functiondef(p.oid))='78f444ccf3b67374c4e0efeec3ac6c95') THEN RAISE EXCEPTION 'Baseline changed: portal_request_dogs_batch_v254';END IF;
IF NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname='portal_request_late_booking' AND md5(pg_get_functiondef(p.oid))='7b0e93d2eacbe2dd11862f4300d8bdfc') THEN RAISE EXCEPTION 'Baseline changed: portal_request_late_booking';END IF;
END $baseline$;
CREATE TABLE private.shared_baseline_v260 AS SELECT now() AS saved_at,jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid))) AS functions FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.proname IN ('mark_no_show','portal_approve_booking','portal_approve_pass_request','portal_cancel_booking','portal_cancel_reservation','portal_mark_pass_interest_handled','portal_reject_booking','portal_reject_pass_request','portal_request_booking','portal_request_pass','purchase_pass','set_pass_role','set_pass_used_entries','ensure_current_pass','finalize_day','refresh_daily_financial','replan_after_pass_change','replan_after_reservation_change','replan_dog_reservations','portal_request_bookings_batch','portal_request_dogs_batch_v254','portal_request_late_booking');
ALTER TABLE private.shared_baseline_v260 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.shared_baseline_v260 FROM PUBLIC,anon,authenticated;
INSERT INTO public.frontend_snapshots(key,html) SELECT 'backup-admin-before-shared-v260-20261016',html FROM public.frontend_snapshots WHERE key='stable-v10-clean';
ALTER TABLE public.customer_pass_requests ADD COLUMN dog_ids bigint[];
ALTER TABLE public.customer_booking_requests ADD COLUMN projected_pass_id bigint REFERENCES public.passes(id);
ALTER TABLE public.customer_booking_requests ADD COLUMN billing_choice text NOT NULL DEFAULT 'auto' CHECK (billing_choice IN ('auto','single','planned'));
ALTER TABLE public.reservations ADD COLUMN billing_choice text NOT NULL DEFAULT 'auto' CHECK (billing_choice IN ('auto','single','planned'));
CREATE TABLE public.pass_dogs (
  pass_id bigint NOT NULL REFERENCES public.passes(id) ON DELETE RESTRICT,
  dog_id bigint NOT NULL REFERENCES public.dogs(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
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
 OR EXISTS(SELECT 1 FROM public.customer_pass_requests q WHERE cardinality(q.dog_ids)=2 AND p_dog=ANY(q.dog_ids) AND q.status='pending')
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

CREATE TRIGGER pass_purchase_audit_v244 AFTER INSERT OR UPDATE OR DELETE ON public.passes FOR EACH ROW EXECUTE FUNCTION private.audit_shared_v244();

-- Pure chronological planner. The same result drives preview, commit and replanning.
CREATE FUNCTION private.shared_plan_v244(p_owner bigint,p_extra jsonb DEFAULT '[]') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rec record; p public.passes%rowtype; interest public.customer_pass_requests%rowtype;
 used_map jsonb:='{}'; first_map jsonb:='{}'; virtual_map jsonb:='{}'; out_rows jsonb:='[]';
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
    AND (pp.no_expiry OR coalesce(pp.valid_until,((first_map->>pp.id::text)::date+interval '2 months')::date,rec.reservation_date)>=rec.reservation_date)
    AND coalesce((used_map->>pp.id::text)::integer,pp.used_entries)<pp.total_entries
    AND (NOT rec.pass_locked OR pp.id=rec.pass_id)
   ORDER BY CASE pp.status WHEN 'active' THEN 0 ELSE 1 END,coalesce(pp.valid_from,pp.purchased_on,pp.created_at::date),pp.id LIMIT 1;
   IF p.id IS NOT NULL THEN
    num:=coalesce((used_map->>p.id::text)::integer,p.used_entries)+1;
    used_map:=jsonb_set(used_map,ARRAY[p.id::text],to_jsonb(num));
    IF NOT first_map ? p.id::text THEN first_map:=jsonb_set(first_map,ARRAY[p.id::text],to_jsonb(rec.reservation_date));END IF;chosen:=p.id;total:=p.total_entries;mode:='pass';
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
 PERFORM set_config('chvostikovo.shared_quote_v257','1',true);
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
 PERFORM set_config('chvostikovo.shared_quote_v257','',true);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_shared_booking_v244(jsonb,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_shared_booking_v244(jsonb,uuid,jsonb) TO authenticated;

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
GRANT SELECT ON public.pass_dogs TO service_role;
ALTER TABLE public.customer_booking_requests ADD COLUMN booking_group_id uuid;
CREATE INDEX booking_group_v244 ON public.customer_booking_requests(booking_group_id) WHERE booking_group_id IS NOT NULL;


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
CREATE OR REPLACE FUNCTION private.replan_individual_v243(p_dog_id bigint, p_from_date date DEFAULT NULL::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_from date := greatest(coalesce(p_from_date,(clock_timestamp() at time zone 'Europe/Bratislava')::date),date '2026-08-25');
  v_interest public.customer_pass_requests%rowtype;
  v_assign jsonb := '{}'::jsonb;
  v_virtual integer := 0;
  v_current integer;
  v_number integer;
  v_pass public.passes%rowtype;
  v_row record;
  v_type text;
  v_total integer;
  v_default_type text;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(p_dog_id);
  SELECT default_entry_type INTO v_default_type FROM public.dogs WHERE id=p_dog_id;
  IF v_default_type='free' THEN
    UPDATE public.customer_booking_requests SET projected_entry_number=NULL,projected_pass_total=NULL,planned_pass_request_id=NULL
     WHERE dog_id=p_dog_id AND status='pending'
       AND (projected_entry_number IS NOT NULL OR projected_pass_total IS NOT NULL OR planned_pass_request_id IS NOT NULL);
    RETURN;
  END IF;
  PERFORM private.ensure_current_pass(p_dog_id);
  SELECT * INTO v_interest FROM public.customer_pass_requests
   WHERE dog_id=p_dog_id AND status='pending'
   ORDER BY requested_at,id LIMIT 1;
  -- Include pending requests in the same chronological ledger as booked visits.
  -- A pending interest has no pass row, price, or usage.
  FOR v_row IN
    SELECT 'reservation' AS kind,r.id,r.reservation_date,r.entry_type,
           r.pass_locked,r.pass_id,r.source_label,r.source_ref
      FROM public.reservations r
     WHERE r.dog_id=p_dog_id AND r.status='booked' AND r.reservation_date>=v_from
       AND (r.entry_type='pass'
         OR r.source_label='Čaká na kúpu permanentky'
         OR (r.source='customer_portal' AND v_interest.id IS NOT NULL AND r.entry_type='single'))
    UNION ALL
    SELECT 'request',q.id,q.reservation_date,NULL::text,false,NULL::bigint,NULL::text,NULL::text
      FROM public.customer_booking_requests q
     WHERE q.dog_id=p_dog_id AND q.status='pending' AND q.reservation_date>=v_from
    ORDER BY reservation_date,kind,id
  LOOP
    v_pass := NULL;
    v_type := null;
    IF v_row.kind='reservation' AND v_row.pass_locked AND v_row.pass_id IS NOT NULL THEN
      SELECT * INTO v_pass FROM public.passes WHERE id=v_row.pass_id AND dog_id=p_dog_id;
    ELSE
      SELECT * INTO v_pass FROM public.passes pp
       WHERE pp.dog_id=p_dog_id AND pp.status IN ('active','queued')
         AND pp.used_entries<pp.total_entries
         AND (pp.valid_from IS NULL OR pp.valid_from<=v_row.reservation_date)
         AND (coalesce(pp.no_expiry,false) OR pp.valid_until IS NULL OR pp.valid_until>=v_row.reservation_date)
         AND coalesce((v_assign->>(pp.id::text))::integer,pp.used_entries)<pp.total_entries
       ORDER BY CASE WHEN pp.status='active' THEN 0 ELSE 1 END,
                coalesce(pp.valid_from,pp.purchased_on,date '1900-01-01'),pp.created_at,pp.id
       LIMIT 1;
    END IF;
    IF v_pass.id IS NOT NULL THEN
      v_current := coalesce((v_assign->>(v_pass.id::text))::integer,v_pass.used_entries);
      v_number := CASE WHEN v_row.pass_locked AND v_row.kind='reservation'
                      THEN greatest(v_current+1,coalesce((SELECT planned_entry_number FROM public.reservations WHERE id=v_row.id),0))
                      ELSE v_current+1 END;
      IF v_number<=v_pass.total_entries THEN
        v_assign := jsonb_set(v_assign,ARRAY[v_pass.id::text],to_jsonb(v_number),true);
        v_type := 'pass';
        v_total := v_pass.total_entries;
      END IF;
    END IF;
    IF v_type IS NULL AND v_interest.id IS NOT NULL AND v_virtual<v_interest.total_entries THEN
      v_virtual := v_virtual+1;
      v_number := v_virtual;
      v_total := v_interest.total_entries;
      v_type := 'unpaid';
    END IF;
    IF v_row.kind='request' THEN
      UPDATE public.customer_booking_requests
         SET projected_entry_number=CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
             projected_pass_total=CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
             planned_pass_request_id=CASE WHEN v_type='unpaid' THEN v_interest.id ELSE NULL END
       WHERE id=v_row.id
         AND (projected_entry_number,projected_pass_total,planned_pass_request_id)
             IS DISTINCT FROM
             (CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
              CASE WHEN v_type='unpaid' THEN v_interest.id ELSE NULL END);
    ELSIF NOT v_row.pass_locked THEN
      UPDATE public.reservations
         SET entry_type=CASE WHEN v_type='pass' THEN 'pass' ELSE 'single' END,
             pass_id=CASE WHEN v_type='pass' THEN v_pass.id ELSE NULL END,
             planned_entry_number=CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
             planned_pass_total=CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
             source_label=CASE WHEN v_type='unpaid' THEN 'Čaká na kúpu permanentky'
                               WHEN source_label='Čaká na kúpu permanentky' THEN NULL ELSE source_label END
       WHERE id=v_row.id
         AND (entry_type,pass_id,planned_entry_number,planned_pass_total,source_label)
             IS DISTINCT FROM
             (CASE WHEN v_type='pass' THEN 'pass' ELSE 'single' END,
              CASE WHEN v_type='pass' THEN v_pass.id ELSE NULL END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_number END,
              CASE WHEN v_type IS NULL THEN NULL ELSE v_total END,
              CASE WHEN v_type='unpaid' THEN 'Čaká na kúpu permanentky'
                    WHEN v_row.source_label='Čaká na kúpu permanentky' THEN NULL ELSE v_row.source_label END);
    END IF;
  END LOOP;
  -- Keep already approved customer cards in step with the reservation ledger,
  -- including purchase confirmation or a handled interest without a purchase.
  UPDATE public.customer_booking_requests q
     SET projected_entry_number=r.planned_entry_number,
         projected_pass_total=r.planned_pass_total,
         planned_pass_request_id=CASE WHEN r.source_label='Čaká na kúpu permanentky'
                                      THEN v_interest.id ELSE NULL END
    FROM public.reservations r
   WHERE q.dog_id=p_dog_id AND q.status='approved' AND q.reservation_id=r.id
     AND r.reservation_date>=v_from AND r.status='booked'
     AND (q.projected_entry_number,q.projected_pass_total,q.planned_pass_request_id)
         IS DISTINCT FROM
         (r.planned_entry_number,r.planned_pass_total,
          CASE WHEN r.source_label='Čaká na kúpu permanentky' THEN v_interest.id ELSE NULL END);
END
$function$;
REVOKE ALL ON FUNCTION private.replan_individual_v243(bigint,date) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.replan_dog_reservations(p_dog_id bigint,p_from_date date DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE own bigint; BEGIN
 IF current_setting('chvostikovo.shared_planning',true)='1' THEN RETURN; END IF;
 IF private.shared_dog_v244(p_dog_id) THEN
  own:=private.lock_pool_v244(p_dog_id); PERFORM private.apply_shared_plan_v244(own);
 ELSE PERFORM private.replan_individual_v243(p_dog_id,p_from_date); END IF;
END $$;
CREATE OR REPLACE FUNCTION public.portal_request_booking(p_dog_id bigint, p_reservation_date date, p_taxi_mode text DEFAULT 'none'::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_booking_late_exception boolean := false;
  v_capacity integer := 8;
  v_taken integer := 0;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
  v_row public.customer_booking_requests%rowtype;
  v_taxi_mode text := coalesce(nullif(btrim(p_taxi_mode), ''), 'none');
  v_taxi_amount numeric(10,2);
  v_default_entry_type text;
begin
  perform private.lock_pool_v244(p_dog_id);
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if v_taxi_mode not in ('none', 'pickup', 'pickup_dropoff') then
    raise exception 'Neplatná voľba taxi.';
  end if;
  v_taxi_amount := case v_taxi_mode when 'pickup' then 5 when 'pickup_dropoff' then 10 else 0 end;

  if p_reservation_date <= v_now_local::date
     or extract(isodow from p_reservation_date) not between 1 and 5
     or p_reservation_date > v_now_local::date + 21 then
    raise exception 'Rezervovať je možné pracovné dni najviac 3 týždne dopredu.';
  end if;

  v_deadline := (p_reservation_date - extract(isodow from p_reservation_date)::integer)::timestamp + time '20:00';

  select d.default_entry_type, coalesce(d.booking_late_exception,false)
    into v_default_entry_type,v_booking_late_exception
  from public.customer_owner_links l
  join public.dogs d on d.owner_id = l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
  where l.user_id = v_uid
    and d.id = p_dog_id
    and d.active = true
  limit 1;

  if v_default_entry_type is null then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;
  if not v_booking_late_exception and current_setting('chvostikovo.late_request',true) IS DISTINCT FROM '1' and v_now_local >= v_deadline then
    raise exception 'Rezervácie na tento týždeň sa uzavreli v nedeľu o 20:00. Napíšte nám správu.';
  end if;

  if exists (
    select 1
    from (values ('rabies'::text),('infectious'::text),('kennel_cough'::text)) required(vaccination_type)
    where not exists (
      select 1
      from public.vaccinations v
      where v.dog_id = p_dog_id
        and v.vaccination_type = required.vaccination_type
        and v.valid_until is not null
        and v.valid_until >= p_reservation_date
    )
  ) then
    raise exception 'Pred rezerváciou doplňte platnosť všetkých povinných očkovaní tak, aby platili v deň rezervácie.';
  end if;

  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.vaccination_type='lepto_l4')
    and not exists (select 1 from public.vaccinations v where v.dog_id=p_dog_id and v.vaccination_type='lepto_l4' and v.valid_until>=p_reservation_date) then
    raise exception 'Leptospiróza L4 nie je platná v deň návštevy. Aktualizujte dátum aj fotografiu očkovania.';
  end if;
  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.requires_proof_after_id is not null) then
    raise exception 'Po obnovení očkovania nahrajte novú fotografiu očkovacieho preukazu.';
  end if;
  if not exists (
    select 1
    from public.vaccination_proofs vp
    where vp.dog_id = p_dog_id
      and vp.is_current = true
  ) then
    raise exception 'Pred rezerváciou nahrajte aspoň jednu fotografiu očkovacieho preukazu.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_reservation_date::text, 7241));

  if exists (
    select 1 from public.reservations r
    where r.dog_id = p_dog_id
      and r.reservation_date = p_reservation_date
      and r.status = 'booked'
  ) or exists (
    select 1 from public.customer_booking_requests q
    where q.dog_id = p_dog_id
      and q.reservation_date = p_reservation_date
      and q.status in ('pending', 'approved', 'cancel_requested')
  ) then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
  end if;

  select coalesce(s.capacity, 8) into v_capacity
  from (select p_reservation_date as day) x
  left join public.portal_day_settings s on s.day = x.day;

  if exists (
    select 1 from public.portal_day_settings
    where day = p_reservation_date and bookings_open = false
  ) then
    raise exception 'Rezervácie na tento deň sú zatvorené.';
  end if;

  select
    (select count(*) from public.reservations r where r.reservation_date = p_reservation_date and r.status = 'booked') +
    (select count(*) from public.customer_booking_requests q where q.reservation_date = p_reservation_date and q.status = 'pending')
  into v_taken;

  if v_taken >= v_capacity then
    raise exception 'Na tento deň už nie je voľné miesto.';
  end if;

  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,projected_entry_number,
    projected_pass_total,taxi_mode,taxi_amount
  ) values (v_uid,p_dog_id,p_reservation_date,null,null,v_taxi_mode,v_taxi_amount)
  returning * into v_row;
  perform private.replan_dog_reservations(p_dog_id,v_now_local::date);
  select * into v_row from public.customer_booking_requests where id=v_row.id;

  return v_row;
exception
  when unique_violation then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_request_booking(p_dog_id bigint, p_reservation_date date, p_taxi_mode text DEFAULT 'none'::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_booking_late_exception boolean := false;
  v_capacity integer := 8;
  v_taken integer := 0;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
  v_row public.customer_booking_requests%rowtype;
  v_taxi_mode text := coalesce(nullif(btrim(p_taxi_mode), ''), 'none');
  v_taxi_amount numeric(10,2);
  v_default_entry_type text;
begin
  perform private.lock_pool_v244(p_dog_id);
  if private.shared_dog_v244(p_dog_id) and current_setting('chvostikovo.shared_quote_v257',true) is distinct from '1' then raise exception 'Obnovte aplikáciu a skontrolujte rozdelenie vstupov spoločnej permanentky.';end if;
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if v_taxi_mode not in ('none', 'pickup', 'pickup_dropoff') then
    raise exception 'Neplatná voľba taxi.';
  end if;
  v_taxi_amount := case v_taxi_mode when 'pickup' then 5 when 'pickup_dropoff' then 10 else 0 end;

  if p_reservation_date <= v_now_local::date
     or extract(isodow from p_reservation_date) not between 1 and 5
     or p_reservation_date > v_now_local::date + 21 then
    raise exception 'Rezervovať je možné pracovné dni najviac 3 týždne dopredu.';
  end if;

  v_deadline := (p_reservation_date - extract(isodow from p_reservation_date)::integer)::timestamp + time '20:00';

  select d.default_entry_type, coalesce(d.booking_late_exception,false)
    into v_default_entry_type,v_booking_late_exception
  from public.customer_owner_links l
  join public.dogs d on d.owner_id = l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
  where l.user_id = v_uid
    and d.id = p_dog_id
    and d.active = true
  limit 1;

  if v_default_entry_type is null then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;
  if not v_booking_late_exception and current_setting('chvostikovo.late_request',true) IS DISTINCT FROM '1' and v_now_local >= v_deadline then
    raise exception 'Rezervácie na tento týždeň sa uzavreli v nedeľu o 20:00. Napíšte nám správu.';
  end if;

  if exists (
    select 1
    from (values ('rabies'::text),('infectious'::text),('kennel_cough'::text)) required(vaccination_type)
    where not exists (
      select 1
      from public.vaccinations v
      where v.dog_id = p_dog_id
        and v.vaccination_type = required.vaccination_type
        and v.valid_until is not null
        and v.valid_until >= p_reservation_date
    )
  ) then
    raise exception 'Pred rezerváciou doplňte platnosť všetkých povinných očkovaní tak, aby platili v deň rezervácie.';
  end if;

  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.vaccination_type='lepto_l4')
    and not exists (select 1 from public.vaccinations v where v.dog_id=p_dog_id and v.vaccination_type='lepto_l4' and v.valid_until>=p_reservation_date) then
    raise exception 'Leptospiróza L4 nie je platná v deň návštevy. Aktualizujte dátum aj fotografiu očkovania.';
  end if;
  if exists (select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.requires_proof_after_id is not null) then
    raise exception 'Po obnovení očkovania nahrajte novú fotografiu očkovacieho preukazu.';
  end if;
  if not exists (
    select 1
    from public.vaccination_proofs vp
    where vp.dog_id = p_dog_id
      and vp.is_current = true
  ) then
    raise exception 'Pred rezerváciou nahrajte aspoň jednu fotografiu očkovacieho preukazu.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_reservation_date::text, 7241));

  if exists (
    select 1 from public.reservations r
    where r.dog_id = p_dog_id
      and r.reservation_date = p_reservation_date
      and r.status = 'booked'
  ) or exists (
    select 1 from public.customer_booking_requests q
    where q.dog_id = p_dog_id
      and q.reservation_date = p_reservation_date
      and q.status in ('pending', 'approved', 'cancel_requested')
  ) then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
  end if;

  select coalesce(s.capacity, 8) into v_capacity
  from (select p_reservation_date as day) x
  left join public.portal_day_settings s on s.day = x.day;

  if exists (
    select 1 from public.portal_day_settings
    where day = p_reservation_date and bookings_open = false
  ) then
    raise exception 'Rezervácie na tento deň sú zatvorené.';
  end if;

  select
    (select count(*) from public.reservations r where r.reservation_date = p_reservation_date and r.status = 'booked') +
    (select count(*) from public.customer_booking_requests q where q.reservation_date = p_reservation_date and q.status = 'pending')
  into v_taken;

  if v_taken >= v_capacity then
    raise exception 'Na tento deň už nie je voľné miesto.';
  end if;

  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,projected_entry_number,
    projected_pass_total,taxi_mode,taxi_amount
  ) values (v_uid,p_dog_id,p_reservation_date,null,null,v_taxi_mode,v_taxi_amount)
  returning * into v_row;
  perform private.replan_dog_reservations(p_dog_id,v_now_local::date);
  select * into v_row from public.customer_booking_requests where id=v_row.id;

  return v_row;
exception
  when unique_violation then
    raise exception 'Psík už má na tento deň rezerváciu alebo žiadosť čakajúcu na potvrdenie.';
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_request_pass(p_dog_id bigint, p_total_entries integer)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.customer_pass_requests%rowtype;
  v_today date := (now() at time zone 'Europe/Bratislava')::date;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
begin
  perform private.lock_pool_v244(p_dog_id);
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if p_total_entries <> 10 then
    raise exception 'Zákaznícky portál umožňuje prejaviť záujem iba o 10-vstupovú permanentku.';
  end if;

  if exists(
    select 1 from public.customer_profiles
    where user_id=v_uid and status='suspended'
  ) then
    raise exception 'Účet je pozastavený. Kontaktujte Chvostíkovo telefonicky.';
  end if;

  if not exists (
    select 1
      from public.customer_owner_links l
      join public.dogs d on d.owner_id=l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
     where l.user_id=v_uid and d.id=p_dog_id and d.active=true
  ) then
    raise exception 'Tento psík nie je priradený k vášmu účtu.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(p_dog_id);

  if exists (
    select 1 from public.customer_pass_requests
     where dog_id=p_dog_id and status='pending'
  ) then
    raise exception 'Záujem o novú permanentku už evidujeme.';
  end if;

  if exists (
    select 1 from public.passes
     where dog_id=p_dog_id
       and status='queued'
       and used_entries<total_entries
  ) then
    raise exception 'Psík už má pripravenú ďalšiu permanentku.';
  end if;

  select * into v_pass
    from public.passes
   where dog_id=p_dog_id
     and status='active'
     and used_entries<total_entries
     and (coalesce(no_expiry,false) or valid_until is null or valid_until>=v_today)
   order by coalesce(valid_from,purchased_on,created_at::date),id
   limit 1;

  if v_pass.id is not null then
    select
      (select count(*)
         from public.reservations r
        where r.dog_id=p_dog_id
          and r.status='booked'
          and r.entry_type='pass'
          and r.reservation_date>=v_today)
      +
      (select count(*)
         from public.customer_booking_requests q
        where q.dog_id=p_dog_id
          and q.status='pending'
          and q.reservation_date>=v_today
          and q.projected_pass_total=v_pass.total_entries)
      into v_future_pass_count;

    if v_pass.used_entries + v_future_pass_count < v_pass.total_entries then
      raise exception 'Záujem o novú permanentku môžete odoslať po rezervovaní posledného vstupu z aktuálnej permanentky.';
    end if;
  end if;

  if not private.recent_pass_renewal_eligible(p_dog_id) then
    raise exception 'Novú permanentku možno naplánovať iba po poslednom rezervovanom vstupe alebo po nedávnom skončení permanentky.';
  end if;

  insert into public.customer_pass_requests(user_id,dog_id,total_entries)
  values(v_uid,p_dog_id,10)
  returning * into v_row;

  perform private.replan_dog_reservations(p_dog_id,v_today);
  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_cancel_reservation(p_reservation_id bigint, p_reason text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_reservation public.reservations%rowtype;
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_reason text := nullif(left(btrim(coalesce(p_reason,'')),500),'');
  v_row public.customer_booking_requests%rowtype;
begin
  perform private.lock_pool_v244((select dog_id from public.reservations where id=p_reservation_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select r.* into v_reservation from public.reservations r
  join public.dogs d on d.id=r.dog_id
  join public.customer_owner_links l on l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
  where r.id=p_reservation_id and r.status='booked' and l.user_id=v_uid for update of r;
  if v_reservation.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_reservation.reservation_date-1)::timestamp + time '21:00';
  if v_now_local > v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 21:00. Kontaktujte Chvostíkovo.';
  end if;
  update public.reservations set status='cancelled' where id=v_reservation.id;
  -- Both linked owners see the same final state after a reservation cancellation.
  update public.customer_booking_requests
     set status='cancelled',cancelled_at=clock_timestamp(),cancellation_reason=v_reason
   where reservation_id=v_reservation.id and status in ('approved','cancel_requested');
  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,status,reservation_id,projected_entry_number,projected_pass_total,
    taxi_mode,taxi_amount,cancellation_reason,cancelled_at
  ) values (
    v_uid,v_reservation.dog_id,v_reservation.reservation_date,'cancelled',v_reservation.id,
    v_reservation.planned_entry_number,v_reservation.planned_pass_total,
    coalesce(v_reservation.taxi_mode,'none'),coalesce(v_reservation.taxi_amount,0),v_reason,now()
  ) returning * into v_row;
  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_approve_pass_request(p_request_id bigint, p_decision_note text DEFAULT NULL::text)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_request public.customer_pass_requests%rowtype;
  v_status text;
  v_price numeric(10,2);
  v_pass_id bigint;
  v_today date := (now() at time zone 'Europe/Bratislava')::date;
begin
  if v_staff is null or not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  perform private.lock_pool_v244((select dog_id from public.customer_pass_requests where id=p_request_id));
  select * into v_request
  from public.customer_pass_requests
  where id = p_request_id
  for update;

  if v_request.id is null then raise exception 'Žiadosť sa nenašla.'; end if;
  if v_request.status='approved' then return v_request; end if;
  perform private.lock_pool_v244(v_request.dog_id);
  if v_request.status <> 'pending' then raise exception 'Žiadosť už bola spracovaná.'; end if;

  update public.passes
  set status = 'expired'
  where (dog_id = v_request.dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=v_request.dog_id))
    and status = 'active'
    and not coalesce(no_expiry,false)
    and valid_until is not null
    and valid_until < v_today;

  v_price := case when v_request.total_entries = 20 then 320.00 else 200.00 end;
  if exists (
    select 1 from public.passes
    where (dog_id = v_request.dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=v_request.dog_id))
      and status = 'active'
      and used_entries < total_entries
      and (coalesce(no_expiry,false) or valid_until is null or valid_until >= v_today)
  ) then
    v_status := 'queued';
  else
    v_status := 'active';
  end if;

  insert into public.passes (
    dog_id, total_entries, used_entries, purchased_on, purchase_price,
    valid_from, valid_until, no_expiry, status, source
  ) values (
    v_request.dog_id, v_request.total_entries, 0, v_today, v_price,
    null, null, false, v_status, 'customer_portal'
  ) returning id into v_pass_id;

  if cardinality(v_request.dog_ids)=2 then
    if (select count(distinct d.owner_id) from public.dogs d where d.id=ANY(v_request.dog_ids))<>1
       or exists(select 1 from unnest(v_request.dog_ids) x where not private.owns_dog_v244(v_request.user_id,x)) then
      raise exception 'Vlastníctvo psíkov sa zmenilo. Skontrolujte žiadosť.';
    end if;
    insert into public.pass_dogs(pass_id,dog_id,approved_by) select v_pass_id,x,v_staff from unnest(v_request.dog_ids) x;
  end if;
  update public.dogs
  set default_entry_type = 'pass'
  where id = v_request.dog_id or id=ANY(v_request.dog_ids);

  update public.customer_pass_requests
  set status = 'approved', pass_id = v_pass_id, decided_at = now(),
      decided_by = v_staff, decision_note = nullif(btrim(p_decision_note), '')
  where id = p_request_id
  returning * into v_request;

  insert into public.portal_notifications (
    recipient_user_id, notification_type, title, body, entity_type, entity_id
  ) values (
    v_request.user_id,
    'pass_request_approved',
    'Kúpa permanentky potvrdená',
    'Potvrdili sme kúpu ' || v_request.total_entries || '-vstupovej permanentky. Platnosť začne plynúť prvým využitím.',
    'pass_request',
    v_request.id
  );

  perform private.replan_dog_reservations(v_request.dog_id,v_today);
  return v_request;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_approve_booking(p_request_id bigint, p_decision_note text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_row public.customer_booking_requests%rowtype;
  v_pass public.passes%rowtype;
  v_existing public.reservations%rowtype;
  v_reservation_id bigint;
  v_entry_type text := 'single';
  v_planned integer;
  v_default_entry_type text;
begin
  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));
  if not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_row
  from public.customer_booking_requests
  where id = p_request_id
  for update;

  if v_row.id is null then raise exception 'Žiadosť sa nenašla.'; end if;
  if v_row.status='approved' then return v_row; end if;
  if v_row.booking_group_id is not null and current_setting('chvostikovo.group_approval_v244',true) is distinct from '1' then
    perform public.portal_approve_booking_group_v244(v_row.booking_group_id);
    select * into v_row from public.customer_booking_requests where id=p_request_id;
    return v_row;
  end if;
  perform private.lock_pool_v244(v_row.dog_id);
  perform private.replan_dog_reservations(v_row.dog_id);
  select * into v_row from public.customer_booking_requests where id=p_request_id;
  if v_row.status <> 'pending' then raise exception 'Žiadosť už bola spracovaná.'; end if;

  select d.default_entry_type
    into v_default_entry_type
  from public.dogs d
  where d.id=v_row.dog_id;

  if v_default_entry_type='free' then
    v_entry_type:='free';
    v_pass:=null;
    v_planned:=null;
  elsif v_row.planned_pass_request_id is not null
        and exists (select 1 from public.customer_pass_requests
                    where id=v_row.planned_pass_request_id and (dog_id=v_row.dog_id or v_row.dog_id=ANY(dog_ids)) and status='pending') then
    v_entry_type:='single';
    v_pass:=null;
    v_planned:=v_row.projected_entry_number;
  elsif v_row.projected_pass_total is not null then
    select * into v_pass from public.passes
     where (dog_id=v_row.dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=v_row.dog_id)) and (v_row.projected_pass_id is null or id=v_row.projected_pass_id) and status in ('active','queued')
       and used_entries<total_entries
       and (valid_from is null or valid_from<=v_row.reservation_date)
       and (coalesce(no_expiry,false) or valid_until is null or valid_until>=v_row.reservation_date)
     order by case when status='active' then 0 else 1 end,
              coalesce(valid_from,purchased_on,created_at::date),id limit 1;
    if v_pass.id is not null then
      v_entry_type:='pass';
      v_planned:=v_row.projected_entry_number;
    end if;
  end if;

  select * into v_existing
  from public.reservations
  where dog_id = v_row.dog_id
    and reservation_date = v_row.reservation_date
  for update;

  if v_existing.id is not null then
    if v_existing.status = 'cancelled' then
      update public.reservations
      set entry_type = v_entry_type,
          status = 'booked',
          pass_id = case when v_entry_type='pass' then v_pass.id else null end,
          source = 'customer_portal',
          source_ref = 'portal_request:' || v_row.id,
          source_label = case when v_row.planned_pass_request_id is not null then 'Čaká na kúpu permanentky' else 'Zákaznícky portál' end,
          planned_entry_number = case when v_entry_type='pass' or v_row.planned_pass_request_id is not null then v_planned else null end,
          planned_pass_total = case when v_entry_type='pass' then v_pass.total_entries when v_row.planned_pass_request_id is not null then v_row.projected_pass_total else null end,
          pass_locked = false,
          taxi_service = case v_row.taxi_mode when 'pickup_dropoff' then 'roundtrip' else v_row.taxi_mode end,
          taxi_amount = v_row.taxi_amount,
          taxi_mode = v_row.taxi_mode
      where id = v_existing.id
      returning id into v_reservation_id;
    elsif v_existing.status = 'booked' then
      v_reservation_id := v_existing.id;
      update public.reservations
      set taxi_service = case v_row.taxi_mode when 'pickup_dropoff' then 'roundtrip' else v_row.taxi_mode end,
          taxi_amount = v_row.taxi_amount,
          taxi_mode = v_row.taxi_mode
      where id = v_existing.id;
    else
      raise exception 'Pre tento deň už existuje dochádzka, ktorú nemožno znovu schváliť.';
    end if;
  else
    insert into public.reservations (
      dog_id, reservation_date, entry_type, status, pass_id,
      source, source_ref, source_label,
      planned_entry_number, planned_pass_total, pass_locked,
      taxi_service, taxi_amount, taxi_mode
    ) values (
      v_row.dog_id, v_row.reservation_date, v_entry_type, 'booked',
      case when v_entry_type='pass' then v_pass.id else null end,
      'customer_portal', 'portal_request:' || v_row.id, case when v_row.planned_pass_request_id is not null then 'Čaká na kúpu permanentky' else 'Zákaznícky portál' end,
      case when v_entry_type='pass' or v_row.planned_pass_request_id is not null then v_planned else null end,
      case when v_entry_type='pass' then v_pass.total_entries when v_row.planned_pass_request_id is not null then v_row.projected_pass_total else null end,
      false,
      case v_row.taxi_mode when 'pickup_dropoff' then 'roundtrip' else v_row.taxi_mode end,
      v_row.taxi_amount, v_row.taxi_mode
    ) returning id into v_reservation_id;
  end if;

  update public.reservations set billing_choice=v_row.billing_choice where id=v_reservation_id;
  update public.customer_booking_requests
  set status = 'approved',
      reservation_id = v_reservation_id,
      decision_note = nullif(btrim(p_decision_note), ''),
      decided_at = now(),
      decided_by = v_staff
  where id = p_request_id
  returning * into v_row;

  perform private.replan_dog_reservations(v_row.dog_id,(now() at time zone 'Europe/Bratislava')::date);
  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.purchase_pass(p_dog_id bigint, p_total_entries integer, p_purchased_on date, p_no_expiry boolean DEFAULT false, p_use_today_single boolean DEFAULT false)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id bigint;
  v_status text;
  v_price numeric(10,2);
  v_today date := (clock_timestamp() at time zone 'Europe/Bratislava')::date;
  v_visit public.visits%rowtype;
  v_reservation public.reservations%rowtype;
  v_visit_count integer;
begin
  perform private.lock_pool_v244(p_dog_id);
  if not exists (
    select 1
    from public.staff s
    where s.user_id = (select auth.uid())
      and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  if p_total_entries not in (10, 20) then
    raise exception 'Permanentka môže mať iba 10 alebo 20 vstupov.';
  end if;
  if p_purchased_on is null then
    raise exception 'Dátum kúpy je povinný.';
  end if;
  if not exists (select 1 from public.dogs d where d.id = p_dog_id) then
    raise exception 'Psík neexistuje.';
  end if;
  if p_use_today_single and p_purchased_on <> v_today then
    raise exception 'Dnešnú návštevu možno použiť iba pri permanentke kúpenej dnes.';
  end if;

  -- Serialize pass purchases/conversions for one dog. A second simultaneous
  -- conversion waits and then fails the single/unassigned checks below.
  perform pg_catalog.pg_advisory_xact_lock(p_dog_id);

  if p_use_today_single then
    select count(*)
      into v_visit_count
    from public.visits v
    join public.reservations r on r.id = v.reservation_id
    where v.dog_id = p_dog_id
      and v.visit_date = v_today
      and r.dog_id = p_dog_id
      and r.reservation_date = v_today
      and r.status = 'attended';

    if v_visit_count <> 1 then
      raise exception 'Psík musí mať dnes práve jednu započítanú návštevu.';
    end if;

    select v.*
      into v_visit
    from public.visits v
    where v.dog_id = p_dog_id
      and v.visit_date = v_today
    for update;

    select r.*
      into v_reservation
    from public.reservations r
    where r.id = v_visit.reservation_id
    for update;

    if v_visit.entry_type <> 'single'
       or v_visit.pass_id is not null
       or v_visit.pass_entry_number is not null
       or v_reservation.dog_id <> p_dog_id
       or v_reservation.reservation_date <> v_today
       or v_reservation.status <> 'attended'
       or v_reservation.entry_type <> 'single'
       or v_reservation.pass_id is not null then
      raise exception 'Dnešná návšteva už nie je nepriradený jednorazový vstup.';
    end if;
  end if;

  v_price := case when p_total_entries = 20 then 320.00 else 200.00 end;
  if exists (
    select 1
    from public.passes
    where dog_id = p_dog_id
      and status = 'active'
      and used_entries < total_entries
  ) then
    v_status := 'queued';
  else
    v_status := 'active';
  end if;

  insert into public.passes (
    dog_id,
    total_entries,
    used_entries,
    purchased_on,
    purchase_price,
    valid_from,
    valid_until,
    no_expiry,
    status,
    source
  ) values (
    p_dog_id,
    p_total_entries,
    case when p_use_today_single then 1 else 0 end,
    p_purchased_on,
    v_price,
    case when p_use_today_single then v_today else null end,
    case
      when p_use_today_single and not coalesce(p_no_expiry, false)
        then (v_today + interval '2 months')::date
      else null
    end,
    coalesce(p_no_expiry, false),
    v_status,
    'app'
  )
  returning id into v_id;

  if p_use_today_single then
    update public.visits
       set entry_type = 'pass',
           pass_id = v_id,
           pass_entry_number = 1,
           value_amount = case when p_total_entries = 20 then 16.00 else 20.00 end,
           notes = case
             when nullif(btrim(coalesce(notes, '')), '') is null
               then 'Dnešný jednorazový vstup prevedený na 1. vstup novej permanentky'
             else notes || E'\nDnešný jednorazový vstup prevedený na 1. vstup novej permanentky'
           end
     where id = v_visit.id;

    update public.reservations
       set entry_type = 'pass',
           pass_id = v_id,
           planned_entry_number = 1,
           planned_pass_total = p_total_entries,
           pass_locked = true
     where id = v_reservation.id;

    -- The attended reservation no longer passes the generic calendar trigger's
    -- "booked" guard, so enqueue this intentional title change explicitly.
    -- This keeps the Calendar/Apps Script daily source at 1/X instead of single.
    perform private.enqueue_google_calendar_reservation(
      v_reservation.id,
      p_dog_id,
      v_today,
      'pass',
      1,
      p_total_entries,
      v_id,
      'upsert'
    );

    perform private.refresh_daily_financial(v_today);
  end if;

  -- A newly purchased pass also covers previously booked future single days.
  -- Switch only this dog's unlocked future bookings; the existing planner assigns
  -- their entry numbers in chronological order and leaves excess days as single.
  update public.reservations
     set entry_type = 'pass'
   where dog_id = p_dog_id
     and status = 'booked'
     and reservation_date >= greatest(v_today + 1, p_purchased_on)
     and entry_type = 'single'
     and pass_id is null
     and pass_locked = false;

  perform private.replan_dog_reservations(p_dog_id, greatest(v_today + 1, p_purchased_on));

  update public.dogs
     set default_entry_type = 'pass'
   where id = p_dog_id;

  return v_id;
end;
$function$;
-- Retain the exact baseline no-show body and ACL; inject only pool locking and shared renumbering.
DO $patch_no_show$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.mark_no_show(bigint)'::regprocedure) INTO definition;
 IF md5(definition)<>'0ac84765c78c2ef4e56cc79248eb98d6' THEN RAISE EXCEPTION 'No-show baseline changed';END IF;
 definition:=replace(definition,E'begin\n',E'begin\n  perform private.lock_pool_v244((select dog_id from public.reservations where id=p_reservation_id));\n');
 definition:=replace(definition,'  perform private.ensure_current_pass(r.dog_id);',E'  perform private.renumber_shared_visits_v244(v.pass_id);\n  perform private.ensure_current_pass(r.dog_id);');
 EXECUTE definition;
END $patch_no_show$;
CREATE OR REPLACE FUNCTION public.set_pass_used_entries(p_pass_id bigint, p_used_entries integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_total integer; v_dog bigint;
begin
  perform private.lock_pool_v244((select dog_id from public.passes where id=p_pass_id));
  if not exists (select 1 from public.staff s where s.user_id=(select auth.uid()) and s.active=true) then raise exception 'Nemáte oprávnenie.'; end if;
  select total_entries,dog_id into v_total,v_dog from public.passes where id=p_pass_id;
  if v_total is null then raise exception 'Permanentka neexistuje.'; end if;
  if p_used_entries<0 or p_used_entries>v_total then raise exception 'Neplatný počet vstupov.'; end if;
  update public.passes
     set used_entries=p_used_entries,
         status=case when p_used_entries>=total_entries then 'used_up' when status='used_up' then 'queued' else status end
   where id=p_pass_id;
  perform private.ensure_current_pass(v_dog);
end;
$function$;
CREATE OR REPLACE FUNCTION public.set_pass_role(p_pass_id bigint, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_dog bigint; v_used integer; v_total integer;
begin
  perform private.lock_pool_v244((select dog_id from public.passes where id=p_pass_id));
  if not exists (select 1 from public.staff s where s.user_id=(select auth.uid()) and s.active=true) then raise exception 'Nemáte oprávnenie.'; end if;
  if p_role not in ('active','queued') then raise exception 'Neplatná rola permanentky.'; end if;
  select dog_id,used_entries,total_entries into v_dog,v_used,v_total from public.passes where id=p_pass_id;
  if v_dog is null then raise exception 'Permanentka neexistuje.'; end if;
  if v_used>=v_total then raise exception 'Plnú permanentku nemožno nastaviť ako aktuálnu alebo nasledujúcu.'; end if;
  if p_role='active' then
    update public.passes set status='queued' where dog_id=v_dog and status='active' and id<>p_pass_id and used_entries<total_entries;
  end if;
  update public.passes set status=p_role where id=p_pass_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_cancel_booking(p_request_id bigint, p_reason text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.customer_booking_requests%rowtype;
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_reason text := nullif(left(btrim(coalesce(p_reason,'')),500),'');
begin
  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select * into v_row from public.customer_booking_requests
  where id=p_request_id and user_id=v_uid for update;
  if v_row.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_row.reservation_date-1)::timestamp + time '21:00';
  if v_now_local > v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 21:00. Kontaktujte Chvostíkovo.';
  end if;
  if v_row.status not in ('pending','approved') then raise exception 'Túto rezerváciu už nie je možné zrušiť.'; end if;
  if v_row.status='approved' and v_row.reservation_id is not null then
    update public.reservations set status='cancelled' where id=v_row.reservation_id and status='booked';
  end if;
  update public.customer_booking_requests set status='cancelled',cancellation_reason=v_reason,cancelled_at=now()
  where id=p_request_id returning * into v_row;
  perform private.replan_dog_reservations(v_row.dog_id,v_now_local::date);
  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_reject_booking(p_request_id bigint, p_decision_note text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_row public.customer_booking_requests%rowtype;
begin
  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));
  if not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  update public.customer_booking_requests
  set status = 'rejected', decision_note = nullif(btrim(p_decision_note), ''),
      decided_at = now(), decided_by = v_staff
  where id = p_request_id and status = 'pending'
  returning * into v_row;
  if v_row.id is null then raise exception 'Žiadosť sa nenašla alebo už bola spracovaná.'; end if;

  insert into public.portal_notifications(
    recipient_user_id, notification_type, title, body, entity_type, entity_id
  ) values (
    v_row.user_id, 'booking_rejected', 'Rezervácia nebola schválená',
    coalesce(nullif(btrim(p_decision_note), ''),
      'Rezerváciu na ' || to_char(v_row.reservation_date, 'DD.MM.YYYY') || ' nebolo možné schváliť.'),
    'booking_request', v_row.id
  );
  perform private.replan_dog_reservations(v_row.dog_id,(now() at time zone 'Europe/Bratislava')::date);
  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_mark_pass_interest_handled(p_request_id bigint)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_request public.customer_pass_requests%rowtype;
begin
  perform private.lock_pool_v244((select dog_id from public.customer_pass_requests where id=p_request_id));
  if v_staff is null or not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  update public.customer_pass_requests
     set status = 'handled',
         decided_at = now(),
         decided_by = v_staff,
         decision_note = 'Informačný záujem vybavený osobne'
   where id = p_request_id
     and status = 'pending'
  returning * into v_request;

  if v_request.id is null then
    raise exception 'Záujem sa nenašiel alebo už bol vybavený.';
  end if;

  perform private.replan_dog_reservations(v_request.dog_id,(now() at time zone 'Europe/Bratislava')::date);
  return v_request;
end;
$function$;
CREATE OR REPLACE FUNCTION public.portal_reject_pass_request(p_request_id bigint, p_decision_note text DEFAULT NULL::text)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_request public.customer_pass_requests%rowtype;
begin
  perform private.lock_pool_v244((select dog_id from public.customer_pass_requests where id=p_request_id));
  if v_staff is null or not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then
    raise exception 'Nemáte oprávnenie.';
  end if;

  update public.customer_pass_requests
  set status = 'rejected', decided_at = now(), decided_by = v_staff,
      decision_note = nullif(btrim(p_decision_note), '')
  where id = p_request_id and status = 'pending'
  returning * into v_request;

  if v_request.id is null then raise exception 'Žiadosť sa nenašla alebo už bola spracovaná.'; end if;

  insert into public.portal_notifications (
    recipient_user_id, notification_type, title, body, entity_type, entity_id
  ) values (
    v_request.user_id,
    'pass_request_rejected',
    'Žiadosť o permanentku bola spracovaná',
    coalesce(nullif(btrim(p_decision_note), ''), 'V prípade otázok nám napíšte správu.'),
    'pass_request',
    v_request.id
  );

  perform private.replan_dog_reservations(v_request.dog_id,(now() at time zone 'Europe/Bratislava')::date);
  return v_request;
end;
$function$;
CREATE OR REPLACE FUNCTION private.finalize_day(p_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r record;
  lock_owner bigint;
  v_visit_id bigint;
  v_pass_id bigint;
  v_pass_total integer;
  v_actual_entry integer;
  v_value numeric(10,2);
  v_month date;
  v_processed integer := 0;
  v_local_now timestamp := clock_timestamp() at time zone 'Europe/Bratislava';
begin
  for lock_owner in select distinct d.owner_id from public.reservations lock_r join public.dogs d on d.id=lock_r.dog_id where lock_r.reservation_date=p_date and lock_r.status='booked' and d.owner_id is not null order by d.owner_id
  loop perform pg_catalog.pg_advisory_xact_lock(-lock_owner); end loop;
  if p_date > v_local_now::date then raise exception 'Budúci deň nie je možné uzavrieť.'; end if;
  if p_date=v_local_now::date and v_local_now::time < time '10:00' then raise exception 'Dnešný deň je možné uzavrieť až po 10:00 Europe/Bratislava.'; end if;

  if p_date = date '2026-08-24' then
    for r in select * from public.reservations where reservation_date=p_date and status='booked' order by id loop
      v_pass_id := r.pass_id;
      if r.entry_type='pass' and v_pass_id is null then
        select p.id into v_pass_id from public.passes p
        where p.dog_id=r.dog_id and p.total_entries=coalesce(r.planned_pass_total,p.total_entries)
          and p.status in ('active','queued','used_up')
        order by case when p.status='active' then 0 when p.status='queued' then 1 else 2 end,p.created_at desc limit 1;
      end if;
      if r.entry_type='pass' and v_pass_id is not null and r.planned_entry_number is not null then
        update public.passes set used_entries=least(total_entries,r.planned_entry_number),
          status=case when r.planned_entry_number>=total_entries then 'used_up' else case when status='used_up' then 'active' else status end end
        where id=v_pass_id;
      end if;
      update public.reservations set status='attended',pass_id=coalesce(pass_id,v_pass_id) where id=r.id;
      perform private.ensure_current_pass(r.dog_id);
      perform private.replan_dog_reservations(r.dog_id,date '2026-08-25');
      v_processed:=v_processed+1;
    end loop;
    return jsonb_build_object('date',p_date,'processed',v_processed,'mode','transition_pass_only');
  end if;

  if p_date < date '2026-08-25' then return jsonb_build_object('date',p_date,'processed',0,'reason','before_automation_start'); end if;
  v_month := date_trunc('month',p_date)::date;

  for r in select distinct dog_id from public.reservations where reservation_date=p_date and status='booked' loop
    perform private.replan_dog_reservations(r.dog_id,p_date);
  end loop;

  for r in select * from public.reservations where reservation_date=p_date and status='booked' order by id loop
    v_visit_id:=null; v_pass_id:=r.pass_id; v_pass_total:=r.planned_pass_total; v_actual_entry:=null;

    if r.entry_type='pass' and v_pass_id is not null then
      update public.passes
         set valid_from = case when (purchased_on is not null or source='test_shared_v257') and valid_from is null and valid_until is null and not coalesce(no_expiry,false) then p_date else valid_from end,
             valid_until = case when (purchased_on is not null or source='test_shared_v257') and valid_from is null and valid_until is null and not coalesce(no_expiry,false) then (p_date + interval '2 months')::date else valid_until end
       where id=v_pass_id;
      select total_entries,used_entries+1 into v_pass_total,v_actual_entry from public.passes where id=v_pass_id for update;
      if v_actual_entry>v_pass_total then raise exception 'Permanentka už nemá voľný vstup.'; end if;
    end if;

    v_value := case
      when r.entry_type='pass' and exists(select 1 from public.passes where id=v_pass_id and source='test_shared_v257') then 0.00
      when r.entry_type='free' then 0.00
      when r.entry_type='single' then 25.00
      when v_pass_total=20 then 16.00
      else 20.00
    end;

    insert into public.visits(dog_id,reservation_id,visit_date,entry_type,pass_id,pass_entry_number,value_amount,taxi_mode,taxi_amount,notes)
    values(r.dog_id,r.id,p_date,r.entry_type,v_pass_id,v_actual_entry,v_value,coalesce(r.taxi_mode,'none'),coalesce(r.taxi_amount,0),'Automaticky potvrdené o 10:05')
    on conflict(reservation_id) do nothing returning id into v_visit_id;

    if v_visit_id is null then continue; end if;

    update public.reservations
       set status='attended',pass_id=v_pass_id,planned_entry_number=v_actual_entry,planned_pass_total=v_pass_total
     where id=r.id;

    update public.dogs set legacy_total_visits=coalesce(legacy_total_visits,0)+1 where id=r.dog_id;

    insert into public.monthly_visit_totals(dog_id,month,visits,source)
    values(r.dog_id,v_month,1,'app')
    on conflict(dog_id,month) do update
      set visits=public.monthly_visit_totals.visits+1,
          source=case when public.monthly_visit_totals.source='legacy_crm' then 'legacy_crm+app' else public.monthly_visit_totals.source end;

    if r.entry_type='pass' and v_pass_id is not null then
      update public.passes
         set used_entries=least(total_entries,used_entries+1),
             status=case when used_entries+1>=total_entries then 'used_up' else status end
       where id=v_pass_id;
      perform private.ensure_current_pass(r.dog_id);
      perform private.replan_dog_reservations(r.dog_id,p_date+1);
    end if;

    v_processed:=v_processed+1;
  end loop;

  return jsonb_build_object('date',p_date,'processed',v_processed);
end;
$function$;
CREATE OR REPLACE FUNCTION private.ensure_current_pass(p_dog_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not exists (
    select 1 from public.passes
    where (dog_id=p_dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=p_dog_id)) and status='active' and used_entries < total_entries
  ) then
    update public.passes
       set status='active'
     where id = (
       select id from public.passes
       where (dog_id=p_dog_id or exists(select 1 from public.pass_dogs m where m.pass_id=public.passes.id and m.dog_id=p_dog_id)) and status='queued' and used_entries < total_entries
       order by coalesce(valid_from,purchased_on,date '1900-01-01'), created_at, id
       limit 1
     );
  end if;
end;
$function$;
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
END $function$
;
CREATE OR REPLACE FUNCTION private.refresh_daily_financial(p_day date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_pass10 integer;
  v_pass20 integer;
  v_single integer;
  v_taxi numeric(10,2);
begin
  select
    count(*) filter (where v.entry_type='pass' and p.total_entries=10),
    count(*) filter (where v.entry_type='pass' and p.total_entries=20),
    count(*) filter (where v.entry_type='single'),
    coalesce(sum(v.taxi_amount),0)
  into v_pass10,v_pass20,v_single,v_taxi
  from public.visits v
  left join public.passes p on p.id=v.pass_id
  where v.visit_date=p_day and coalesce(p.source,'')<>'test_shared_v257';

  insert into public.daily_financials(day,pass10_count,pass20_count,single_count,taxi_amount,source,updated_at)
  values(p_day,coalesce(v_pass10,0),coalesce(v_pass20,0),coalesce(v_single,0),coalesce(v_taxi,0),'app',now())
  on conflict(day) do update set
    pass10_count=excluded.pass10_count,
    pass20_count=excluded.pass20_count,
    single_count=excluded.single_count,
    taxi_amount=excluded.taxi_amount,
    source='app',
    updated_at=now();
end;
$function$;

CREATE FUNCTION private.guard_shared_pass_anchor_v257() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.pass_dogs m JOIN public.dogs d ON d.id=m.dog_id WHERE m.pass_id=new.id AND d.owner_id IS DISTINCT FROM (SELECT owner_id FROM public.dogs WHERE id=new.dog_id)) THEN RAISE EXCEPTION 'Zmena majiteľa spoločnej permanentky vyžaduje kontrolu.';END IF;RETURN new;END $$;
CREATE TRIGGER guard_shared_pass_anchor_v257 BEFORE UPDATE OF dog_id ON public.passes FOR EACH ROW EXECUTE FUNCTION private.guard_shared_pass_anchor_v257();
REVOKE ALL ON FUNCTION private.guard_shared_pass_anchor_v257() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.guard_shared_entry_v257() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.passes%rowtype;
BEGIN
 IF new.pass_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.pass_dogs WHERE pass_id=new.pass_id) THEN RETURN new;END IF;
 PERFORM private.lock_pool_v244(new.dog_id);
 SELECT * INTO p FROM public.passes WHERE id=new.pass_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.pass_dogs WHERE pass_id=new.pass_id AND dog_id=new.dog_id) THEN RAISE EXCEPTION 'Psík nemá oprávnenie čerpať túto spoločnú permanentku.';END IF;
 IF TG_TABLE_NAME='visits' THEN
  IF new.pass_entry_number IS NULL OR new.pass_entry_number NOT BETWEEN 1 AND p.total_entries OR EXISTS(SELECT 1 FROM public.visits v WHERE v.pass_id=new.pass_id AND v.pass_entry_number=new.pass_entry_number AND v.id<>new.id) THEN RAISE EXCEPTION 'Neplatné alebo duplicitné čerpanie spoločnej permanentky.';END IF;
 END IF;
 RETURN new;
END $$;
CREATE TRIGGER guard_shared_reservation_v257 BEFORE INSERT OR UPDATE OF pass_id,dog_id ON public.reservations FOR EACH ROW EXECUTE FUNCTION private.guard_shared_entry_v257();
CREATE TRIGGER guard_shared_visit_v257 BEFORE INSERT OR UPDATE OF pass_id,dog_id,pass_entry_number ON public.visits FOR EACH ROW EXECUTE FUNCTION private.guard_shared_entry_v257();
REVOKE ALL ON FUNCTION private.guard_shared_entry_v257() FROM PUBLIC,anon,authenticated;

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
-- Bootstrap already returns capabilities together with scoped membership; no separate public flag endpoint.
REVOKE EXECUTE ON FUNCTION public.portal_shared_capabilities_v244() FROM anon,authenticated;

COMMIT;
