-- Use the existing supported event scope to refresh customer history.
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
 insert into public.portal_live_events(recipient_user_id,scope,entity_id) values(v_user,'all',p_conversation_id);
 return v_count;
end $$;
