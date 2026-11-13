-- Chvostíkovo, 2026-11-13. Apply via guarded Supabase migration telemetry_alert_noise_guard_v428_20261113.
-- Only staff telemetry alerts change: retain all original private events, auth/RLS, collector, business requests and push delivery.
-- Baseline: production private.telemetry_alert_v347() MD5 ddfe3f7a10530e45400a29d8cd8bbb65.
-- Rollback: restore the exact old v347 trigger shown in this file; original function is intentionally retained.
do $preflight$
declare actual_trigger text;
begin
 if md5(pg_get_functiondef('private.telemetry_alert_v347()'::regprocedure)) <> 'ddfe3f7a10530e45400a29d8cd8bbb65' then
   raise exception 'LIVE telemetry alert function changed; review required';
 end if;
 select pg_get_triggerdef(t.oid) into actual_trigger from pg_trigger t
 where t.tgrelid='private.app_telemetry_v345'::regclass and t.tgname='app_telemetry_alert_v347' and not t.tgisinternal;
 if actual_trigger is distinct from
 'CREATE TRIGGER app_telemetry_alert_v347 AFTER INSERT ON private.app_telemetry_v345 FOR EACH ROW WHEN ((new.category = ANY (ARRAY[''javascript.error''::text, ''promise.error''::text, ''request.error''::text, ''request.slow''::text, ''operation.error''::text]))) EXECUTE FUNCTION private.telemetry_alert_v347()' then
   raise exception 'LIVE telemetry alert trigger changed; review required';
 end if;
 if not exists(select 1 from private.app_telemetry_config_v345 where singleton and enabled)
    or to_regclass('private.app_telemetry_issues_v347') is null then
   raise exception 'LIVE telemetry config/fingerprint ledger differs; review required';
 end if;
end $preflight$;

create function private.telemetry_alert_v428()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  occurrences integer;
  issue_key text;
  last_alert timestamptz;
  app_label text;
  area_label text;
  reason_label text;
  version_label text;
begin
  -- Expected client validation/auth 4xx, minor slowness and startup interruptions
  -- remain in private technical reports; they never page staff.
  if not (
    new.category in ('javascript.error','promise.error')
    or (new.category in ('request.error','operation.error') and (new.http_status=0 or new.http_status>=500))
    or (new.category='request.slow' and new.duration_ms>=30000)
  ) then return new; end if;

  -- A single network hiccup (HTTP 0 / TypeError) is a real failed attempt, not
  -- evidence of a lasting outage. Page only after three same-kind errors / 15m.
  select count(*) into occurrences
  from private.app_telemetry_v345 e
  where e.received_at >= now()-interval '15 minutes'
    and e.app=new.app and e.build=new.build and e.category=new.category
    and e.operation=new.operation
    and e.exception_type is not distinct from new.exception_type
    and e.source_file is not distinct from new.source_file
    and e.source_line is not distinct from new.source_line
    and e.http_status is not distinct from new.http_status;
  if occurrences < 3 then return new; end if;

  issue_key:=md5(concat_ws('|',new.app,new.build,new.category,new.operation,
                           new.exception_type,new.source_file,new.source_line,new.http_status));
  -- This lock serializes simultaneous events from different devices.
  select c.last_alert_at into last_alert
  from private.app_telemetry_config_v345 c
  where c.singleton and c.enabled for update;
  if not found or last_alert>now()-interval '1 hour' then return new; end if;
  if exists(select 1 from private.app_telemetry_issues_v347 i
            where i.fingerprint=issue_key and i.last_notified_at>now()-interval '24 hours')
  then return new; end if;

  insert into private.app_telemetry_issues_v347(fingerprint,last_notified_at)
  values(issue_key,now())
  on conflict (fingerprint) do update set last_notified_at=excluded.last_notified_at;
  update private.app_telemetry_config_v345 set last_alert_at=now() where singleton;
  app_label:=case when new.app='admin' then 'Admin' else 'Zákaznícka appka' end;
  version_label:=coalesce(substring(new.build from 'v([0-9]+)$'),'nezistená');
  area_label:=case when new.operation like '%portal_terms%' then 'Podmienky škôlky'
    when new.operation like '%announcement%' then 'Nástenka a oznamy'
    when new.operation like '%marketing_report%' then 'Marketingové reporty'
    when new.operation='edge/admin-push' then 'Push upozornenia'
    when new.operation like '%vaccin%' then 'Očkovania'
    when new.operation like '%booking%' or new.operation like '%reservation%' then 'Rezervácie'
    when new.operation like '%message%' then 'Správy'
    when new.operation='edge/customer-portal-api' then 'Zákaznícke API'
    else 'Operácie aplikácie' end;
  reason_label:=case when new.http_status>=500 then 'opakovaná chyba servera'
    when new.category='request.slow' or new.exception_type='TimeoutError' then 'opakované dlhé čakanie'
    when new.category='request.error' and new.http_status=0 then 'opakované zlyhanie spojenia'
    else 'opakovaná technická chyba' end;
  insert into public.portal_notifications(recipient_user_id,notification_type,title,body,entity_type,event_key)
  select s.user_id,'app_diagnostics_admin',app_label||' · opakovaný problém',
    area_label||': '||reason_label||case when new.http_status>0 then ' (HTTP '||new.http_status||')' else '' end
      ||'. Verzia '||version_label||'. Menu → Technický stav appiek.',
    'app_diagnostics','telemetry:repeat:'||issue_key||':'||extract(epoch from now())::bigint||':'||s.user_id::text
  from public.staff s where s.active=true;
  return new;
exception when others then
  -- A telemetry-alert failure never breaks the customer's original request.
  return new;
end $function$;
revoke all on function private.telemetry_alert_v428() from public,anon,authenticated;
drop trigger app_telemetry_alert_v347 on private.app_telemetry_v345;
create trigger app_telemetry_alert_v428 after insert on private.app_telemetry_v345
for each row
when (new.category in ('javascript.error','promise.error','request.error','request.slow','operation.error'))
execute function private.telemetry_alert_v428();

-- Readback (no outbound test notifications):
-- select pg_get_triggerdef(oid) from pg_trigger where tgname='app_telemetry_alert_v428';
-- select has_function_privilege('authenticated','private.telemetry_alert_v428()','EXECUTE');
-- Rollback ONLY after new-state review:
-- drop trigger app_telemetry_alert_v428 on private.app_telemetry_v345;
-- create trigger app_telemetry_alert_v347 after insert on private.app_telemetry_v345
-- for each row when (new.category in ('javascript.error','promise.error','request.error','request.slow','operation.error'))
-- execute function private.telemetry_alert_v347();
-- Leave original v347 function and private event rows/issue ledger intact.
