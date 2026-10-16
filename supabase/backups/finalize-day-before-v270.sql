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
$function$

