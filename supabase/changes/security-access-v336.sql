-- v336: isolated account blocking and request ceilings. No customer records are changed by installation.
CREATE TABLE private.security_release_backup_v336(key text PRIMARY KEY,payload jsonb NOT NULL,captured_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.security_release_backup_v336 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.security_release_backup_v336 FROM PUBLIC,anon,authenticated;
INSERT INTO private.security_release_backup_v336(key,payload)
SELECT 'baseline',jsonb_build_object('admin_html',html,'admin_md5',md5(html),
 'functions',(SELECT jsonb_agg(jsonb_build_object('oid',p.oid,'definition',pg_get_functiondef(p.oid),'acl',p.proacl::text)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.prokind='f'))
FROM public.frontend_snapshots WHERE key='stable-v10-clean';
CREATE TABLE private.customer_access_controls_v336(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,previous_status text,previous_banned_until timestamptz,block_banned_until timestamptz,blocked boolean NOT NULL DEFAULT false,changed_by uuid,changed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.customer_access_audit_v336(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id uuid NOT NULL,actor uuid NOT NULL,blocked boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private.request_limits_v336(scope text NOT NULL,subject text NOT NULL,bucket bigint NOT NULL,expires_at timestamptz NOT NULL,used integer NOT NULL,PRIMARY KEY(scope,subject,bucket));
CREATE INDEX request_limits_expiry_v336 ON private.request_limits_v336(expires_at);
ALTER TABLE private.customer_access_controls_v336 ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.customer_access_audit_v336 ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.request_limits_v336 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.customer_access_controls_v336,private.customer_access_audit_v336,private.request_limits_v336 FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.portal_customer_access_allowed_v336() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid())
 AND NOT EXISTS(SELECT 1 FROM public.customer_profiles WHERE user_id=auth.uid() AND status='suspended')
 AND NOT EXISTS(SELECT 1 FROM private.customer_access_controls_v336 WHERE user_id=auth.uid() AND blocked)
$$;
REVOKE ALL ON FUNCTION public.portal_customer_access_allowed_v336() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_customer_access_allowed_v336() TO authenticated,service_role;
CREATE FUNCTION private.assert_customer_access_v336() RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN IF NOT public.portal_customer_access_allowed_v336() THEN RAISE EXCEPTION 'Prístup k účtu je zablokovaný. Kontaktujte Chvostíkovo.' USING ERRCODE='42501';END IF;END $$;
REVOKE ALL ON FUNCTION private.assert_customer_access_v336() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.consume_request_limit_v336(p_scope text,p_subject text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cap integer;span integer;slot bigint;ok boolean;BEGIN
 SELECT v.c,v.s INTO cap,span FROM (VALUES
 ('form_ip',20,600),('form_global',200,600),('recovery_ip',30,600),('correction_ip',20,600),
 ('bootstrap_user',120,300),('mutation_user',120,300),('message_user',30,300),('upload_user',20,600),('push_user',30,600),('rpc_user',240,300)
 )v(n,c,s) WHERE v.n=p_scope;
 IF cap IS NULL OR p_subject IS NULL OR p_subject !~ '^[a-f0-9]{32,64}$' THEN RAISE EXCEPTION 'Invalid limiter scope';END IF;
 slot:=floor(extract(epoch FROM clock_timestamp())/span)::bigint;
 INSERT INTO private.request_limits_v336(scope,subject,bucket,expires_at,used)
 VALUES(p_scope,p_subject,slot,to_timestamp((slot+1)*span)+interval '2 days',1)
 ON CONFLICT(scope,subject,bucket) DO UPDATE SET used=private.request_limits_v336.used+1
 WHERE private.request_limits_v336.used<cap RETURNING true INTO ok;
 IF random()<0.01 THEN DELETE FROM private.request_limits_v336 WHERE ctid IN(SELECT ctid FROM private.request_limits_v336 WHERE expires_at<clock_timestamp() LIMIT 500);END IF;
 RETURN coalesce(ok,false);END $$;
REVOKE ALL ON FUNCTION private.consume_request_limit_v336(text,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.consume_request_limit_v336(p_scope text,p_subject text) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$SELECT private.consume_request_limit_v336(p_scope,p_subject)$$;
REVOKE ALL ON FUNCTION public.consume_request_limit_v336(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit_v336(text,text) TO service_role;
CREATE FUNCTION private.guard_customer_rpc_v336() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 PERFORM private.assert_customer_access_v336();
 IF NOT private.consume_request_limit_v336('rpc_user',md5(auth.uid()::text)) THEN RAISE EXCEPTION 'Príliš veľa požiadaviek. Skúste to o chvíľu.' USING ERRCODE='P0001';END IF;END $$;
REVOKE ALL ON FUNCTION private.guard_customer_rpc_v336() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.portal_set_customer_blocked_v336(p_user_id uuid,p_blocked boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();prof public.customer_profiles%rowtype;ctl private.customer_access_controls_v336%rowtype;prev_ban timestamptz;next_ban timestamptz;restored text;BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=actor AND active) THEN RAISE EXCEPTION 'Nemáte oprávnenie.' USING ERRCODE='42501';END IF;
 IF p_user_id IS NULL OR p_blocked IS NULL OR p_user_id=actor OR EXISTS(SELECT 1 FROM public.staff WHERE user_id=p_user_id AND active) THEN RAISE EXCEPTION 'Administrátorský účet tu nemožno zablokovať.';END IF;
 SELECT * INTO prof FROM public.customer_profiles WHERE user_id=p_user_id FOR UPDATE;
 IF prof.user_id IS NULL THEN RAISE EXCEPTION 'Zákaznícky účet neexistuje.';END IF;
 SELECT banned_until INTO prev_ban FROM auth.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Prihlasovací účet neexistuje.';END IF;
 SELECT * INTO ctl FROM private.customer_access_controls_v336 WHERE user_id=p_user_id;
 IF p_blocked AND prof.status='suspended' AND coalesce(ctl.blocked,false) THEN RETURN jsonb_build_object('user_id',p_user_id,'blocked',true,'unchanged',true);END IF;
 IF NOT p_blocked AND prof.status<>'suspended' AND NOT coalesce(ctl.blocked,false) THEN RETURN jsonb_build_object('user_id',p_user_id,'blocked',false,'unchanged',true);END IF;
 IF p_blocked THEN
  next_ban:=greatest(coalesce(prev_ban,now()),now()+interval '100 years');
  INSERT INTO private.customer_access_controls_v336(user_id,previous_status,previous_banned_until,block_banned_until,blocked,changed_by)
  VALUES(p_user_id,CASE WHEN prof.status='suspended' THEN CASE WHEN EXISTS(SELECT 1 FROM public.customer_owner_links WHERE user_id=p_user_id) THEN 'active' ELSE 'pending' END ELSE prof.status END,prev_ban,next_ban,true,actor)
  ON CONFLICT(user_id) DO UPDATE SET previous_status=excluded.previous_status,previous_banned_until=excluded.previous_banned_until,block_banned_until=excluded.block_banned_until,blocked=true,changed_by=actor,changed_at=now();
  UPDATE public.customer_profiles SET status='suspended' WHERE user_id=p_user_id;
  UPDATE auth.users SET banned_until=next_ban WHERE id=p_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id=p_user_id::text;
  DELETE FROM auth.sessions WHERE user_id=p_user_id;
  UPDATE public.portal_push_subscriptions SET active=false WHERE user_id=p_user_id;
 ELSE
  restored:=coalesce(ctl.previous_status,CASE WHEN EXISTS(SELECT 1 FROM public.customer_owner_links WHERE user_id=p_user_id) THEN 'active' ELSE 'pending' END);
  UPDATE public.customer_profiles SET status=CASE WHEN restored='active' THEN 'active' ELSE 'pending' END WHERE user_id=p_user_id;
  IF ctl.user_id IS NOT NULL AND prev_ban IS NOT DISTINCT FROM ctl.block_banned_until THEN UPDATE auth.users SET banned_until=ctl.previous_banned_until WHERE id=p_user_id;END IF;
  UPDATE private.customer_access_controls_v336 SET blocked=false,changed_by=actor,changed_at=now() WHERE user_id=p_user_id;
 END IF;
 INSERT INTO private.customer_access_audit_v336(user_id,actor,blocked) VALUES(p_user_id,actor,p_blocked);
 RETURN jsonb_build_object('user_id',p_user_id,'blocked',p_blocked);END $$;
REVOKE ALL ON FUNCTION public.portal_set_customer_blocked_v336(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_set_customer_blocked_v336(uuid,boolean) TO authenticated;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_accept_owner_terms_v254(bigint,text,text,text)'::regprocedure))<>'c54dc9e050bb254ce6091c3cb0320d20' THEN RAISE EXCEPTION 'Changed function: portal_accept_owner_terms_v254(bigint,text,text,text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_accept_owner_terms_v254(p_dog_id bigint, p_terms_version text, p_document_hash text, p_acceptance_text text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result public.portal_terms_acceptances%rowtype;BEGIN
 PERFORM private.guard_customer_rpc_v336();

 result:=public.portal_accept_school_terms_verified(p_dog_id,p_terms_version,p_document_hash,p_acceptance_text);
 PERFORM public.portal_sync_owner_terms_v254(p_terms_version);RETURN result;
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_accept_school_terms(bigint,text)'::regprocedure))<>'b1b306bdb5a264faa5eee9c505a6312b' THEN RAISE EXCEPTION 'Changed function: portal_accept_school_terms(bigint,text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_accept_school_terms(p_dog_id bigint, p_terms_version text)
 RETURNS portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_row public.portal_terms_acceptances%rowtype;v_doc public.portal_terms_documents%rowtype;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_accept_school_terms_verified(bigint,text,text,text)'::regprocedure))<>'f5410f43830492486278792394ed47d9' THEN RAISE EXCEPTION 'Changed function: portal_accept_school_terms_verified(bigint,text,text,text)';END IF;END $check$;
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
 PERFORM private.guard_customer_rpc_v336();

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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_acknowledge_privacy_notice(text)'::regprocedure))<>'a4598d3d902d385a967ef72f7f5d3678' THEN RAISE EXCEPTION 'Changed function: portal_acknowledge_privacy_notice(text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_acknowledge_privacy_notice(p_version text)
 RETURNS customer_profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_row public.customer_profiles%rowtype;
begin
 PERFORM private.guard_customer_rpc_v336();

  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if nullif(btrim(p_version),'') is null then raise exception 'Chýba verzia informácií o ochrane osobných údajov.'; end if;
  select email into v_email from auth.users where id=v_uid;

  insert into public.customer_profiles(user_id,email,status,privacy_notice_version,privacy_notice_acknowledged_at)
  values(v_uid,v_email,'pending',btrim(p_version),now())
  on conflict(user_id) do update set
    privacy_notice_version=excluded.privacy_notice_version,
    privacy_notice_acknowledged_at=excluded.privacy_notice_acknowledged_at,
    updated_at=now()
  returning * into v_row;
  return v_row;
end;
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_cancel_booking(bigint,text)'::regprocedure))<>'306582dd415d16879787a36965fc4269' THEN RAISE EXCEPTION 'Changed function: portal_cancel_booking(bigint,text)';END IF;END $check$;
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
 PERFORM private.guard_customer_rpc_v336();

  perform private.lock_pool_v244((select dog_id from public.customer_booking_requests where id=p_request_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select * into v_row from public.customer_booking_requests
  where id=p_request_id and user_id=v_uid for update;
  if v_row.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_row.reservation_date-1)::timestamp + time '19:00';
  if v_now_local >= v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_cancel_reservation(bigint,text)'::regprocedure))<>'0a0575efbbddfa75d518e3fba1edc020' THEN RAISE EXCEPTION 'Changed function: portal_cancel_reservation(bigint,text)';END IF;END $check$;
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
 PERFORM private.guard_customer_rpc_v336();

  perform private.lock_pool_v244((select dog_id from public.reservations where id=p_reservation_id));
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select r.* into v_reservation from public.reservations r
  join public.dogs d on d.id=r.dog_id
  join public.customer_owner_links l on l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
  where r.id=p_reservation_id and r.status='booked' and l.user_id=v_uid for update of r;
  if v_reservation.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_reservation.reservation_date-1)::timestamp + time '19:00';
  if v_now_local >= v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_owner_terms_history_v256(bigint)'::regprocedure))<>'993eae09fe3dff4c5890a802849f26cb' THEN RAISE EXCEPTION 'Changed function: portal_owner_terms_history_v256(bigint)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_owner_terms_history_v256(p_dog_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid();result jsonb;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

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
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_pass_renewal_eligible(bigint)'::regprocedure))<>'b7420843eb09dc1acc71a5142464cd61' THEN RAISE EXCEPTION 'Changed function: portal_pass_renewal_eligible(bigint)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_pass_renewal_eligible(p_dog_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid := (select auth.uid());
begin
 PERFORM private.guard_customer_rpc_v336();

  if v_uid is null or exists(select 1 from public.customer_profiles where user_id=v_uid and status='suspended')
    or not exists(select 1 from public.customer_owner_links l join public.dogs d on d.owner_id=l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
      where l.user_id=v_uid and d.id=p_dog_id and d.active)
    then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
  return private.recent_pass_renewal_eligible(p_dog_id);
end $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_booking(bigint,date,text)'::regprocedure))<>'7ce0f27871972ca040aaaeb9c67c4e40' THEN RAISE EXCEPTION 'Changed function: portal_request_booking(bigint,date,text)';END IF;END $check$;
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
  v_capacity integer := private.daycare_default_capacity_v322();
  v_taken integer := 0;
  v_pass public.passes%rowtype;
  v_future_pass_count integer := 0;
  v_row public.customer_booking_requests%rowtype;
  v_taxi_mode text := coalesce(nullif(btrim(p_taxi_mode), ''), 'none');
  v_taxi_amount numeric(10,2);
  v_default_entry_type text;
begin
 PERFORM private.guard_customer_rpc_v336();

  perform pg_advisory_xact_lock_shared(hashtextextended('default-capacity-v322',7241));
  perform private.lock_pool_v244(p_dog_id);
  if private.shared_dog_v244(p_dog_id) and current_setting('chvostikovo.shared_quote_v257',true) is distinct from '1' then raise exception 'Obnovte aplikáciu a skontrolujte rozdelenie vstupov spoločnej permanentky.';end if;
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  if v_taxi_mode not in ('none', 'pickup', 'dropoff', 'pickup_dropoff') then
    raise exception 'Neplatná voľba taxi.';
  end if;
  v_taxi_amount := case v_taxi_mode when 'pickup' then 5 when 'dropoff' then 5 when 'pickup_dropoff' then 10 else 0 end;

  if p_reservation_date <= v_now_local::date
     or extract(isodow from p_reservation_date) not between 1 and 5
     or p_reservation_date > v_now_local::date + 21 then
    raise exception 'Rezervovať je možné pracovné dni najviac 3 týždne dopredu.';
  end if;

  v_deadline := (p_reservation_date - 1)::timestamp + time '19:00';

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
  if v_now_local >= v_deadline then
    raise exception 'Žiadosť o rezerváciu môžete odoslať najneskôr deň vopred do 19:00. Potom nám napíšte správu.';
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

  select coalesce(s.capacity, private.daycare_default_capacity_v322()) into v_capacity
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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_bookings_batch(bigint,jsonb)'::regprocedure))<>'01c7d84042b2d74b06849ef71718f143' THEN RAISE EXCEPTION 'Changed function: portal_request_bookings_batch(bigint,jsonb)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_bookings_batch(p_dog_id bigint, p_bookings jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_item jsonb;
  v_date_text text;
  v_date date;
  v_taxi text;
  v_row public.customer_booking_requests%rowtype;
  v_results jsonb := '[]'::jsonb;
  v_failures jsonb := '[]'::jsonb;
  v_dates text[] := ARRAY[]::text[];
  v_n int;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF p_dog_id IS NULL OR p_dog_id < 1 OR jsonb_typeof(p_bookings) <> 'array' THEN
    RAISE EXCEPTION 'Vyberte psíka a dni rezervácie.';
  END IF;
  v_n := jsonb_array_length(p_bookings);
  IF v_n < 1 OR v_n > 15 THEN RAISE EXCEPTION 'Naraz je možné rezervovať 1 až 15 dní.'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_bookings)
  LOOP
    v_date_text := v_item->>'date';
    BEGIN
      IF v_date_text IS NULL OR v_date_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Neplatný dátum rezervácie.';
      END IF;
      v_date := v_date_text::date;
      v_taxi := coalesce(v_item->>'taxi_mode','none');
      IF v_taxi NOT IN ('none','pickup','dropoff','pickup_dropoff') THEN
        RAISE EXCEPTION 'Neplatná voľba taxi.';
      END IF;
      PERFORM set_config('chvostikovo.booking_batch','1',true);
      v_row := public.portal_request_booking(p_dog_id,v_date,v_taxi);
      v_results := v_results || to_jsonb(v_row);
      v_dates := array_append(v_dates,v_date::text);
    EXCEPTION WHEN OTHERS THEN
      v_failures := v_failures || jsonb_build_object(
        'date',coalesce(v_date_text,''),'error',SQLERRM
      );
    END;
  END LOOP;
  PERFORM set_config('chvostikovo.booking_batch','0',true);
  IF array_length(v_dates,1) > 0 THEN
    BEGIN
      INSERT INTO private.booking_batch_push_events(dog_id,day_count,dates)
      VALUES (p_dog_id,array_length(v_dates,1),v_dates);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Booking saved, batch push failed (error omitted)';
    END;
  END IF;
  RETURN jsonb_build_object('bookings',v_results,'failed',v_failures);
END;
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_dogs_batch_v254(bigint[],jsonb,uuid)'::regprocedure))<>'8566a9e0030fa8d92638d9ce3691b330' THEN RAISE EXCEPTION 'Changed function: portal_request_dogs_batch_v254(bigint[],jsonb,uuid)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_dogs_batch_v254(p_dog_ids bigint[], p_bookings jsonb, p_request_key uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid();payload jsonb;prior private.booking_batches_v254%rowtype;item jsonb;dog bigint;mode text;row public.customer_booking_requests%rowtype;rows jsonb:='[]';day date;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

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

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_late_booking(bigint,date,text)'::regprocedure))<>'7b0e93d2eacbe2dd11862f4300d8bdfc' THEN RAISE EXCEPTION 'Changed function: portal_request_late_booking(bigint,date,text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_late_booking(p_dog_id bigint, p_reservation_date date, p_message text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (select auth.uid());
  v_booking public.customer_booking_requests%rowtype;
  v_conversation_id bigint;
  v_message public.portal_messages%rowtype;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF char_length(btrim(coalesce(p_message,''))) < 1 OR char_length(p_message) > 2000 THEN
    RAISE EXCEPTION 'Napíšte správu s dĺžkou najviac 2000 znakov.';
  END IF;
  PERFORM set_config('chvostikovo.late_request','1',true);
  v_booking := public.portal_request_booking(p_dog_id,p_reservation_date,'none');
  INSERT INTO public.portal_conversations(customer_user_id)
    VALUES (v_uid)
    ON CONFLICT (customer_user_id) DO UPDATE SET updated_at=now()
    RETURNING id INTO v_conversation_id;
  INSERT INTO public.portal_messages(conversation_id,sender_user_id,sender_role,body,booking_request_id)
    VALUES (v_conversation_id,v_uid,'customer',btrim(p_message),v_booking.id)
    RETURNING * INTO v_message;
  RETURN jsonb_build_object('booking',to_jsonb(v_booking),'message',to_jsonb(v_message));
END;
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_pass(bigint,integer)'::regprocedure))<>'43f8cb4cddfae8313af30920cbb115d5' THEN RAISE EXCEPTION 'Changed function: portal_request_pass(bigint,integer)';END IF;END $check$;
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
 PERFORM private.guard_customer_rpc_v336();

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
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_pass_v244(bigint[],integer,uuid)'::regprocedure))<>'a58cd5aba85bf3c1e99d2430557aa8e1' THEN RAISE EXCEPTION 'Changed function: portal_request_pass_v244(bigint[],integer,uuid)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_pass_v244(p_dog_ids bigint[], p_total_entries integer, p_operation_id uuid)
 RETURNS customer_pass_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE ids bigint[]; own bigint; row public.customer_pass_requests%rowtype; op private.shared_operations_v244%rowtype; payload jsonb;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

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
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_reservation_taxi_v327(bigint,text)'::regprocedure))<>'04af8332594a827cd069c62fb641504f' THEN RAISE EXCEPTION 'Changed function: portal_request_reservation_taxi_v327(bigint,text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_reservation_taxi_v327(p_reservation_id bigint, p_taxi_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_dog_id bigint;
  v_res public.reservations%rowtype;
  v_row public.customer_booking_requests%rowtype;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
  IF p_taxi_mode NOT IN ('pickup','dropoff','pickup_dropoff') OR p_taxi_mode IS NULL THEN
    RAISE EXCEPTION 'Vyberte možnosť taxi.';
  END IF;
  SELECT dog_id INTO v_dog_id FROM public.reservations WHERE id=p_reservation_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id
      AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids))
    JOIN public.customer_profiles p ON p.user_id=l.user_id AND p.status='active'
    WHERE d.id=v_dog_id AND l.user_id=v_uid
  ) THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
  PERFORM private.lock_pool_v244(v_dog_id);
  PERFORM q.id FROM public.customer_booking_requests q WHERE q.reservation_id=p_reservation_id
    ORDER BY q.id FOR UPDATE NOWAIT;
  SELECT * INTO v_res FROM public.reservations WHERE id=p_reservation_id AND dog_id=v_dog_id FOR UPDATE NOWAIT;
  IF v_res.id IS NULL OR v_res.status<>'booked' THEN RAISE EXCEPTION 'Rezervácia sa nenašla.'; END IF;
  IF (now() AT TIME ZONE 'Europe/Bratislava') >= (v_res.reservation_date-1)::timestamp+time '19:00' THEN
    RAISE EXCEPTION 'Taxi je možné doplniť najneskôr deň vopred do 19:00. Kontaktujte Chvostíkovo.';
  END IF;
  SELECT * INTO v_row FROM public.customer_booking_requests WHERE reservation_id=v_res.id
    AND status='approved' AND taxi_change_status='pending' ORDER BY id LIMIT 1;
  IF v_row.id IS NOT NULL THEN
    IF v_row.requested_taxi_mode=p_taxi_mode THEN
      RETURN jsonb_build_object('id',v_row.id,'dog_id',v_row.dog_id,'reservation_date',v_row.reservation_date,'reservation_id',v_row.reservation_id,'status',v_row.status,'taxi_mode',v_row.taxi_mode,'taxi_amount',v_row.taxi_amount,'taxi_change_status',v_row.taxi_change_status,'requested_taxi_mode',v_row.requested_taxi_mode,'projected_entry_number',v_row.projected_entry_number,'projected_pass_total',v_row.projected_pass_total,'can_manage',v_row.user_id=v_uid);
    END IF;
    RAISE EXCEPTION 'Zmena taxi už čaká na schválenie.';
  END IF;
  IF v_res.taxi_mode=p_taxi_mode THEN
    RAISE EXCEPTION 'Táto možnosť taxi už je pri rezervácii uložená.';
  END IF;
  SELECT * INTO v_row FROM public.customer_booking_requests WHERE reservation_id=v_res.id
    AND status='approved' ORDER BY id LIMIT 1;
  IF v_row.id IS NULL THEN
    INSERT INTO public.customer_booking_requests(user_id,dog_id,reservation_date,status,reservation_id,
      projected_entry_number,projected_pass_total,taxi_mode,taxi_amount,billing_choice)
    VALUES(v_uid,v_res.dog_id,v_res.reservation_date,'approved',v_res.id,
      v_res.planned_entry_number,v_res.planned_pass_total,coalesce(v_res.taxi_mode,'none'),coalesce(v_res.taxi_amount,0),coalesce(v_res.billing_choice,'auto'))
    RETURNING * INTO v_row;
  END IF;
  -- Preserve the existing canonical request, including its original owner and group.
  -- The normal pending-taxi trigger and staff approval workflow are reused.
  UPDATE public.customer_booking_requests SET taxi_mode=v_res.taxi_mode,taxi_amount=v_res.taxi_amount,requested_taxi_mode=p_taxi_mode,
    requested_taxi_amount=CASE WHEN p_taxi_mode='pickup_dropoff' THEN 10 ELSE 5 END,
    taxi_change_status='pending',taxi_change_requested_at=now(),taxi_change_decided_at=NULL,
    taxi_change_decided_by=NULL,taxi_change_note=NULL WHERE id=v_row.id RETURNING * INTO v_row;
  RETURN jsonb_build_object('id',v_row.id,'dog_id',v_row.dog_id,'reservation_date',v_row.reservation_date,'reservation_id',v_row.reservation_id,'status',v_row.status,'taxi_mode',v_row.taxi_mode,'taxi_amount',v_row.taxi_amount,'taxi_change_status',v_row.taxi_change_status,'requested_taxi_mode',v_row.requested_taxi_mode,'projected_entry_number',v_row.projected_entry_number,'projected_pass_total',v_row.projected_pass_total,'can_manage',v_row.user_id=v_uid);
EXCEPTION WHEN lock_not_available OR deadlock_detected THEN
  RAISE EXCEPTION 'Rezervácia sa práve aktualizuje. Skúste to znova.';
END;
$function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_request_taxi_change(bigint,text)'::regprocedure))<>'3b5b8d9ecabc0690ea7cf030048d13fa' THEN RAISE EXCEPTION 'Changed function: portal_request_taxi_change(bigint,text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_request_taxi_change(p_request_id bigint, p_taxi_mode text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_res bigint;v_answer jsonb;v_row public.customer_booking_requests%rowtype;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT reservation_id INTO v_res FROM public.customer_booking_requests WHERE id=p_request_id AND user_id=auth.uid() AND status='approved';
 IF v_res IS NULL THEN RAISE EXCEPTION 'Schválená rezervácia sa nenašla.'; END IF;
 v_answer:=public.portal_request_reservation_taxi_v327(v_res,p_taxi_mode);
 SELECT * INTO v_row FROM public.customer_booking_requests WHERE id=(v_answer->>'id')::bigint;
 RETURN v_row;
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_save_vaccinations_v287(bigint,jsonb,date,boolean)'::regprocedure))<>'46db8e085dfb41cd21ea266f217fe690' THEN RAISE EXCEPTION 'Changed function: portal_save_vaccinations_v287(bigint,jsonb,date,boolean)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_save_vaccinations_v287(p_dog_id bigint, p_vaccinations jsonb, p_l4 date DEFAULT NULL::date, p_include_l4 boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare item jsonb; proof bigint; today date:=(now() at time zone 'Europe/Bratislava')::date; until_date date; kind text;
begin
 PERFORM private.guard_customer_rpc_v336();

 if auth.uid() is null or not exists(select 1 from public.dogs d join public.customer_owner_links l on l.owner_id=d.owner_id where d.id=p_dog_id and l.user_id=auth.uid() and (l.allowed_dog_ids is null or d.id=any(l.allowed_dog_ids))) then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
 perform 1 from public.dogs where id=p_dog_id for update;
 if jsonb_typeof(p_vaccinations) is distinct from 'array' or jsonb_array_length(p_vaccinations)<>3 or (select count(distinct v->>'type') from jsonb_array_elements(p_vaccinations) v where v->>'type' in ('rabies','infectious','kennel_cough') and nullif(v->>'valid_until','') is not null)<>3 then raise exception 'Doplňte platnosť všetkých troch očkovaní.'; end if;
 perform 1 from public.vaccination_proofs where dog_id=p_dog_id and is_current for share;
 select coalesce(max(id),0) into proof from public.vaccination_proofs where dog_id=p_dog_id and is_current;
 if proof=0 then raise exception 'Nahrajte aktuálnu fotografiu očkovacieho preukazu.'; end if;
 if p_include_l4 and p_l4 is null and exists(select 1 from private.vaccination_state_v234 where dog_id=p_dog_id and vaccination_type='lepto_l4') then raise exception 'Evidovanú L4 nemožno odstrániť. Kontaktujte škôlku.'; end if;
 for item in select value from jsonb_array_elements(p_vaccinations || case when p_include_l4 and p_l4 is not null then jsonb_build_array(jsonb_build_object('type','lepto_l4','valid_until',p_l4)) else '[]'::jsonb end) loop
  kind:=item->>'type';until_date:=(item->>'valid_until')::date;
  if until_date<today then raise exception 'Očkovanie je po platnosti. Po preočkovaní zadajte nový dátum a aktuálnu fotografiu dokladu.'; end if;
  if kind='lepto_l4' and not exists(select 1 from private.vaccination_state_v234 where dog_id=p_dog_id and vaccination_type=kind) and proof<=(select coalesce(max(accepted_proof_id),0) from private.vaccination_state_v234 where dog_id=p_dog_id) then raise exception 'Pri doplnení L4 treba aktuálnu novú fotografiu dokladu.';end if;
  if exists(select 1 from private.vaccination_state_v234 s where s.dog_id=p_dog_id and s.vaccination_type=kind and ((s.valid_until is distinct from until_date and proof<=s.accepted_proof_id) or (s.requires_proof_after_id is not null and proof<=s.requires_proof_after_id))) then raise exception 'Pri zmene dátumu treba aktuálnu novú fotografiu dokladu. Pôvodná fotografia nestačí.'; end if;
 end loop;
 delete from public.vaccinations where dog_id=p_dog_id and vaccination_type in ('rabies','infectious','kennel_cough');
 insert into public.vaccinations(dog_id,vaccination_type,valid_until,notes) select p_dog_id,v->>'type',(v->>'valid_until')::date,v->>'notes' from jsonb_array_elements(p_vaccinations) v;
 if p_include_l4 then perform public.portal_set_optional_l4(p_dog_id,p_l4); end if;
 insert into public.portal_dog_onboarding(user_id,dog_id,details_prompt_answered_at,details_prompt_skipped) values(auth.uid(),p_dog_id,now(),false) on conflict(user_id,dog_id) do update set details_prompt_answered_at=excluded.details_prompt_answered_at,details_prompt_skipped=false;
 return jsonb_build_object('dog_id',p_dog_id,'linked',true,'onboarding_complete',true,'vaccinations_atomic_v287',true);
end $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_set_optional_l4(bigint,date)'::regprocedure))<>'a53edd7bfa1933a5b5c77ab37a5184d8' THEN RAISE EXCEPTION 'Changed function: portal_set_optional_l4(bigint,date)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_set_optional_l4(p_dog_id bigint, p_valid_until date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ BEGIN
 PERFORM private.guard_customer_rpc_v336();
 IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.dogs d JOIN public.customer_owner_links l ON l.owner_id=d.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)) WHERE d.id=p_dog_id AND l.user_id=auth.uid()) THEN RAISE EXCEPTION 'Not authorized'; END IF; IF p_valid_until IS NULL AND EXISTS(SELECT 1 FROM private.vaccination_state_v234 s WHERE s.dog_id=p_dog_id AND s.vaccination_type='lepto_l4') THEN RAISE EXCEPTION 'Samostatnú L4 nemožno odstrániť zo zdravotnej evidencie. Ak je zadaná omylom alebo máte DHPPi+L, kontaktujte škôlku.'; END IF; DELETE FROM public.vaccinations WHERE dog_id=p_dog_id AND vaccination_type='lepto_l4'; IF p_valid_until IS NOT NULL THEN INSERT INTO public.vaccinations(dog_id,vaccination_type,valid_until) VALUES(p_dog_id,'lepto_l4',p_valid_until); END IF; RETURN jsonb_build_object('valid_until',p_valid_until); END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_shared_booking_v244(jsonb,uuid,jsonb)'::regprocedure))<>'67bf01da8a3646ca85332ef2ca3fcf5d' THEN RAISE EXCEPTION 'Changed function: portal_shared_booking_v244(jsonb,uuid,jsonb)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_shared_booking_v244(p_items jsonb, p_operation_id uuid, p_expected jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE own bigint; ids bigint[]; payload jsonb; quote jsonb; result jsonb; row public.customer_booking_requests%rowtype; item jsonb; op private.shared_operations_v244%rowtype; day date; old_guard text;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF NOT coalesce((SELECT enabled FROM private.shared_release_v244 WHERE singleton),false) THEN RAISE EXCEPTION 'Spoločné permanentky a rezervácie ešte nie sú sprístupnené.'; END IF;
 IF jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Vyberte psíkov a dni.'; END IF;
 SELECT array_agg(DISTINCT (value->>'dog_id')::bigint ORDER BY (value->>'dog_id')::bigint) INTO ids FROM jsonb_array_elements(p_items);
 IF cardinality(ids) NOT BETWEEN 1 AND 2 OR (SELECT count(DISTINCT (value->>'dog_id',value->>'date')) FROM jsonb_array_elements(p_items))<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Neplatný alebo duplicitný výber.'; END IF;
 own:=private.lock_pool_v244(ids[1]);
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT private.owns_dog_v244(auth.uid(),x)) OR
 (SELECT count(*) FROM public.dogs WHERE id=ANY(ids) AND owner_id=own)<>cardinality(ids) THEN RAISE EXCEPTION 'Psík nie je priradený k vášmu účtu.'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF coalesce(item->>'billing_choice','auto') NOT IN ('auto','single','planned') OR coalesce(item->>'taxi_mode','none') NOT IN ('none','pickup','dropoff','pickup_dropoff') THEN RAISE EXCEPTION 'Neplatný spôsob účtovania alebo taxi.'; END IF;
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
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_sync_owner_terms_v254(text)'::regprocedure))<>'7d8378dcee15f6fb2b6d36cf37a88f01' THEN RAISE EXCEPTION 'Changed function: portal_sync_owner_terms_v254(text)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_sync_owner_terms_v254(p_terms_version text)
 RETURNS SETOF portal_terms_acceptances
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid();doc public.portal_terms_documents%rowtype;t record;src public.portal_terms_acceptances%rowtype;newid bigint;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

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
END $function$
;

DO $check$ BEGIN IF md5(pg_get_functiondef('portal_terms_acceptance_history(bigint)'::regprocedure))<>'cea863557813ed26d2c8d6302a14d6a1' THEN RAISE EXCEPTION 'Changed function: portal_terms_acceptance_history(bigint)';END IF;END $check$;
CREATE OR REPLACE FUNCTION public.portal_terms_acceptance_history(p_dog_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_uid uuid:=auth.uid();v_rows jsonb;
BEGIN
 PERFORM private.guard_customer_rpc_v336();

 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('terms_version',a.terms_version,'document_hash',a.document_hash,'accepted_at',a.accepted_at,'acceptance_text',a.acceptance_text,'title',t.title,'body',t.body,'dog_name',coalesce(a.dog_name_snapshot,d.name),'owner_name',a.user_name_snapshot) ORDER BY a.accepted_at DESC),'[]'::jsonb)
 INTO v_rows FROM public.portal_terms_acceptances a JOIN public.portal_terms_documents t ON t.version=a.terms_version AND t.document_hash=a.document_hash
 LEFT JOIN public.dogs d ON d.id=a.dog_id WHERE a.user_id=v_uid AND a.dog_id=p_dog_id;
 RETURN v_rows;
END;
$function$
;
CREATE POLICY customer_access_v336 ON public."customer_booking_requests" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."customer_dog_submissions" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."customer_owner_links" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."customer_pass_requests" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."customer_profiles" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_announcement_dismissals" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_announcements" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_day_settings" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_live_events" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_notifications" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."portal_terms_acceptances" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
CREATE POLICY customer_access_v336 ON public."staff" AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.portal_customer_access_allowed_v336())) WITH CHECK ((SELECT public.portal_customer_access_allowed_v336()));
