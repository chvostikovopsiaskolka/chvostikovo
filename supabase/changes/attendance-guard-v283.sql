create table if not exists private.attendance_alerts_v283 (
 issue_key text primary key, title text not null, detail text not null,
 day date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), resolved_at timestamptz
);
alter table private.attendance_alerts_v283 enable row level security;
revoke all on private.attendance_alerts_v283 from public,anon,authenticated;

create or replace function private.attendance_issues_v283() returns table(issue_key text,title text,detail text,day date)
language sql stable set search_path='' as $fn$
with due as (select (now() at time zone 'Europe/Bratislava')::date today,(now() at time zone 'Europe/Bratislava')::time tm),
missing as (
 select r.reservation_date d,string_agg(d.name,', ' order by d.name) names,count(*) n
 from public.reservations r join public.dogs d on d.id=r.dog_id cross join due
 left join public.visits v on v.reservation_id=r.id
 where r.status in('booked','attended') and coalesce(r.source,'') not ilike '%test%' and v.id is null and r.reservation_date>='2026-08-25'
 and (r.reservation_date<due.today or r.reservation_date=due.today and due.tm>=time '10:15')
 group by r.reservation_date
), mismatched as (
 select r.reservation_date d,string_agg(d.name,', ' order by d.name) names
 from public.reservations r join public.visits v on v.reservation_id=r.id join public.dogs d on d.id=r.dog_id
 where r.status='attended' and (r.pass_id is distinct from v.pass_id or r.planned_entry_number is distinct from v.pass_entry_number or r.entry_type is distinct from v.entry_type)
 group by r.reservation_date
), duplicates as (
 select v.pass_id,v.pass_entry_number,string_agg(distinct d.name,', ') names,min(v.visit_date) d
 from public.visits v join public.dogs d on d.id=v.dog_id
 where v.pass_id is not null and v.pass_entry_number is not null group by v.pass_id,v.pass_entry_number having count(*)>1
), counters as (
 select p.id,d.name,p.used_entries,max(v.pass_entry_number) last_number,min(v.visit_date) d
 from public.passes p join public.dogs d on d.id=p.dog_id join public.visits v on v.pass_id=p.id
 where coalesce(p.source,'') not ilike '%test%' group by p.id,d.name having p.used_entries<>max(v.pass_entry_number)
)
select 'integrity:missing:'||d,'Chýba zapísaná dochádzka',n||' psíkov: '||names,d from missing
union all select 'integrity:numbers:'||d,'Nesúlad čísiel návštev',names,d from mismatched
union all select 'integrity:duplicate:'||pass_id||':'||pass_entry_number,'Opakovaný vstup permanentky',names||' · vstup '||pass_entry_number,d from duplicates
union all select 'integrity:counter:'||id,'Nesúlad permanentky s návštevami',name||' · permanentka '||used_entries||', posledná návšteva '||last_number,d from counters;
$fn$;
revoke all on function private.attendance_issues_v283() from public,anon,authenticated;

create or replace function private.attendance_watchdog_v283() returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare n integer;
begin
 insert into private.attendance_alerts_v283(issue_key,title,detail,day)
 select * from private.attendance_issues_v283()
 on conflict(issue_key) do update set title=excluded.title,detail=excluded.detail,day=excluded.day,updated_at=now(),resolved_at=null;
 update private.attendance_alerts_v283 a set resolved_at=now(),updated_at=now()
 where a.issue_key like 'integrity:%' and a.resolved_at is null and not exists(select 1 from private.attendance_issues_v283() i where i.issue_key=a.issue_key);
 select count(*) into n from private.attendance_alerts_v283 where resolved_at is null;
 return jsonb_build_object('open_issues',n,'checked_at',now());
end $fn$;
revoke all on function private.attendance_watchdog_v283() from public,anon,authenticated;

create or replace function private.finalize_day_guarded_v283(p_day date) returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare result jsonb; err text;
begin
 begin
  result:=private.finalize_day(p_day);
 exception when others then
  get stacked diagnostics err=message_text;
  insert into private.attendance_alerts_v283(issue_key,title,detail,day)
  values('close_error:'||p_day,'Uzávierka dochádzky zlyhala','Dochádzka sa neuložila. Skontrolujte deň '||to_char(p_day,'DD.MM.YYYY')||'.',p_day)
  on conflict(issue_key) do update set updated_at=now(),resolved_at=null;
  -- Store diagnostic privately, never expose SQL/customer row details in the UI.
  insert into private.shared_audit_v244(entity,entity_id,new_value) values('attendance_close_failure_v283',p_day::text,jsonb_build_object('error',err));
  return jsonb_build_object('ok',false,'date',p_day,'reason','attendance_close_failed');
 end;
 update private.attendance_alerts_v283 set resolved_at=now(),updated_at=now() where issue_key='close_error:'||p_day and resolved_at is null;
 perform private.attendance_watchdog_v283();
 return jsonb_build_object('ok',true,'result',result);
end $fn$;
revoke all on function private.finalize_day_guarded_v283(date) from public,anon,authenticated;

create or replace function public.admin_attendance_health_v283() returns jsonb
language plpgsql security definer set search_path='' as $fn$
declare issues jsonb;
begin
 if not exists(select 1 from public.staff where user_id=(select auth.uid()) and active) then raise exception 'Prístup len pre personál.' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.day desc),'[]'::jsonb) into issues from (
 select * from private.attendance_issues_v283()
 union all select issue_key,title,detail,day from private.attendance_alerts_v283 where issue_key like 'close_error:%' and resolved_at is null
 )x;
 return jsonb_build_object('ok',jsonb_array_length(issues)=0,'issues',issues,'checked_at',now());
end $fn$;
revoke all on function public.admin_attendance_health_v283() from public,anon;
grant execute on function public.admin_attendance_health_v283() to authenticated;

CREATE OR REPLACE FUNCTION private.sync_reservation_to_google_calendar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'DELETE' then
    if coalesce(old.source, '') <> 'google_calendar' then
      perform private.enqueue_google_calendar_reservation(
        old.id, old.dog_id, old.reservation_date, old.entry_type,
        old.planned_entry_number, old.planned_pass_total, old.pass_id, 'cancel'
      );
    end if;
    return old;
  end if;

  if coalesce(new.source, '') = 'google_calendar' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.reservation_date is distinct from new.reservation_date
     and old.status = 'booked' then
    perform private.enqueue_google_calendar_reservation(
      old.id, old.dog_id, old.reservation_date, old.entry_type,
      old.planned_entry_number, old.planned_pass_total, old.pass_id, 'cancel'
    );
  end if;

  if tg_op = 'UPDATE' and new.status = 'cancelled'
     and old.status is distinct from 'cancelled' then
    perform private.enqueue_google_calendar_reservation(
      new.id, new.dog_id, new.reservation_date, new.entry_type,
      new.planned_entry_number, new.planned_pass_total, new.pass_id, 'cancel'
    );
    return new;
  end if;

  if new.status not in ('booked','attended') then
    return new;
  end if;

  -- Dynamic pass planning can briefly leave X/Y empty during an insert/update.
  -- Wait for the final planning update so Google receives the correct title.
  if new.entry_type = 'pass'
     and (new.planned_entry_number is null or new.planned_pass_total is null) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform private.enqueue_google_calendar_reservation(
      new.id, new.dog_id, new.reservation_date, new.entry_type,
      new.planned_entry_number, new.planned_pass_total, new.pass_id, 'upsert'
    );
    return new;
  end if;

  if old.status is distinct from new.status
     or old.dog_id is distinct from new.dog_id
     or old.reservation_date is distinct from new.reservation_date
     or old.entry_type is distinct from new.entry_type
     or old.planned_entry_number is distinct from new.planned_entry_number
     or old.planned_pass_total is distinct from new.planned_pass_total
     or old.pass_id is distinct from new.pass_id then
    perform private.enqueue_google_calendar_reservation(
      new.id, new.dog_id, new.reservation_date, new.entry_type,
      new.planned_entry_number, new.planned_pass_total, new.pass_id, 'upsert'
    );
  end if;

  return new;
end;
$function$
