-- Applied as a migration; authenticated RPC checks ownership before reading history.
create or replace function private.recent_pass_renewal_eligible(p_dog_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  v_today date := (now() at time zone 'Europe/Bratislava')::date;
  v_since date := date_trunc('week',now() at time zone 'Europe/Bratislava')::date-7;
  v_pass public.passes%rowtype;
  v_reserved integer;
begin
  if not exists(select 1 from public.dogs where id=p_dog_id and active and default_entry_type<>'free')
    or exists(select 1 from public.customer_pass_requests where dog_id=p_dog_id and status='pending')
    or exists(select 1 from public.passes where dog_id=p_dog_id and status='queued' and used_entries<total_entries)
    then return false; end if;
  select * into v_pass from public.passes where dog_id=p_dog_id and status='active'
    and used_entries<total_entries and (no_expiry or valid_until is null or valid_until>=v_today)
    order by coalesce(valid_from,purchased_on,created_at::date),id limit 1;
  if v_pass.id is not null then
    select (select count(*) from public.reservations where dog_id=p_dog_id and status='booked'
      and entry_type='pass' and reservation_date>=v_today)
      +(select count(*) from public.customer_booking_requests where dog_id=p_dog_id and status='pending'
      and reservation_date>=v_today and projected_pass_total=v_pass.total_entries and planned_pass_request_id is null)
      into v_reserved;
    return v_pass.used_entries+v_reserved>=v_pass.total_entries;
  end if;
  return exists(select 1 from public.passes p where p.dog_id=p_dog_id
    and p.status in ('active','expired','used_up')
    and (p.valid_from is null or p.valid_from<=v_today)
    and ((not coalesce(p.no_expiry,false) and p.valid_until between v_since and v_today-1)
      or (p.used_entries>=p.total_entries and exists(select 1 from public.visits v
        where v.pass_id=p.id and v.entry_type='pass' and v.pass_entry_number>=p.total_entries
        and v.visit_date between v_since and v_today))));
end $$;
revoke all on function private.recent_pass_renewal_eligible(bigint) from public,anon,authenticated;

create or replace function public.portal_pass_renewal_eligible(p_dog_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null or exists(select 1 from public.customer_profiles where user_id=v_uid and status='suspended')
    or not exists(select 1 from public.customer_owner_links l join public.dogs d on d.owner_id=l.owner_id
      where l.user_id=v_uid and d.id=p_dog_id and d.active)
    then raise exception 'Tento psík nie je priradený k vášmu účtu.'; end if;
  return private.recent_pass_renewal_eligible(p_dog_id);
end $$;
revoke all on function public.portal_pass_renewal_eligible(bigint) from public,anon;
grant execute on function public.portal_pass_renewal_eligible(bigint) to authenticated;
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
      join public.dogs d on d.owner_id=l.owner_id
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
