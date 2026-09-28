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
    perform private.replan_dog_reservations(p_dog_id, v_today + 1);
  end if;

  update public.dogs
     set default_entry_type = 'pass'
   where id = p_dog_id;

  return v_id;
end;
$function$
