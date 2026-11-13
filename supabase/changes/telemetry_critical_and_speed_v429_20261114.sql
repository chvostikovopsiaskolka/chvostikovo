-- Chvostikovo monitoring v429 (14 November 2026)
-- Backend-only: instant, per-incident critical alerts; retain v428 3/15m for transient network errors.
-- Read-only staff performance aggregates from already-collected sampled startup.complete spans.
-- No customer data, Auth, RLS, reservations, tokens, Web Push or FCM registration changes.
-- Preflight LIVE hashes 13 Nov 2026: v428=6d195d6f318609b92178d5d89e9ad357; staff RPC=f45bf701f6355e4e23f4b5efeb9d84d1.

do $preflight$
declare trigger_def text;
begin
 if md5(pg_get_functiondef('private.telemetry_alert_v428()'::regprocedure)) <> '6d195d6f318609b92178d5d89e9ad357'
    or md5(pg_get_functiondef('public.portal_staff_telemetry_v345()'::regprocedure)) <> 'f45bf701f6355e4e23f4b5efeb9d84d1'
 then raise exception 'LIVE monitoring function changed: stop, review and rebase';end if;
 select pg_get_triggerdef(t.oid) into trigger_def from pg_trigger t
 where t.tgrelid='private.app_telemetry_v345'::regclass and t.tgname='app_telemetry_alert_v428' and not t.tgisinternal;
 if trigger_def is distinct from
 'CREATE TRIGGER app_telemetry_alert_v428 AFTER INSERT ON private.app_telemetry_v345 FOR EACH ROW WHEN ((new.category = ANY (ARRAY[''javascript.error''::text, ''promise.error''::text, ''request.error''::text, ''request.slow''::text, ''operation.error''::text]))) EXECUTE FUNCTION private.telemetry_alert_v428()'
 then raise exception 'LIVE monitoring trigger changed: stop and review';end if;
 if to_regclass('private.app_telemetry_issues_v347') is null then raise exception 'Fingerprint ledger missing';end if;
end $preflight$;

-- Keep v428 unchanged for rollback and for repeated network/slow/request-operation errors.
-- v429 handles only verified HTTP 5xx, uncaught JS/promise errors and failed startup.
create function private.telemetry_critical_alert_v429()
returns trigger
language plpgsql security definer set search_path=''
as $function$
declare issue_key text; app_label text;area_label text; reason_label text;version_label text;
begin
 if not (
  new.category in ('javascript.error','promise.error','startup.failed')
  or (new.category in ('request.error','operation.error') and new.http_status>=500)
 ) then return new;end if;
 issue_key:=md5(concat_ws('|',new.app,new.build,new.category,new.operation,
                          new.exception_type,new.source_file,new.source_line,new.http_status));
 -- Row-lock and fingerprint dedup ensure one critical alert per issue per 24h,
 -- without a global hourly cap hiding independent critical faults.
 perform 1 from private.app_telemetry_config_v345 where singleton and enabled for update;
 if not found then return new;end if;
 if exists(select 1 from private.app_telemetry_issues_v347
           where fingerprint=issue_key and last_notified_at>now()-interval '24 hours')
 then return new;end if;
 insert into private.app_telemetry_issues_v347(fingerprint,last_notified_at)
 values(issue_key,now())
 on conflict(fingerprint) do update set last_notified_at=excluded.last_notified_at;

 app_label:=case when new.app='admin' then 'Admin' else 'Zákaznícka appka' end;
 version_label:=coalesce(substring(new.build from 'v([0-9]+)$'),'nezistená');
 area_label:=case when new.category='startup.failed' then 'Spustenie aplikácie'
   when new.operation like '%portal_terms%' then 'Podmienky škôlky'
   when new.operation like '%announcement%' then 'Oznamy'
   when new.operation like '%vaccin%' then 'Očkovania'
   when new.operation like '%booking%' or new.operation like '%reservation%' then 'Rezervácie'
   when new.operation like '%message%' then 'Správy'
   when new.operation='edge/customer-portal-api' then 'Zákaznícke API'
   else 'Operácie aplikácie' end;
 reason_label:=case when new.http_status>=500 then 'chyba servera (HTTP '||new.http_status||')'
   when new.category='startup.failed' then 'neúspešné spustenie'
   else 'nezachytená chyba aplikácie' end;
 insert into public.portal_notifications(recipient_user_id,notification_type,title,body,entity_type,event_key)
 select s.user_id,'app_diagnostics_admin',app_label||' · závažná chyba',
        area_label||': '||reason_label||'. Verzia '||version_label||'. Menu → Technický stav appiek.',
        'app_diagnostics','telemetry:critical:'||issue_key||':'||extract(epoch from now())::bigint||':'||s.user_id::text
 from public.staff s where s.active=true;
 return new;
exception when others then return new;
end $function$;

revoke all on function private.telemetry_critical_alert_v429() from public,anon,authenticated;
drop trigger app_telemetry_alert_v428 on private.app_telemetry_v345;
create trigger app_telemetry_alert_v428 after insert on private.app_telemetry_v345
for each row when (
 (new.category in ('request.error','operation.error') and new.http_status<500)
 or new.category='request.slow'
)
execute function private.telemetry_alert_v428();

create trigger app_telemetry_critical_v429 after insert on private.app_telemetry_v345
for each row when (
 new.category in ('javascript.error','promise.error','startup.failed')
 or (new.category in ('request.error','operation.error') and new.http_status>=500)
)
execute function private.telemetry_critical_alert_v429();

-- Same staff + live auth.sessions guard and existing 'groups' output, extended only
-- with bounded, privacy-filtered 7-day performance aggregates. Success startup
-- traces are sampled at 10% in the current customer reporter, so not a success rate.
create or replace function public.portal_staff_telemetry_v345()
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare result jsonb; performance_rows jsonb;
begin
 if auth.uid() is null
  or not exists(select 1 from public.staff where user_id=auth.uid() and active)
  or not exists(select 1 from auth.sessions where id::text=auth.jwt()->>'session_id' and user_id=auth.uid())
 then raise exception 'Prístup len pre správcu.' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(g) order by g.last_seen desc),'[]'::jsonb) into result
 from (
   select app,build,category,operation,surface,browser,platform,exception_type,
          source_file,source_line,http_status,count(*) as occurrences,
          max(duration_ms) max_duration_ms,max(received_at) last_seen
   from private.app_telemetry_v345 where received_at>=now()-interval '7 days'
   group by app,build,category,operation,surface,browser,platform,exception_type,source_file,source_line,http_status
   order by max(received_at) desc limit 100
 ) g;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.last_seen desc),'[]'::jsonb) into performance_rows
 from (
   select build,operation,count(*)::int as samples,
          round(percentile_cont(0.5) within group(order by duration_ms)::numeric)::int as p50_ms,
          round(percentile_cont(0.95) within group(order by duration_ms)::numeric)::int as p95_ms,
          max(received_at) last_seen
   from private.app_telemetry_v345
   where received_at>=now()-interval '7 days'
     and app='customer' and category='startup.complete'
     and operation in ('startup/cold/total','startup/resume/total')
   group by build,operation
   order by max(received_at) desc limit 12
 ) t;
 return jsonb_build_object(
   'enabled',(select enabled from private.app_telemetry_config_v345 where singleton),
   'days',7,'groups',result,'performance',performance_rows,
   'performance_sample_note','Úspešné štarty sú vzorkované približne na 10 %. P95 pri malom počte vzoriek nie je spoľahlivé.'
 );
end $function$;

-- Rollback after live-state review:
-- 1) drop trigger app_telemetry_critical_v429;
-- 2) drop trigger app_telemetry_alert_v428 and restore its previous WHEN with
--    javascript.error, promise.error, request.error, request.slow, operation.error;
-- 3) restore prior public.portal_staff_telemetry_v345() definition with exact staff/session guard
--    (in Git history, this migration preflight, or database-managed backup).
-- Preserve private telemetry, fingerprint ledger, staff alerts and existing v428 function.
