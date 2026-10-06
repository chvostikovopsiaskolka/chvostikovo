-- Production-safe integration check: all fixture changes and webhook queue entries roll back.
begin;
do $$
declare
 v_uid uuid := '80c97dd1-9fff-49b3-9925-46c5e90b0108';
 v_pass bigint; v_request public.customer_pass_requests%rowtype;
 v_booking public.customer_booking_requests%rowtype; v_denied boolean;
begin
 if private.recent_pass_renewal_eligible(3) or private.recent_pass_renewal_eligible(20)
   or private.recent_pass_renewal_eligible(65) then raise exception 'Single-entry dog eligible'; end if;
 insert into public.passes(dog_id,total_entries,used_entries,status,source,valid_from,valid_until,purchase_price)
 values(77,10,10,'used_up','renewal_rollback_test',date '2026-08-03',date '2026-10-02',0) returning id into v_pass;
 if not private.recent_pass_renewal_eligible(77) then raise exception 'Recent completed pass not eligible'; end if;
 update public.passes set valid_until=date '2026-09-20' where id=v_pass;
 if private.recent_pass_renewal_eligible(77) then raise exception 'Old completed pass eligible'; end if;
 update public.passes set valid_until=date '2026-10-02' where id=v_pass;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid,'role','authenticated')::text,true);
 v_denied:=false;
 begin perform public.portal_pass_renewal_eligible(13); exception when others then v_denied:=true; end;
 if not v_denied then raise exception 'Ownership guard failed'; end if;
 update public.customer_profiles set status='active' where user_id=v_uid;
 if not public.portal_pass_renewal_eligible(77) then raise exception 'Owned RPC not eligible'; end if;
 v_request:=public.portal_request_pass(77,10);
 if v_request.status<>'pending' or v_request.dog_id<>77 or v_request.user_id<>v_uid then raise exception 'Interest binding failed'; end if;
 v_denied:=false;
 begin perform public.portal_request_pass(77,10); exception when others then v_denied:=true; end;
 if not v_denied then raise exception 'Duplicate interest accepted'; end if;
 insert into public.customer_booking_requests(user_id,dog_id,reservation_date)
 values(v_uid,77,date '2026-10-12') returning * into v_booking;
 perform private.replan_dog_reservations(77,date '2026-10-06');
 select * into v_booking from public.customer_booking_requests where id=v_booking.id;
 if v_booking.projected_entry_number<>1 or v_booking.projected_pass_total<>10
   or v_booking.planned_pass_request_id<>v_request.id then raise exception 'New 1/10 planning failed'; end if;
 if exists(select 1 from public.passes where dog_id=77 and status in('active','queued')) then raise exception 'Unpaid purchase created'; end if;
end $$;
rollback;
select 'PASS: recent vs old vs single; owned RPC; duplicate guard; pending interest and new 1/10; no purchase; fixtures rolled back' as result;
