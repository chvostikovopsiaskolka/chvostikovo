-- Chvostíkovo APP -> Google Calendar Supabase bridge
-- Backup: 14. 9. 2026
-- Secrets and the live Apps Script /exec URL are intentionally NOT stored here.
-- Restore those only into private.google_calendar_sync_config.

create schema if not exists private;
create extension if not exists pg_net;

create table if not exists private.google_calendar_sync_config (
  id boolean primary key default true,
  webhook_url text not null,
  sync_secret text not null,
  updated_at timestamptz not null default now(),
  constraint google_calendar_sync_config_singleton check (id = true)
);

create or replace function private.enqueue_google_calendar_reservation(
  p_reservation_id bigint,
  p_dog_id bigint,
  p_date date,
  p_entry_type text,
  p_entry_number integer,
  p_pass_total integer,
  p_pass_id bigint,
  p_action text
)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_cfg private.google_calendar_sync_config%rowtype;
  v_dog_name text;
  v_pass_total integer := p_pass_total;
  v_request_id bigint;
  v_body jsonb;
begin
  select * into v_cfg
  from private.google_calendar_sync_config
  where id = true;

  if v_cfg.id is null then
    return null;
  end if;

  select d.name into v_dog_name
  from public.dogs d
  where d.id = p_dog_id;

  if v_dog_name is null then
    return null;
  end if;

  if p_entry_type = 'pass' and v_pass_total is null and p_pass_id is not null then
    select p.total_entries into v_pass_total
    from public.passes p
    where p.id = p_pass_id;
  end if;

  v_body := jsonb_build_object(
    'secret', v_cfg.sync_secret,
    'action', p_action,
    'reservation_id', p_reservation_id::text,
    'dog_name', v_dog_name,
    'date', p_date::text,
    'entry_type', p_entry_type,
    'entry_number', p_entry_number,
    'pass_total', v_pass_total
  );

  select net.http_post(
    url := v_cfg.webhook_url,
    body := v_body,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$function$;

create or replace function private.sync_reservation_to_google_calendar()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
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

  if tg_op = 'UPDATE'
     and old.reservation_date is distinct from new.reservation_date
     and old.status = 'booked' then
    perform private.enqueue_google_calendar_reservation(
      old.id, old.dog_id, old.reservation_date, old.entry_type,
      old.planned_entry_number, old.planned_pass_total, old.pass_id, 'cancel'
    );
  end if;

  if tg_op = 'UPDATE'
     and new.status = 'cancelled'
     and old.status is distinct from 'cancelled' then
    perform private.enqueue_google_calendar_reservation(
      new.id, new.dog_id, new.reservation_date, new.entry_type,
      new.planned_entry_number, new.planned_pass_total, new.pass_id, 'cancel'
    );
    return new;
  end if;

  if new.status <> 'booked' then
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
$function$;

drop trigger if exists reservations_google_calendar_sync on public.reservations;

create trigger reservations_google_calendar_sync
after insert or delete or update of
  status,
  reservation_date,
  entry_type,
  dog_id,
  pass_id,
  planned_entry_number,
  planned_pass_total,
  source
on public.reservations
for each row
execute function private.sync_reservation_to_google_calendar();

-- Restore config manually after deployment. Never commit real values:
-- insert into private.google_calendar_sync_config (id, webhook_url, sync_secret)
-- values (true, 'https://script.google.com/macros/s/.../exec', 'SECRET_HERE')
-- on conflict (id) do update
-- set webhook_url = excluded.webhook_url,
--     sync_secret = excluded.sync_secret,
--     updated_at = now();
