-- Applied as native_push_devices_v393 on 28 October 2026. Existing web push unchanged.
begin;
create table public.portal_native_push_devices (
  token text primary key check (length(token) between 20 and 4096),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android' check (platform = 'android'),
  updated_at timestamptz not null default now()
);
create index portal_native_push_devices_user on public.portal_native_push_devices(user_id);
alter table public.portal_native_push_devices enable row level security;
revoke all on public.portal_native_push_devices from public, anon, authenticated;
grant select, insert, update, delete on public.portal_native_push_devices to service_role;
comment on table public.portal_native_push_devices is 'FCM tokens; service-only, owner identity verified by the native-push Edge endpoint';
commit;
