-- Keep the per-account conversation identity stable; erase its content for both parties.
create or replace function private.clear_portal_chat(p_conversation_id bigint)
returns integer language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_count integer;
begin
 select customer_user_id into v_user from public.portal_conversations where id=p_conversation_id for update;
 if v_user is null then return 0; end if;
 delete from public.portal_messages where conversation_id=p_conversation_id;
 get diagnostics v_count=row_count;
 delete from public.portal_notifications where entity_type='conversation' and entity_id=p_conversation_id
   and notification_type in('customer_message_admin','staff_message_customer');
 insert into public.portal_live_events(recipient_user_id,scope,entity_id) values(v_user,'messages',p_conversation_id);
 return v_count;
end $$;
revoke all on function private.clear_portal_chat(bigint) from public,anon,authenticated;

create or replace function public.portal_delete_chat(p_conversation_id bigint)
returns integer language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=(select auth.uid()) and active)
   then raise exception 'Konverzáciu môže vymazať iba personál škôlky.'; end if;
 return private.clear_portal_chat(p_conversation_id);
end $$;
revoke all on function public.portal_delete_chat(bigint) from public,anon;
grant execute on function public.portal_delete_chat(bigint) to authenticated;

create or replace function private.purge_inactive_portal_chats()
returns integer language plpgsql security definer set search_path='' as $$
declare v_row record; v_total integer:=0;
begin
 for v_row in select c.id from public.portal_conversations c
   where c.last_message_at<=now()-interval '7 days'
   and exists(select 1 from public.portal_messages m where m.conversation_id=c.id)
   for update of c skip locked
 loop v_total:=v_total+private.clear_portal_chat(v_row.id); end loop;
 return v_total;
end $$;
revoke all on function private.purge_inactive_portal_chats() from public,anon,authenticated;
select cron.schedule('chvostikovo-chat-retention-7-days','17 * * * *','select private.purge_inactive_portal_chats();');
