-- Owner-confirmed attendance correction: Hannah attended 14 October.
-- Never approve the future pending requests and never create a purchase.
DO $repair$ DECLARE before_value jsonb;after_value jsonb;v_count integer;BEGIN
 perform private.lock_pool_v244(79);
 perform 1 from public.passes where id=64 for update;
 if exists(select 1 from private.shared_audit_v244 where entity='attendance_repair_v270' and entity_id='hannah-20261014') then raise exception 'Repair already recorded';end if;
 if not exists(select 1 from public.reservations where id=349 and dog_id=79 and reservation_date='2026-10-14' and status='booked' and pass_id=64) then raise exception 'Reservation changed';end if;
 if exists(select 1 from public.visits where reservation_id=349) then raise exception 'Visit already exists';end if;
 if not exists(select 1 from public.passes where id=64 and used_entries=5 and total_entries=10 and purchase_price=200 and purchased_on='2026-10-09') then raise exception 'Pass changed';end if;
 if (select count(*) from public.visits where pass_id=64)<>5 then raise exception 'Pass history differs';end if;
 select jsonb_build_object('pass',(select to_jsonb(p) from public.passes p where id=64),'visits',(select jsonb_agg(v) from public.visits v where pass_id=64),'reservations',(select jsonb_agg(r) from public.reservations r where dog_id=79 and reservation_date>='2026-10-09'),'requests',(select jsonb_agg(q) from public.customer_booking_requests q where dog_id=79),'dog',(select to_jsonb(d) from public.dogs d where id=79),'monthly',(select jsonb_agg(m) from public.monthly_visit_totals m where dog_id=79 and month='2026-10-01'),'daily',(select to_jsonb(f) from public.daily_financials f where day='2026-10-14')) into before_value;
 perform set_config('chvostikovo.shared_planning','1',true);
 insert into public.visits(dog_id,reservation_id,visit_date,entry_type,pass_id,pass_entry_number,value_amount,taxi_mode,taxi_amount,notes)
 values(79,349,'2026-10-14','pass',64,4,20,'none',0,'Dochádzka potvrdená prevádzkovateľom 16.10.2026; oprava zlyhaného ranného spracovania 14.10.2026.');
 update public.passes set used_entries=6 where id=64;
 with ranked as(select id,row_number() over(order by visit_date,id)::integer n from public.visits where pass_id=64)
 update public.visits v set pass_entry_number=t.n from ranked t where v.id=t.id and v.pass_entry_number is distinct from t.n;
 update public.reservations r set status='attended',planned_entry_number=v.pass_entry_number,planned_pass_total=10 from public.visits v where v.pass_id=64 and v.reservation_id=r.id and (r.status,r.planned_entry_number,r.planned_pass_total) is distinct from ('attended',v.pass_entry_number,10);
 update public.customer_booking_requests q set projected_entry_number=r.planned_entry_number,projected_pass_total=r.planned_pass_total from public.reservations r where q.reservation_id=r.id and r.dog_id=79 and r.status='attended' and q.status='approved' and (q.projected_entry_number,q.projected_pass_total) is distinct from (r.planned_entry_number,r.planned_pass_total);
 update public.dogs set legacy_total_visits=coalesce(legacy_total_visits,0)+1 where id=79;
 insert into public.monthly_visit_totals(dog_id,month,visits,source) values(79,'2026-10-01',1,'app') on conflict(dog_id,month) do update set visits=public.monthly_visit_totals.visits+1;
 perform set_config('chvostikovo.shared_planning','0',true);
 perform private.replan_dog_reservations(79,'2026-10-16');
 perform private.refresh_daily_financial('2026-10-14');
 if (select array_agg(pass_entry_number order by visit_date,id) from public.visits where pass_id=64)<>array[1,2,3,4,5,6] then raise exception 'Actual history differs';end if;
 if (select array_agg(projected_entry_number order by reservation_date,id) from public.customer_booking_requests where id between 83 and 87 and dog_id=79 and status='pending')<>array[7,8,9,10,1] then raise exception 'Future sequence differs';end if;
 if not exists(select 1 from public.customer_booking_requests where id=87 and planned_pass_request_id=11) then raise exception 'Friday must refer to pending renewal';end if;
 -- Attended calendar events need explicit title refresh; the normal trigger only sends booked rows.
 perform private.enqueue_google_calendar_reservation(r.id,r.dog_id,r.reservation_date,r.entry_type,r.planned_entry_number,r.planned_pass_total,r.pass_id,'upsert') from public.reservations r where r.dog_id=79 and r.pass_id=64 and r.status='attended' and r.reservation_date>='2026-10-09';
 select jsonb_build_object('pass',(select to_jsonb(p) from public.passes p where id=64),'visits',(select jsonb_agg(v) from public.visits v where pass_id=64),'requests',(select jsonb_agg(q) from public.customer_booking_requests q where dog_id=79),'daily',(select to_jsonb(f) from public.daily_financials f where day='2026-10-14')) into after_value;
 insert into private.shared_audit_v244(entity,entity_id,old_value,new_value) values('attendance_repair_v270','hannah-20261014',before_value,after_value);
END $repair$;
