-- Approved bookings notify the requester by push without a persistent in-app card.
-- The existing admin-push Edge Function handles the approved status via the shared dispatcher.
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
  if not exists (
    select 1 from public.staff s
    where s.user_id = v_staff and s.active = true
  ) then raise exception 'Nemáte oprávnenie.'; end if;

  select * into v_row
  from public.customer_booking_requests
  where id = p_request_id
  for update;

  if v_row.id is null then raise exception 'Žiadosť sa nenašla.'; end if;
  if v_row.status <> 'pending' then raise exception 'Žiadosť už bola spracovaná.'; end if;

  select d.default_entry_type
    into v_default_entry_type
  from public.dogs d
  where d.id=v_row.dog_id;

  if v_default_entry_type='free' then
    v_entry_type := 'free';
    v_pass := null;
    v_planned := null;
  else
    select * into v_pass
    from public.passes
    where dog_id = v_row.dog_id
      and status = 'active'
      and used_entries < total_entries
      and (coalesce(no_expiry,false) or valid_until is null or valid_until >= v_row.reservation_date)
    order by coalesce(valid_from, purchased_on, created_at::date), id
    limit 1;

    if v_pass.id is not null then
      v_entry_type := 'pass';
      v_planned := coalesce(v_row.projected_entry_number, v_pass.used_entries + 1);
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
          source_label = 'Zákaznícky portál',
          planned_entry_number = case when v_entry_type='pass' then v_planned else null end,
          planned_pass_total = case when v_entry_type='pass' then v_pass.total_entries else null end,
          pass_locked = v_entry_type='pass' and v_pass.id is not null,
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
      'customer_portal', 'portal_request:' || v_row.id, 'Zákaznícky portál',
      case when v_entry_type='pass' then v_planned else null end,
      case when v_entry_type='pass' then v_pass.total_entries else null end,
      v_entry_type='pass' and v_pass.id is not null,
      case v_row.taxi_mode when 'pickup_dropoff' then 'roundtrip' else v_row.taxi_mode end,
      v_row.taxi_amount, v_row.taxi_mode
    ) returning id into v_reservation_id;
  end if;

  update public.customer_booking_requests
  set status = 'approved',
      reservation_id = v_reservation_id,
      decision_note = nullif(btrim(p_decision_note), ''),
      decided_at = now(),
      decided_by = v_staff
  where id = p_request_id
  returning * into v_row;

  return v_row;
end;
$function$;

create trigger customer_booking_approved_customer_push
after update of status on public.customer_booking_requests
for each row when (old.status is distinct from new.status and new.status = 'approved')
execute function private.dispatch_admin_push();
