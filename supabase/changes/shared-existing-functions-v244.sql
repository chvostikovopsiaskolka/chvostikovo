
-- Existing definitions are copied from the verified v243 database, then changed narrowly.
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

CREATE OR REPLACE FUNCTION public.portal_set_optional_l4(p_dog_id bigint, p_valid_until date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) WHERE d.id=p_dog_id AND l.user_id=auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF; IF p_valid_until IS NULL AND EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=p_dog_id AND s.vaccination_type='lepto_l4') THEN RAISE EXCEPTION 'Samostatnú L4 nemožno odstrániť zo zdravotnej evidencie. Ak je zadaná omylom alebo máte DHPPi+L, kontaktujte škôlku.'; END IF; DELETE FROM public.vaccinations WHERE dog_id=p_dog_id AND vaccination_type='lepto_l4'; IF p_valid_until IS NOT NULL THEN INSERT INTO public.vaccinations(dog_id,vaccination_type,valid_until) VALUES(p_dog_id,'lepto_l4',p_valid_until); END IF; RETURN jsonb_build_object('valid_until',p_valid_until); END $function$;

CREATE OR REPLACE FUNCTION public.portal_pass_renewal_eligible(p_dog_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null or exists(select 1 from public.customer_profiles where user_id=v_uid and status='suspended')
    or not exists(select 1 from public.customer_owner_links l join public.dogs d on d.owner_id=l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
      where l.user_id=v_uid and d.id=p_dog_id and d.active)
    then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
  return private.recent_pass_renewal_eligible(p_dog_id);
end $function$;

CREATE OR REPLACE FUNCTION public.portal_accept_school_terms(p_dog_id bigint, p_terms_version text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_row public.portal_terms_acceptances%rowtype;v_doc public.portal_terms_documents%rowtype;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version AND active AND effective_from<=now();
 IF v_doc.id IS NULL THEN RAISE EXCEPTION 'Aktuálne podmienky sa nenašli.'; END IF;
 IF p_terms_version>='2026-09-30' THEN RAISE EXCEPTION 'Aktualizujte aplikáciu a vedome prijmite novú verziu podmienok.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active) THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash) ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_accept_school_terms_verified(p_dog_id bigint, p_terms_version text, p_document_hash text, p_acceptance_text text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_uid uuid:=auth.uid();v_doc public.portal_terms_documents%rowtype;v_row public.portal_terms_acceptances%rowtype;
 v_name text;v_email text;v_dog text;
 v_text constant text:='Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.';
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF p_acceptance_text IS DISTINCT FROM v_text THEN RAISE EXCEPTION 'Podmienky musíte vedome prijať.'; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version;
 IF v_doc.id IS NULL OR v_doc.document_hash IS DISTINCT FROM p_document_hash THEN RAISE EXCEPTION 'Verzia dokumentu sa zmenila. Otvorte podmienky znova.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 IF NOT v_doc.active OR v_doc.effective_from>now() OR v_doc.id IS DISTINCT FROM
 (SELECT id FROM public.portal_terms_documents WHERE active AND effective_from<=now() ORDER BY effective_from DESC,id DESC LIMIT 1) THEN
 RAISE EXCEPTION 'Prijmite aktuálnu verziu podmienok.'; END IF;
 SELECT d.name INTO v_dog FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 SELECT p.full_name,u.email INTO v_name,v_email FROM auth.users u LEFT JOIN public.customer_profiles p ON p.user_id=u.id WHERE u.id=v_uid;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash,document_id,acceptance_text,accepted_at,user_name_snapshot,user_email_snapshot,dog_name_snapshot)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash,v_doc.id,v_text,clock_timestamp(),v_name,v_email,v_dog)
 ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_link_existing_dog(p_user_id uuid, p_dog_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_staff uuid := (select auth.uid());
  v_owner_id bigint;
  v_profile public.customer_profiles%rowtype;
  v_dog_name text;
  v_customer_name text;
  v_submission_id bigint;
  v_submission public.customer_dog_submissions%rowtype;
  v_web public.web_form_submissions%rowtype;
  v_link_created boolean := false;
  v_push_title text;
  v_push_body text;
  v_owner_name text;
  v_owner_phone text;
  v_existing_owner_links integer := 0;
  v_owner_placeholder boolean := false;
  v_names text[];
begin
  if not exists (
    select 1 from public.staff s where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_profile from public.customer_profiles where user_id = p_user_id;
  if v_profile.user_id is null then raise exception 'Zákaznícky účet sa nenašiel.'; end if;

  select owner_id, name, customer_name
    into v_owner_id, v_dog_name, v_customer_name
  from public.dogs where id = p_dog_id;
  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;
  if v_owner_id is null then raise exception 'Najprv overte a nastavte majiteľa existujúceho psa.'; end if;
  perform private.lock_pool_v244(p_dog_id);
  if exists(select 1 from public.customer_owner_links where user_id=p_user_id and owner_id<>v_owner_id) then
    raise exception 'Účet už má iného majiteľa. Overte evidenciu manuálne.';
  end if;

  if v_owner_id is not null then
    select o.name, o.phone
      into v_owner_name, v_owner_phone
    from public.owners o
    where o.id = v_owner_id;

    select count(*)::integer
      into v_existing_owner_links
    from public.customer_owner_links l
    where l.owner_id = v_owner_id;

    v_owner_placeholder :=
      v_existing_owner_links = 0
      and (
        nullif(btrim(v_owner_name),'') is null
        or lower(btrim(v_owner_name)) = 'majiteľ'
        or lower(btrim(v_owner_name)) like 'majiteľ - %'
        or lower(btrim(v_owner_name)) like 'majiteľ – %'
        or lower(btrim(v_owner_name)) like 'majiteľ — %'
      );
  end if;

  -- Link only an application explicitly naming this dog. Another dog's most
  -- recent submission on the same customer account must never supply its data.
  select s.* into v_submission
    from public.customer_dog_submissions s
   where s.user_id=p_user_id
     and s.status in ('pending','approved')
     and (s.linked_dog_id is null or s.linked_dog_id=p_dog_id)
     and (lower(btrim(s.dog_name))=lower(btrim(v_dog_name))
       or lower(btrim(s.dog_name))=lower(btrim(coalesce(v_customer_name,''))))
   order by case when s.status='pending' then 0 else 1 end,s.created_at desc
   limit 1;
  v_submission_id:=v_submission.id;

  select * into v_web
    from public.web_form_submissions
   where converted_dog_id=p_dog_id and form_type='application'
   order by created_at desc,id desc
   limit 1;

  if v_submission_id is not null then
    v_customer_name:=nullif(btrim(v_submission.dog_name),'');
  end if;

  if v_customer_name is null then
    select case when position(',' in coalesce(u.raw_user_meta_data->>'dog_name',''))=0 and coalesce(u.raw_user_meta_data->>'dog_count','1')='1' then nullif(btrim(u.raw_user_meta_data->>'dog_name'), '') else null end
      into v_customer_name
    from auth.users u
    where u.id = p_user_id;
  end if;

  if v_customer_name is null then
    select coalesce(nullif(btrim(customer_name), ''), name)
      into v_customer_name
    from public.dogs where id = p_dog_id;
  end if;

  if v_owner_id is null then
    insert into public.owners(name, phone)
    values (v_profile.full_name, v_profile.phone)
    returning id into v_owner_id;
  end if;

  update public.dogs
  set owner_id = v_owner_id,
      customer_name = coalesce(nullif(btrim(customer_name), ''), v_customer_name, name),
      breed=coalesce(nullif(btrim(breed),''),nullif(btrim(v_submission.breed),''),nullif(btrim(v_web.dog_breed),'')),
      weight_kg=coalesce(weight_kg,v_submission.weight_kg,v_web.dog_weight_kg),
      age_text=coalesce(nullif(btrim(age_text),''),nullif(btrim(v_submission.age_text),''),nullif(btrim(v_web.dog_age_text),'')),
      birth_date=coalesce(birth_date,v_submission.birth_date),
      sex=coalesce(nullif(btrim(sex),''),v_submission.sex,v_web.dog_sex),
      neutered=coalesce(neutered,v_submission.neutered,v_web.dog_neutered),
      allergies=coalesce(nullif(btrim(allergies),''),nullif(btrim(v_submission.allergies),''),nullif(btrim(v_web.dog_info),'')),
      temperament=coalesce(nullif(btrim(temperament),''),nullif(btrim(v_submission.temperament),'')),
      notes=coalesce(nullif(btrim(notes),''),nullif(btrim(v_web.dog_info),''))
  where id = p_dog_id;

  insert into public.customer_owner_links(user_id,owner_id,approved_by,allowed_dog_ids)
  values(p_user_id,v_owner_id,v_staff,ARRAY[p_dog_id])
  on conflict(user_id,owner_id) do update set allowed_dog_ids=CASE
    WHEN public.customer_owner_links.allowed_dog_ids IS NULL THEN NULL
    ELSE ARRAY(SELECT DISTINCT x FROM unnest(public.customer_owner_links.allowed_dog_ids||ARRAY[p_dog_id]) x ORDER BY x) END
  WHERE public.customer_owner_links.allowed_dog_ids IS NOT NULL AND NOT p_dog_id=ANY(public.customer_owner_links.allowed_dog_ids);
  v_link_created := found;

  update public.owners
  set alternate_phone = case
        when v_owner_placeholder
         and nullif(btrim(v_profile.phone),'') is not null
         and nullif(btrim(phone),'') is not null
         and regexp_replace(phone,'[^0-9]','','g') <> regexp_replace(v_profile.phone,'[^0-9]','','g')
         and nullif(btrim(alternate_phone),'') is null
        then phone
        else alternate_phone
      end,
      name = case
        when v_owner_placeholder and nullif(btrim(v_profile.full_name),'') is not null
        then btrim(v_profile.full_name)
        else coalesce(name, v_profile.full_name)
      end,
      phone = case
        when v_owner_placeholder and nullif(btrim(v_profile.phone),'') is not null
        then btrim(v_profile.phone)
        else coalesce(phone, v_profile.phone)
      end
  where id = v_owner_id;

  if v_submission_id is not null then
    update public.customer_dog_submissions
    set status='approved', linked_dog_id=p_dog_id, updated_at=now()
    where id=v_submission_id;
  end if;

  update public.customer_profiles set status = 'active' where user_id = p_user_id;

  if v_link_created then
    v_push_title := coalesce(v_customer_name, v_dog_name) || ' bol/a priradený/á k vášmu profilu 🐾';
    v_push_body := 'Otvorte Chvostíkovo a dokončite nastavenie.';
    insert into public.portal_notifications(
      recipient_user_id, notification_type, title, body,
      entity_type, entity_id, read_at, push_title, push_body
    ) values (
      p_user_id, 'dog_approved', v_push_title, v_push_body,
      'dog', p_dog_id, null, v_push_title, v_push_body
    );
  end if;

  return p_dog_id;
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
  where dog_id = v_request.dog_id
    and status = 'active'
    and not coalesce(no_expiry,false)
    and valid_until is not null
    and valid_until < v_today;

  v_price := case when v_request.total_entries = 20 then 320.00 else 200.00 end;
  if exists (
    select 1 from public.passes
    where dog_id = v_request.dog_id
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
CREATE OR REPLACE FUNCTION public.mark_no_show(p_reservation_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  r public.reservations%rowtype;
  v public.visits%rowtype;
  p public.passes%rowtype;
  v_month date;
  v_new_used integer;
  v_local_today date := (clock_timestamp() at time zone 'Europe/Bratislava')::date;
begin
  perform private.lock_pool_v244((select dog_id from public.reservations where id=p_reservation_id));
  if not exists (
    select 1 from public.staff s
    where s.user_id=(select auth.uid()) and s.active=true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into r from public.reservations where id=p_reservation_id for update;
  if r.id is null then raise exception 'Rezervácia neexistuje.'; end if;
  if r.reservation_date > v_local_today then raise exception 'Budúcu rezerváciu nemožno označiť ako neprítomnosť.'; end if;
  if r.status='no_show' then return jsonb_build_object('reservation_id',r.id,'status','no_show','changed',false); end if;
  if r.status <> 'attended' then raise exception 'Ako neprítomnosť možno označiť iba už započítanú návštevu.'; end if;

  select * into v from public.visits where reservation_id=r.id for update;
  if v.id is null then raise exception 'K rezervácii chýba započítaná návšteva.'; end if;
  v_month := date_trunc('month',r.reservation_date)::date;

  if v.entry_type='pass' and v.pass_id is not null then
    select * into p from public.passes where id=v.pass_id for update;
    if p.id is not null then
      v_new_used := greatest(0,p.used_entries-1);
      if v.pass_entry_number=1 and p.purchased_on is not null and not coalesce(p.no_expiry,false)
         and p.valid_from=r.reservation_date and p.valid_until=(r.reservation_date + interval '2 months')::date then
        update public.passes set used_entries=v_new_used,valid_from=null,valid_until=null,status='active' where id=p.id;
      else
        update public.passes set used_entries=v_new_used,status=case
          when not coalesce(p.no_expiry,false) and p.valid_until is not null and p.valid_until < r.reservation_date then 'expired'
          else 'active' end where id=p.id;
      end if;
      if exists(select 1 from public.passes where id=p.id and status='active') then
        update public.passes set status='queued'
        where dog_id=r.dog_id and id<>p.id and status='active' and used_entries<total_entries;
      end if;
    end if;
  end if;

  delete from public.visits where id=v.id;
  update public.reservations set status='no_show',notes=case
    when coalesce(notes,'')='' then 'Pes neprišiel – vstup vrátený'
    else notes || E'\nPes neprišiel – vstup vrátený' end where id=r.id;
  update public.dogs set legacy_total_visits=greatest(0,coalesce(legacy_total_visits,0)-1) where id=r.dog_id;

  update public.monthly_visit_totals set visits=greatest(0,visits-1)
  where dog_id=r.dog_id and month=v_month;
  delete from public.monthly_visit_totals where dog_id=r.dog_id and month=v_month and visits<=0;

  perform private.renumber_shared_visits_v244(v.pass_id);
  perform private.ensure_current_pass(r.dog_id);
  perform private.replan_dog_reservations(r.dog_id,r.reservation_date+1);
  perform private.refresh_daily_financial(r.reservation_date);

  return jsonb_build_object('reservation_id',r.id,'dog_id',r.dog_id,'date',r.reservation_date,'status','no_show','changed',true,'returned_pass_entry',v.entry_type='pass');
end;
$function$;
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
         set valid_from = case when purchased_on is not null and valid_from is null and valid_until is null and not coalesce(no_expiry,false) then p_date else valid_from end,
             valid_until = case when purchased_on is not null and valid_from is null and valid_until is null and not coalesce(no_expiry,false) then (p_date + interval '2 months')::date else valid_until end
       where id=v_pass_id;
      select total_entries,used_entries+1 into v_pass_total,v_actual_entry from public.passes where id=v_pass_id for update;
      if v_actual_entry>v_pass_total then raise exception 'Permanentka už nemá voľný vstup.'; end if;
    end if;

    v_value := case
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
