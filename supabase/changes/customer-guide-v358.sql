-- Existing accounts keep false; profiles created after this migration default to true.
begin;
alter table public.customer_profiles add column intro_guide_eligible boolean not null default false;
alter table public.customer_profiles alter column intro_guide_eligible set default true;
alter table public.customer_profiles add column intro_guide_seen_at timestamptz;
alter table public.customer_profiles add column intro_guide_result text check(intro_guide_result in ('started','skipped','completed'));
grant update(intro_guide_seen_at,intro_guide_result) on public.customer_profiles to authenticated;

create function public.portal_record_guide_v358(p_result text) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or p_result is null or p_result not in ('started','skipped','completed') then
    raise exception 'Invalid guide request';
  end if;
  update public.customer_profiles
     set intro_guide_seen_at=coalesce(intro_guide_seen_at,now()),
         intro_guide_result=case when intro_guide_result='completed' then 'completed' else p_result end
   where user_id=auth.uid() and status='active';
  return found;
end;
$$;
revoke all on function public.portal_record_guide_v358(text) from public,anon;
grant execute on function public.portal_record_guide_v358(text) to authenticated;
commit;
