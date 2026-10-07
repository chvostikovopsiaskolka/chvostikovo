-- Entire integration fixture rolls back, including notification/webhook queue entries.
begin;
do $$
declare v_old bigint;v_recent bigint;v_user uuid;v_staff uuid;v_denied boolean;v_count integer;
begin
 select id,customer_user_id into v_old,v_user from public.portal_conversations order by last_message_at limit 1;
 select id into v_recent from public.portal_conversations where id<>v_old order by last_message_at desc limit 1;
 select user_id into v_staff from public.staff where active limit 1;
 if v_old is null or v_recent is null or v_staff is null then raise exception 'Integration fixtures unavailable'; end if;
 insert into public.portal_messages(conversation_id,sender_user_id,sender_role,body)
 values(v_old,v_user,'customer','Rollback retention fixture');
 insert into public.portal_messages(conversation_id,sender_user_id,sender_role,body)
 select v_recent,customer_user_id,'customer','Rollback active fixture' from public.portal_conversations where id=v_recent;
 update public.portal_conversations set last_message_at=now()-interval '8 days' where id=v_old;
 update public.portal_conversations set last_message_at=now()-interval '6 days' where id=v_recent;
 update public.portal_messages set read_at=now() where conversation_id=v_old;
 perform private.purge_inactive_portal_chats();
 if exists(select 1 from public.portal_messages where conversation_id=v_old) then raise exception 'Inactive history not purged'; end if;
 if not exists(select 1 from public.portal_messages where conversation_id=v_recent) then raise exception 'Active history purged'; end if;
 if exists(select 1 from public.portal_notifications where entity_type='conversation' and entity_id=v_old and notification_type in('customer_message_admin','staff_message_customer')) then raise exception 'Notification copies retained'; end if;
 if not exists(select 1 from public.portal_live_events where recipient_user_id=v_user and scope='all' and entity_id=v_old) then raise exception 'Customer deletion event missing'; end if;
 if not exists(select 1 from public.portal_conversations where id=v_old) then raise exception 'Stable identity lost'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
 v_denied:=false;begin perform public.portal_delete_chat(v_recent);exception when others then v_denied:=true;end;
 if not v_denied then raise exception 'Customer can delete staff chat'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_staff,'role','authenticated')::text,true);
 v_count:=public.portal_delete_chat(v_recent);
 if v_count<1 or exists(select 1 from public.portal_messages where conversation_id=v_recent) then raise exception 'Staff delete failed'; end if;
 if public.portal_delete_chat(v_recent)<>0 then raise exception 'Repeat delete not harmless'; end if;
 insert into public.portal_messages(conversation_id,sender_user_id,sender_role,body)
 values(v_old,v_user,'customer','New conversation after deletion');
 if not exists(select 1 from public.portal_messages where conversation_id=v_old) then raise exception 'Cannot restart chat'; end if;
 if exists(select 1 from public.portal_conversations where id=v_old and last_message_at<now()-interval '1 minute') then raise exception 'New message does not reset inactivity'; end if;
end $$;
rollback;
select 'PASS: 7-day inactivity, recent/read/new message timing, staff-only clear, both-side history + notification erasure, customer refresh event, stable restart; rollback complete' as result;
