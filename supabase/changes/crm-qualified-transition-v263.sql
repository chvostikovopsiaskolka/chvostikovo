-- Durable qualification survives removal of an intro visit when the dog becomes a client.
alter table public.web_form_submissions add column crm_qualified_at timestamptz;
create function private.record_web_qualification_v263() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.source_submission_id is not null then
  update public.web_form_submissions set crm_qualified_at=coalesce(crm_qualified_at,now()) where id=new.source_submission_id;
 end if;
 return null;
end $$;
revoke all on function private.record_web_qualification_v263() from public,anon,authenticated;
create trigger record_web_qualification_v263 after insert or update of source_submission_id on public.intro_visits for each row execute function private.record_web_qualification_v263();
update public.web_form_submissions s set crm_qualified_at=i.created_at
from (select source_submission_id,min(created_at) created_at from public.intro_visits where source_submission_id is not null group by source_submission_id) i
where s.id=i.source_submission_id and s.crm_qualified_at is null;
