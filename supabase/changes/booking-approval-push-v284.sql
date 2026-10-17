create table private.booking_approval_push_events_v284(
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 request_ids bigint[] not null, created_at timestamptz not null default now()
);
alter table private.booking_approval_push_events_v284 enable row level security;
revoke all on private.booking_approval_push_events_v284 from public,anon,authenticated;
create trigger booking_approval_push_event_dispatch_v284 after insert on private.booking_approval_push_events_v284
for each row execute function private.dispatch_admin_push();

-- Patch the existing trigger without copying its private webhook credential into source.
do $patch$
declare src text; anchor text:=E'begin\n';
begin
 src:=pg_get_functiondef('private.dispatch_admin_push()'::regprocedure);
 if strpos(src,'chvostikovo.approval_batch_v284')>0 then raise exception 'Already patched';end if;
 if strpos(src,anchor)=0 then raise exception 'Trigger baseline changed';end if;
 src:=replace(src,anchor,anchor||E'  if tg_table_name = ''customer_booking_requests'' and tg_op = ''UPDATE'' then\n    if new.status = ''approved'' and current_setting(''chvostikovo.approval_batch_v284'',true) = ''1'' then return new; end if;\n  end if;\n');
 execute src;
end $patch$;

create or replace function public.portal_approve_booking_batch_v284(p_request_ids bigint[]) returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare account uuid; candidates bigint[]; pending_before bigint[]; newly_approved bigint[]; approved bigint[]; failures jsonb:='[]';
 q record; previous_setting text:=coalesce(current_setting('chvostikovo.approval_batch_v284',true),'');
begin
 if not exists(select 1 from public.staff where user_id=(select auth.uid()) and active) then raise exception 'Prístup len pre personál.' using errcode='42501';end if;
 if p_request_ids is null or cardinality(p_request_ids) not between 1 and 60 or array_position(p_request_ids,null) is not null then raise exception 'Neplatný výber dní.';end if;
 if (select count(*) from public.customer_booking_requests where id=any(p_request_ids))<>(select count(distinct x) from unnest(p_request_ids) x) then raise exception 'Niektorá požiadavka sa nenašla.';end if;
 if (select count(distinct user_id) from public.customer_booking_requests where id=any(p_request_ids))<>1 then raise exception 'Vyberte rezervácie jedného účtu.';end if;
 select user_id into account from public.customer_booking_requests where id=any(p_request_ids) order by id limit 1;
 select array_agg(distinct r.id order by r.id) into candidates from public.customer_booking_requests r
 where r.user_id=account and (r.id=any(p_request_ids) or r.booking_group_id in(select booking_group_id from public.customer_booking_requests where id=any(p_request_ids) and booking_group_id is not null));
 for q in select distinct d.owner_id from public.customer_booking_requests r join public.dogs d on d.id=r.dog_id where r.id=any(candidates) order by d.owner_id
 loop perform pg_advisory_xact_lock(-q.owner_id);end loop;
 perform 1 from public.customer_booking_requests where id=any(candidates) order by id for update;
 select coalesce(array_agg(id),'{}'::bigint[]) into pending_before from public.customer_booking_requests where id=any(candidates) and status='pending';
 perform set_config('chvostikovo.approval_batch_v284','1',true);
 for q in select id,status from public.customer_booking_requests where id=any(p_request_ids) order by reservation_date,id loop
  if (select status from public.customer_booking_requests where id=q.id)='approved' then continue;end if;
  begin
   perform public.portal_approve_booking(q.id,null);
  exception when others then
   failures:=failures||jsonb_build_array(jsonb_build_object('id',q.id,'message',sqlerrm));
  end;
 end loop;
 select coalesce(array_agg(id order by reservation_date,id),'{}'::bigint[]) into approved from public.customer_booking_requests where id=any(candidates) and status='approved';
 select coalesce(array_agg(id order by reservation_date,id),'{}'::bigint[]) into newly_approved from public.customer_booking_requests where id=any(pending_before) and status='approved';
 perform set_config('chvostikovo.approval_batch_v284',previous_setting,true);
 if cardinality(newly_approved)>0 then
  insert into private.booking_approval_push_events_v284(user_id,request_ids) values(account,newly_approved);
 end if;
 return jsonb_build_object('approved_ids',approved,'newly_approved_ids',newly_approved,'errors',failures);
exception when others then
 perform set_config('chvostikovo.approval_batch_v284',previous_setting,true);raise;
end $fn$;
revoke all on function public.portal_approve_booking_batch_v284(bigint[]) from public,anon;
grant execute on function public.portal_approve_booking_batch_v284(bigint[]) to authenticated;
