-- Private diagnostic data only; no names, phone numbers, or form contents.
alter table public.website_interaction_events add column if not exists attempt_id uuid;
create unique index if not exists website_interaction_events_attempt_once_uidx
  on public.website_interaction_events (attempt_id, event_name) where attempt_id is not null;

create table public.website_form_error_alerts (
  attempt_id uuid primary key,
  created_at timestamptz not null default now(),
  path text not null,
  form_source text not null,
  error_stage text not null,
  http_status integer,
  delivery_status text not null check (delivery_status in ('reserved','sent','failed','rate_limited')),
  resend_id text,
  sent_at timestamptz
);
alter table public.website_form_error_alerts enable row level security;
revoke all on public.website_form_error_alerts from anon, authenticated;
grant select, insert, update on public.website_form_error_alerts to service_role;
create index website_form_error_alerts_created_idx on public.website_form_error_alerts (created_at desc);

create function public.reserve_website_form_error_alert(
  p_attempt_id uuid, p_path text, p_form_source text, p_error_stage text, p_http_status integer
) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text;
begin
  -- Atomic deduplication and a global ceiling protect the existing mail inbox.
  perform pg_advisory_xact_lock(184293071);
  if exists (select 1 from public.website_form_error_alerts where attempt_id = p_attempt_id) then
    return 'duplicate';
  end if;
  select case when count(*) < 5 then 'reserved' else 'rate_limited' end into v_status
    from public.website_form_error_alerts
    where created_at > now() - interval '10 minutes' and delivery_status in ('reserved','sent','failed');
  insert into public.website_form_error_alerts(attempt_id,path,form_source,error_stage,http_status,delivery_status)
    values(p_attempt_id,p_path,p_form_source,p_error_stage,p_http_status,v_status);
  return v_status;
end;
$$;
revoke all on function public.reserve_website_form_error_alert(uuid,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_website_form_error_alert(uuid,text,text,text,integer) to service_role;
