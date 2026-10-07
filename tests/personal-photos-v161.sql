begin;
do $$
declare v_dog bigint;v_owner bigint;v_user uuid;v_stamp timestamptz;
begin
 select d.id,d.owner_id,l.user_id into v_dog,v_owner,v_user from dogs d join customer_owner_links l on l.owner_id=d.owner_id where not exists(select 1 from staff where user_id=l.user_id and active) limit 1;
 if v_user is null then raise exception 'Customer fixture missing'; end if;
 insert into customer_dog_photos(dog_id,user_id,photo_path,updated_at) values(v_dog,v_user,'customers/'||v_user::text||'/'||v_dog||'/rollback.jpg','2000-01-01');
 select updated_at into v_stamp from customer_dog_photos where dog_id=v_dog and user_id=v_user;
 if v_stamp<>now() then raise exception 'Not server timestamp'; end if;
 if not exists(select 1 from portal_live_events where recipient_user_id=v_user and scope='dog' and entity_id=v_dog and created_at>=now()) then raise exception 'Refresh event missing'; end if;
 update customer_dog_photos set photo_path=null where dog_id=v_dog and user_id=v_user;
 if not exists(select 1 from customer_dog_photos where dog_id=v_dog and user_id=v_user and photo_path is null) then raise exception 'Explicit delete marker lost'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ begin if exists(select 1 from customer_dog_photos) then raise exception 'Customer sees private table'; end if; end $$;
rollback;
select 'PASS server timestamp, customer refresh, delete marker and customer RLS isolation; fixtures rolled back' result;
