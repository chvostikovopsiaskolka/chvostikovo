create table public.customer_dog_photos (
 dog_id bigint not null references public.dogs(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 photo_path text,
 updated_at timestamptz not null default now(),
 primary key(dog_id,user_id),
 constraint customer_dog_photos_path check(photo_path is null or photo_path like 'customers/'||user_id::text||'/%')
);
create index customer_dog_photos_user_idx on public.customer_dog_photos(user_id);
alter table public.customer_dog_photos enable row level security;
revoke all on public.customer_dog_photos from anon,authenticated;
grant select on public.customer_dog_photos to authenticated;
grant all on public.customer_dog_photos to service_role;
create policy active_staff_read_customer_dog_photos on public.customer_dog_photos for select to authenticated
 using(exists(select 1 from public.staff where user_id=(select auth.uid()) and active));
-- Customer operations go through the existing authenticated Edge API and ownership check.
create function private.customer_dog_photo_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.updated_at=now();
 insert into public.portal_live_events(recipient_user_id,scope,entity_id) values(new.user_id,'dog',new.dog_id);
 return new;
end $$;
revoke all on function private.customer_dog_photo_changed() from public,anon,authenticated;
create trigger customer_dog_photo_changed before insert or update on public.customer_dog_photos
 for each row execute function private.customer_dog_photo_changed();
alter publication supabase_realtime add table public.customer_dog_photos;
