create or replace function private.customer_owner_link_live_event()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
  else
    v_user_id := new.user_id;
  end if;

  if v_user_id is not null then
    insert into public.portal_live_events(recipient_user_id, scope, entity_id)
    values (v_user_id, 'all', null);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;
