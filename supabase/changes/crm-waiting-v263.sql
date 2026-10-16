-- Additive staff CRM workflow; no synthetic Meta event is emitted by this migration.
alter table public.web_form_submissions add column waiting_for_application boolean not null default false;
alter table public.web_form_submissions add column crm_lead_id bigint references public.web_form_submissions(id) on delete set null;
alter table public.web_form_submissions add constraint web_crm_shape_v263 check ((not waiting_for_application or form_type='lead') and (crm_lead_id is null or (form_type='application' and crm_lead_id<>id)));
create index web_crm_lead_v263 on public.web_form_submissions(crm_lead_id) where crm_lead_id is not null;
create table private.web_crm_audit_v263(id bigint generated always as identity primary key,actor uuid,action text not null,lead_id bigint,application_id bigint,before_value jsonb,after_value jsonb,created_at timestamptz not null default now());
alter table private.web_crm_audit_v263 enable row level security;
revoke all on private.web_crm_audit_v263 from public,anon,authenticated;

create function private.crm_phone_v263(p text) returns text language sql immutable set search_path='' as $$
 select case when d like '00421%' then substr(d,3) when length(d)=10 and d like '0%' then '421'||substr(d,2) when length(d)=9 then '421'||d else d end from (select regexp_replace(coalesce(p,''),'[^0-9]','','g') d) x
$$;
revoke all on function private.crm_phone_v263(text) from public,anon,authenticated;
create index web_crm_phone_v263 on public.web_form_submissions(private.crm_phone_v263(phone));

create function private.find_web_lead_v263(p_phone text,p_email text,p_name text,p_created timestamptz,p_test boolean) returns bigint language sql stable set search_path='' as $$
 with candidates as (
  select s.id,s.created_at,lower(btrim(nullif(s.email,''))) email
  from public.web_form_submissions s
  where s.form_type='lead' and s.status<>'archived' and s.created_at<=p_created
   and coalesce(s.raw_payload->>'is_test','false')='false' and not p_test
   and length(private.crm_phone_v263(p_phone))>=10 and private.crm_phone_v263(s.phone)=private.crm_phone_v263(p_phone)
   and case when nullif(btrim(s.email),'') is not null and nullif(btrim(p_email),'') is not null
       then lower(btrim(s.email))=lower(btrim(p_email))
       else nullif(btrim(p_name),'') is not null and lower(btrim(s.owner_name))=lower(btrim(p_name)) end
 ) select id from candidates where (select count(distinct email) from candidates)<=1 order by created_at,id limit 1
$$;
revoke all on function private.find_web_lead_v263(text,text,text,timestamptz,boolean) from public,anon,authenticated;

create function private.guard_web_crm_v263() returns trigger language plpgsql security definer set search_path='' as $$
declare parent public.web_form_submissions%rowtype;
begin
 if new.form_type='application' and new.crm_lead_id is null and tg_op='INSERT' then
  new.crm_lead_id:=private.find_web_lead_v263(new.phone,new.email,new.owner_name,coalesce(new.created_at,now()),coalesce(new.raw_payload->>'is_test','false')='true');
 end if;
 if new.crm_lead_id is not null then
  select * into parent from public.web_form_submissions where id=new.crm_lead_id;
  if not found or parent.form_type<>'lead' or new.form_type<>'application' or new.id=new.crm_lead_id or coalesce(parent.raw_payload->>'is_test','false')<>coalesce(new.raw_payload->>'is_test','false') then
   raise exception 'Prihlášku možno prepojiť iba so zodpovedajúcim záujmom.';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_web_crm_v263() from public,anon,authenticated;
create trigger guard_web_crm_v263 before insert or update of crm_lead_id,form_type on public.web_form_submissions for each row execute function private.guard_web_crm_v263();

create function private.sync_web_crm_v263() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.form_type='application' and new.crm_lead_id is not null and (tg_op='INSERT' or new.crm_lead_id is distinct from old.crm_lead_id) then
  update public.web_form_submissions set waiting_for_application=false,status=case when status='new' then 'reviewed' else status end where id=new.crm_lead_id;
  insert into private.web_crm_audit_v263(actor,action,lead_id,application_id,before_value,after_value) values(auth.uid(),case when tg_op='INSERT' then 'application_received' else 'application_linked' end,new.crm_lead_id,new.id,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new));
 end if;
 return null;
end $$;
revoke all on function private.sync_web_crm_v263() from public,anon,authenticated;
create trigger sync_web_crm_v263 after insert or update of crm_lead_id on public.web_form_submissions for each row execute function private.sync_web_crm_v263();

create function public.set_web_lead_waiting_v263(p_lead_id bigint,p_waiting boolean) returns public.web_form_submissions language plpgsql security definer set search_path='' as $$
declare before_row public.web_form_submissions%rowtype; after_row public.web_form_submissions%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=auth.uid() and active) then raise exception 'Úkon je dostupný iba personálu.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(20261016,263);
 select * into before_row from public.web_form_submissions where id=p_lead_id and form_type='lead' and status<>'archived' for update;
 if not found or p_waiting is null then raise exception 'Záujem nie je dostupný.';end if;
 if p_waiting and exists(select 1 from public.web_form_submissions where crm_lead_id=p_lead_id and status<>'archived') then raise exception 'Prihláška už bola prijatá.';end if;
 update public.web_form_submissions set waiting_for_application=p_waiting,status=case when status='new' then 'reviewed' else status end where id=p_lead_id returning * into after_row;
 if to_jsonb(before_row) is distinct from to_jsonb(after_row) then insert into private.web_crm_audit_v263(actor,action,lead_id,before_value,after_value) values(auth.uid(),'waiting_changed',p_lead_id,to_jsonb(before_row),to_jsonb(after_row));end if;
 return after_row;
end $$;
revoke all on function public.set_web_lead_waiting_v263(bigint,boolean) from public,anon;
grant execute on function public.set_web_lead_waiting_v263(bigint,boolean) to authenticated;

create function public.link_web_application_v263(p_lead_id bigint,p_application_id bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare l public.web_form_submissions%rowtype; a public.web_form_submissions%rowtype;
begin
 if auth.uid() is null or not exists(select 1 from public.staff where user_id=auth.uid() and active) then raise exception 'Úkon je dostupný iba personálu.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(20261016,263);
 perform id from public.web_form_submissions where id in(p_lead_id,p_application_id) order by id for update;
 select * into l from public.web_form_submissions where id=p_lead_id and form_type='lead' and status<>'archived';
 if not found then raise exception 'Záujem nie je dostupný.';end if;
 select * into a from public.web_form_submissions where id=p_application_id and form_type='application' and status<>'archived';
 if not found then raise exception 'Prihláška nie je dostupná.';end if;
 if a.crm_lead_id is not null and a.crm_lead_id<>l.id then raise exception 'Prihláška už patrí k inému záujmu.';end if;
 if not ((length(private.crm_phone_v263(l.phone))>=10 and private.crm_phone_v263(l.phone)=private.crm_phone_v263(a.phone)) or (nullif(btrim(l.email),'') is not null and lower(btrim(l.email))=lower(btrim(a.email)))) then raise exception 'Overte telefón alebo e-mail oboch formulárov.';end if;
 update public.web_form_submissions set crm_lead_id=l.id where id=a.id returning * into a;
 select * into l from public.web_form_submissions where id=l.id;
 return jsonb_build_object('lead',to_jsonb(l),'application',to_jsonb(a));
end $$;
revoke all on function public.link_web_application_v263(bigint,bigint) from public,anon;
grant execute on function public.link_web_application_v263(bigint,bigint) to authenticated;

-- Only unambiguous identity matches. Historical differently-spelled names stay for staff review.
update public.web_form_submissions a set crm_lead_id=private.find_web_lead_v263(a.phone,a.email,a.owner_name,a.created_at,coalesce(a.raw_payload->>'is_test','false')='true')
where a.form_type='application' and a.crm_lead_id is null and a.status<>'archived'
 and private.find_web_lead_v263(a.phone,a.email,a.owner_name,a.created_at,coalesce(a.raw_payload->>'is_test','false')='true') is not null;
