-- Bounded, private OpenTelemetry trace storage. No raw OTLP document is retained.
create table private.app_telemetry_v345(
 id bigint generated always as identity primary key,
 received_at timestamptz not null default now(),
 app text not null check(app in ('customer','admin')),
 build text not null,
 category text not null check(category in ('javascript.error','promise.error','request.error','request.slow','operation.error')),
 operation text not null,
 surface text not null,
 browser text not null,
 platform text not null,
 exception_type text not null,
 source_file text not null,
 source_line integer not null,
 source_column integer not null,
 http_status integer not null,
 duration_ms integer not null,
 trace_id text not null check(trace_id ~ '^[0-9a-f]{32}$'),
 span_id text not null check(span_id ~ '^[0-9a-f]{16}$'),
 unique(trace_id,span_id)
);
create index app_telemetry_received_v345 on private.app_telemetry_v345(received_at desc);
create table private.app_telemetry_limits_v345(
 bucket text primary key, used integer not null, expires_at timestamptz not null
);
create table private.app_telemetry_config_v345(
 singleton boolean primary key default true check(singleton), enabled boolean not null default true
);
insert into private.app_telemetry_config_v345 values(true,true);
alter table private.app_telemetry_v345 enable row level security;
alter table private.app_telemetry_limits_v345 enable row level security;
alter table private.app_telemetry_config_v345 enable row level security;
revoke all on private.app_telemetry_v345,private.app_telemetry_limits_v345,private.app_telemetry_config_v345 from public,anon,authenticated;
revoke all on sequence private.app_telemetry_v345_id_seq from public,anon,authenticated;

create function private.telemetry_attributes_v345(p_attributes jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(a->>'key',a->'value'->>'stringValue'),'{}'::jsonb)
 from jsonb_array_elements(case when jsonb_typeof(p_attributes)='array' then p_attributes else '[]'::jsonb end) a
 where a->>'key' in ('service.name','service.version','browser','platform','category','operation','surface','exception.type','code.file','code.line','code.column','http.status','duration.ms')
$$;
revoke all on function private.telemetry_attributes_v345(jsonb) from public,anon,authenticated;

create function public.portal_telemetry_ingest_v345(p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare r jsonb; a jsonb; s jsonb; spans jsonb; app_name text; build_name text; browser_name text; platform_name text;
 is_staff boolean; count_spans integer; used_budget integer; op text; cat text; file_name text; error_type text; surface_name text;
 line_no integer; column_no integer; status_no integer; duration_no integer;
begin
 if auth.uid() is null or not exists(select 1 from auth.sessions where id::text=auth.jwt()->>'session_id' and user_id=auth.uid()) then return false; end if;
 select exists(select 1 from public.staff where user_id=auth.uid() and active) into is_staff;
 if not is_staff and (not public.portal_customer_access_allowed_v336() or not exists(select 1 from public.customer_profiles where user_id=auth.uid() and status in ('active','pending'))) then return false;end if;
 if not (select enabled from private.app_telemetry_config_v345 where singleton) then return false;end if;
 if p_payload is null or octet_length(p_payload::text)>32768 or jsonb_typeof(p_payload->'resourceSpans') is distinct from 'array' then return false;end if;
 if jsonb_array_length(p_payload->'resourceSpans')<>1 then return false;end if;
 r:=p_payload->'resourceSpans'->0;
 if jsonb_typeof(r->'scopeSpans') is distinct from 'array' then return false;end if;
 if jsonb_array_length(r->'scopeSpans')<>1 then return false;end if;
 spans:=r->'scopeSpans'->0->'spans';
 if jsonb_typeof(spans) is distinct from 'array' then return false;end if;
 count_spans:=jsonb_array_length(spans);if count_spans<1 or count_spans>5 then return false;end if;
 a:=private.telemetry_attributes_v345(r->'resource'->'attributes');
 app_name:=case a->>'service.name' when 'chvostikovo-customer' then 'customer' when 'chvostikovo-admin' then 'admin' end;
 if app_name is null or (app_name='admin' and not is_staff) then return false;end if;
 build_name:=a->>'service.version';if build_name is null or build_name !~ '^[0-9]{8}-[a-z0-9-]{1,70}$' then return false;end if;
 browser_name:=case when a->>'browser' ~ '^(Safari|Chrome|Edge|Firefox|Samsung)/[0-9]{1,3}$' then a->>'browser' else 'Other' end;
 platform_name:=case when a->>'platform' in ('Android','iOS','desktop') then a->>'platform' else 'desktop' end;
 -- Per-user hashes last one day; no account ID/IP is stored in the trace table.
 insert into private.app_telemetry_limits_v345(bucket,used,expires_at)
 values('u:'||md5(auth.uid()::text||current_date::text)||':'||floor(extract(epoch from now())/600),count_spans,now()+interval '1 day')
 on conflict(bucket) do update set used=private.app_telemetry_limits_v345.used+excluded.used where private.app_telemetry_limits_v345.used+excluded.used<=60 returning used into used_budget;
 if used_budget is null then return false;end if;
 used_budget:=null;
 insert into private.app_telemetry_limits_v345(bucket,used,expires_at) values('g:'||current_date::text,count_spans,now()+interval '2 days')
 on conflict(bucket) do update set used=private.app_telemetry_limits_v345.used+excluded.used where private.app_telemetry_limits_v345.used+excluded.used<=5000 returning used into used_budget;
 if used_budget is null then return false;end if;
 for s in select value from jsonb_array_elements(spans) loop
  if coalesce(s->>'traceId','') !~ '^[0-9a-f]{32}$' or coalesce(s->>'spanId','') !~ '^[0-9a-f]{16}$' then continue;end if;
  a:=private.telemetry_attributes_v345(s->'attributes');cat:=a->>'category';
  if cat is null or cat not in ('javascript.error','promise.error','request.error','request.slow','operation.error') then continue;end if;
  op:=a->>'operation';
  if op like 'rpc/%' and exists(select 1 from pg_proc where pronamespace='public'::regnamespace and proname=substring(op from 5)) then null;
  elsif op like 'db/%' and exists(select 1 from information_schema.tables where table_schema='public' and table_name=substring(op from 4)) then null;
  elsif op not in ('storage','javascript','customer-operation','edge/customer-portal-api','edge/admin-push','edge/meta-crm-event','edge/web-form-submit','edge/admin-campaign-sync','action/save_profile','action/save_dog','action/upload_vaccination_proofs','action/upload_dog_photo','action/delete_dog_photo','action/set_photo_visibility','action/request_new_pass','action/request_late_booking','action/shared_booking_v257','action/request_dogs_bookings','action/request_bookings','action/request_booking','action/cancel_booking','action/request_taxi_change','action/send_message') or op is null then op:='request';end if;
  file_name:=case when a->>'code.file' in ('app.js','customer-design.js','dual-dog-overview-v246.js','back-swipe.js','loading-motion.js','telemetry-v345.js','admin-inline') then a->>'code.file' else 'unknown' end;
  error_type:=case when a->>'exception.type' in ('Error','TypeError','ReferenceError','SyntaxError','RangeError','URIError','EvalError','AggregateError','NetworkError','TimeoutError') then a->>'exception.type' else 'Error' end;
  surface_name:=case when a->>'surface' in ('overview','reservations','menu','vaccinations','dog-details','messages','other') then a->>'surface' else 'other' end;
  line_no:=case when a->>'code.line' ~ '^[0-9]{1,7}$' then least(1000000,(a->>'code.line')::integer) else 0 end;
  column_no:=case when a->>'code.column' ~ '^[0-9]{1,7}$' then least(1000000,(a->>'code.column')::integer) else 0 end;
  status_no:=case when a->>'http.status' ~ '^[0-9]{1,3}$' then least(599,(a->>'http.status')::integer) else 0 end;
  duration_no:=case when a->>'duration.ms' ~ '^[0-9]{1,6}$' then least(300000,(a->>'duration.ms')::integer) else 0 end;
  insert into private.app_telemetry_v345(app,build,category,operation,surface,browser,platform,exception_type,source_file,source_line,source_column,http_status,duration_ms,trace_id,span_id)
  values(app_name,build_name,cat,op,surface_name,browser_name,platform_name,error_type,file_name,line_no,column_no,status_no,duration_no,s->>'traceId',s->>'spanId') on conflict(trace_id,span_id) do nothing;
 end loop;
 return true;
end $$;
revoke all on function public.portal_telemetry_ingest_v345(jsonb) from public,anon;
grant execute on function public.portal_telemetry_ingest_v345(jsonb) to authenticated;

create function public.portal_staff_telemetry_v345()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=auth.uid() and active) or not exists(select 1 from auth.sessions where id::text=auth.jwt()->>'session_id' and user_id=auth.uid()) then raise exception 'Prístup len pre správcu.' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(g) order by g.last_seen desc),'[]'::jsonb) into result from (
  select app,build,category,operation,surface,browser,platform,exception_type,source_file,source_line,http_status,count(*) as occurrences,max(duration_ms) max_duration_ms,max(received_at) last_seen
  from private.app_telemetry_v345 where received_at>=now()-interval '7 days'
  group by app,build,category,operation,surface,browser,platform,exception_type,source_file,source_line,http_status order by max(received_at) desc limit 100
 ) g;
 return jsonb_build_object('enabled',(select enabled from private.app_telemetry_config_v345 where singleton),'days',7,'groups',result);
end $$;
revoke all on function public.portal_staff_telemetry_v345() from public,anon;
grant execute on function public.portal_staff_telemetry_v345() to authenticated;

-- Cleanup runs independently of app usage and does not create notifications.
select cron.schedule('app-telemetry-retention-v345','17 * * * *',
 'delete from private.app_telemetry_v345 where received_at<now()-interval ''30 days''; delete from private.app_telemetry_limits_v345 where expires_at<now();');
