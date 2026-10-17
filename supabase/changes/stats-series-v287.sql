create or replace function public.admin_visit_days_v287(p_month date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; last_day date:=least((date_trunc('month',p_month)+interval '1 month - 1 day')::date,(now() at time zone 'Europe/Bratislava')::date);
begin
 if not exists(select 1 from public.staff where user_id=auth.uid() and active) then raise exception 'Prístup len pre personál.' using errcode='42501';end if;
 if p_month is null then raise exception 'Vyberte mesiac.';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by day),'[]') into result from (
 with actual as(select v.visit_date as day,count(distinct v.dog_id)::int as visits from public.visits v left join public.reservations r on r.id=v.reservation_id left join public.passes p on p.id=v.pass_id
 where v.visit_date>=date_trunc('month',p_month)::date and v.visit_date<=last_day
 and coalesce(r.source,'') not ilike '%test%' and coalesce(p.source,'') not ilike '%test%'
 and (r.id is null or r.status='attended') group by v.visit_date),
 known as(select day from public.daily_financials where day>='2026-08-24' and day>=date_trunc('month',p_month)::date and day<=last_day and coalesce(source,'') not ilike '%test%')
 select coalesce(a.day,k.day) as day,coalesce(a.visits,0) visits from actual a full join known k using(day)
 )x;
 return jsonb_build_object('days',result,'detail_from','2026-08-24');
end $$;
revoke all on function public.admin_visit_days_v287(date) from public,anon;
grant execute on function public.admin_visit_days_v287(date) to authenticated;
