alter table private.app_telemetry_config_v345 add column last_alert_at timestamptz;
create table private.app_telemetry_issues_v347(fingerprint text primary key,last_notified_at timestamptz not null);
alter table private.app_telemetry_issues_v347 enable row level security;
revoke all on private.app_telemetry_issues_v347 from public,anon,authenticated;
create policy telemetry_events_private_v347 on private.app_telemetry_v345 for all to public using(false) with check(false);
create policy telemetry_limits_private_v347 on private.app_telemetry_limits_v345 for all to public using(false) with check(false);
create policy telemetry_config_private_v347 on private.app_telemetry_config_v345 for all to public using(false) with check(false);
create policy telemetry_issues_private_v347 on private.app_telemetry_issues_v347 for all to public using(false) with check(false);

do $v347$ declare f text;begin
 f:=pg_get_functiondef('public.portal_telemetry_ingest_v345(jsonb)'::regprocedure);
 if position('''storage'',''javascript'',''customer-operation'',' in f)=0 then raise exception 'Telemetry operation guard changed';end if;
 execute replace(f,'''storage'',''javascript'',''customer-operation'',','''storage'',''javascript'',''customer-operation'',''app-startup'',');
end $v347$;

create function private.telemetry_alert_v347() returns trigger language plpgsql security definer set search_path='' as $$
declare last_alert timestamptz; issue_key text; occurrences integer;
begin
 -- Expected 4xx rejections stay in the report but never cause a staff alarm.
 if not ((new.category in ('javascript.error','promise.error')) or
 (new.category='request.error' and (new.http_status=0 or new.http_status>=500)) or
 (new.category='request.slow' and new.duration_ms>=30000)) then return new;end if;
 select last_alert_at into last_alert from private.app_telemetry_config_v345 where singleton and enabled;
 if not found or last_alert>now()-interval '1 hour' then return new;end if;
 select count(*) into occurrences from private.app_telemetry_v345 e where e.received_at>=now()-interval '15 minutes'
 and e.app=new.app and e.build=new.build and e.category=new.category and e.operation=new.operation
 and e.exception_type=new.exception_type and e.source_file=new.source_file and e.source_line=new.source_line and e.http_status=new.http_status;
 if occurrences<3 then return new;end if;
 issue_key:=md5(concat_ws('|',new.app,new.build,new.category,new.operation,new.exception_type,new.source_file,new.source_line,new.http_status));
 if exists(select 1 from private.app_telemetry_issues_v347 i where i.fingerprint=issue_key and i.last_notified_at>now()-interval '24 hours') then return new;end if;
 -- One global lock makes concurrent browsers/devices share the same hourly cap.
 select last_alert_at into last_alert from private.app_telemetry_config_v345 where singleton and enabled for update;
 if not found or last_alert>now()-interval '1 hour' then return new;end if;
 insert into private.app_telemetry_issues_v347 values(issue_key,now()) on conflict(fingerprint) do update set last_notified_at=excluded.last_notified_at;
 update private.app_telemetry_config_v345 set last_alert_at=now() where singleton;
 insert into public.portal_notifications(recipient_user_id,notification_type,title,body,entity_type,event_key)
 select s.user_id,'app_diagnostics_admin','Opakovaná chyba v appke',
 'Zachytili sme opakovaný technický problém. Pozrite Menu → Technický stav appiek.',
 'app_diagnostics','telemetry:'||issue_key||':'||extract(epoch from now())::bigint||':'||s.user_id::text
 from public.staff s where s.active=true;
 return new;
exception when others then
 -- Notification trouble must not discard the diagnostic event or affect the app.
 return new;
end $$;
revoke all on function private.telemetry_alert_v347() from public,anon,authenticated;
create trigger app_telemetry_alert_v347 after insert on private.app_telemetry_v345 for each row execute function private.telemetry_alert_v347();
select cron.alter_job((select jobid from cron.job where jobname='app-telemetry-retention-v345'),command:=
 'delete from private.app_telemetry_v345 where received_at<now()-interval ''30 days'';delete from private.app_telemetry_limits_v345 where expires_at<now();delete from private.app_telemetry_issues_v347 where last_notified_at<now()-interval ''30 days'';');
