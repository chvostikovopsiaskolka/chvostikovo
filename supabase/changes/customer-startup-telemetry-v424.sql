-- DRAFT / NOT APPLIED. Verify current LIVE function + constraint first.
-- Additive, same private table/endpoint/ACL/session guard, caps and retention.
-- Stop if LIVE has diverged. Never use this to change RLS or authorization.
begin;
do $startup$
declare
 f text:=pg_get_functiondef('public.portal_telemetry_ingest_v345(jsonb)'::regprocedure);
 old_categories text:='''javascript.error'',''promise.error'',''request.error'',''request.slow'',''operation.error''';
 new_categories text:='''javascript.error'',''promise.error'',''request.error'',''request.slow'',''operation.error'',''startup.complete'',''startup.failed'',''startup.interrupted''';
 guard text;
 vals text[];
begin
 select pg_get_constraintdef(oid) into guard from pg_constraint where conrelid='private.app_telemetry_v345'::regclass and conname='app_telemetry_v345_category_check';
 select array_agg(m[1] order by m[1]) into vals from regexp_matches(guard,'''([^'']+)''','g') m;
 if vals is distinct from array['javascript.error','operation.error','promise.error','request.error','request.slow']::text[] then raise exception 'LIVE telemetry category constraint differs; review required';end if;
 if position('cat not in ('||old_categories||')' in f)=0 or position('if op like ''rpc/%'' and exists' in f)=0 then raise exception 'LIVE collector differs; review required';end if;
 if position('auth.sessions' in f)=0 or position('count_spans>5' in f)=0 or position('<=5000' in f)=0 then raise exception 'Existing session/cap guards missing';end if;
 f:=replace(f,'cat not in ('||old_categories||')','cat not in ('||new_categories||')');
 f:=replace(f,'if op like ''rpc/%'' and exists',
 'if cat in (''startup.complete'',''startup.failed'',''startup.interrupted'') then
    if app_name<>''customer'' or op is null or op !~ ''^startup/(cold|reload|resume|refresh|recovery)/(total|api|data|photos)$'' then continue;end if;
  elsif op like ''rpc/%'' and exists');
 alter table private.app_telemetry_v345 drop constraint app_telemetry_v345_category_check;
 alter table private.app_telemetry_v345 add constraint app_telemetry_v345_category_check check(category in ('javascript.error','promise.error','request.error','request.slow','operation.error','startup.complete','startup.failed','startup.interrupted'));
 execute f;
end $startup$;
commit;
-- Rollback: disable/revert client startup emission; retain additive category support
-- and the collected private rows. Do not delete telemetry to restore a constraint.
