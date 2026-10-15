const fs=require('fs'),defs=JSON.parse(fs.readFileSync('supabase/backups/link-before-v251.json'));let sql=`ALTER TABLE public.customer_owner_links ADD COLUMN allowed_dog_ids bigint[];
ALTER TABLE public.customer_owner_links ADD CONSTRAINT allowed_dogs_v251 CHECK(allowed_dog_ids IS NULL OR (cardinality(allowed_dog_ids) BETWEEN 1 AND 2 AND array_position(allowed_dog_ids,NULL) IS NULL));
ALTER TABLE public.customer_profiles ADD COLUMN registration_dog_names text[];
CREATE TABLE private.dog_link_audit_v251(user_id uuid NOT NULL,dog_id bigint NOT NULL,owner_id bigint NOT NULL,actor uuid NOT NULL,verification_note text NOT NULL,intro_confirmed boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,dog_id));
ALTER TABLE private.dog_link_audit_v251 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.dog_link_audit_v251 FROM PUBLIC,anon,authenticated;
`;
for(const f of defs){let s=f.definition;
if(f.name==='portal_link_existing_dog'){
s=s.replace('where user_id = p_user_id;', 'where user_id = p_user_id for update;');
s=s.replace("  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;",`  if v_dog_name is null then raise exception 'Psík sa nenašiel.'; end if;
 if current_setting('chvostikovo.verified_link_v251',true) IS DISTINCT FROM p_user_id::text||':'||p_dog_id::text then raise exception 'Použite overené priradenie s potvrdením úvodnej návštevy.'; end if;
 if v_owner_id is null or not exists(select 1 from public.dogs where id=p_dog_id and active) then raise exception 'Najprv overte existujúceho psa a jeho majiteľa.'; end if;
 if exists(select 1 from public.customer_owner_links where user_id=p_user_id and owner_id<>v_owner_id) then raise exception 'Účet má iného majiteľa. Overte evidenciu manuálne.'; end if;
 if exists(select 1 from public.customer_owner_links where user_id=p_user_id and owner_id=v_owner_id and allowed_dog_ids is not null and cardinality(allowed_dog_ids)>=2 and not p_dog_id=ANY(allowed_dog_ids)) then raise exception 'Účet už má dvoch psíkov.'; end if;`);
s=s.replace("select nullif(btrim(u.raw_user_meta_data->>'dog_name'), '')","select case when position(',' in coalesce(u.raw_user_meta_data->>'dog_name',''))=0 then nullif(btrim(u.raw_user_meta_data->>'dog_name'), '') else null end");
let old=`insert into public.customer_owner_links(user_id, owner_id, approved_by)\n  values (p_user_id, v_owner_id, v_staff)\n  on conflict (user_id, owner_id) do nothing;`;if(!s.includes(old))throw Error('link pattern');
s=s.replace(old,`insert into public.customer_owner_links(user_id,owner_id,approved_by,allowed_dog_ids) values(p_user_id,v_owner_id,v_staff,ARRAY[p_dog_id])
 on conflict(user_id,owner_id) do update set allowed_dog_ids=ARRAY(SELECT DISTINCT x FROM unnest(public.customer_owner_links.allowed_dog_ids||ARRAY[p_dog_id]) x ORDER BY x)
 WHERE public.customer_owner_links.allowed_dog_ids IS NOT NULL AND NOT p_dog_id=ANY(public.customer_owner_links.allowed_dog_ids);`);
}else if(f.name==='portal_approve_dog_submission'){
s=s.replace('  for v_vaccine in',`  update public.customer_owner_links set allowed_dog_ids=case when allowed_dog_ids is null then null else ARRAY(SELECT DISTINCT x FROM unnest(allowed_dog_ids||ARRAY[v_dog_id]) x) end where user_id=v_submission.user_id and owner_id=v_owner_id;
  for v_vaccine in`);
}else{let count=0;for(const [rx,l,d] of [[/(d\.owner_id\s*=\s*l\.owner_id|l\.owner_id\s*=\s*d\.owner_id)/gi,'l','d'],[/(link\.owner_id\s*=\s*d\.owner_id)/gi,'link','d'],[/(dog\.owner_id\s*=\s*link\.owner_id)/gi,'link','dog'],[/(links\.owner_id\s*=\s*dog\.owner_id)/gi,'links','dog']])s=s.replace(rx,m=>{count++;return m+` AND (${l}.allowed_dog_ids IS NULL OR ${d}.id=ANY(${l}.allowed_dog_ids))`});if(!count)throw Error('Unscoped '+f.name)}sql+=s+';\n';}
sql+=`CREATE FUNCTION public.portal_link_dog_verified_v251(p_user_id uuid,p_dog_id bigint,p_owner_id bigint,p_intro_confirmed boolean,p_ownership_note text) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=auth.uid() AND active) THEN RAISE EXCEPTION 'Prístup len pre personál.'; END IF;
 IF p_intro_confirmed IS DISTINCT FROM true OR length(btrim(coalesce(p_ownership_note,'')))<3 THEN RAISE EXCEPTION 'Potvrďte úvodnú návštevu a overenie vlastníctva.'; END IF;
 PERFORM 1 FROM public.customer_profiles WHERE user_id=p_user_id FOR UPDATE;
 PERFORM 1 FROM public.dogs WHERE id=p_dog_id AND owner_id=p_owner_id AND active FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Majiteľ psíka sa zmenil. Skontrolujte priradenie.'; END IF;
 PERFORM set_config('chvostikovo.verified_link_v251',p_user_id::text||':'||p_dog_id::text,true);
 result:=public.portal_link_existing_dog(p_user_id,p_dog_id);
 INSERT INTO private.dog_link_audit_v251(user_id,dog_id,owner_id,actor,verification_note,intro_confirmed) VALUES(p_user_id,p_dog_id,p_owner_id,auth.uid(),btrim(p_ownership_note),true) ON CONFLICT(user_id,dog_id) DO NOTHING;
 PERFORM set_config('chvostikovo.verified_link_v251','',true); RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_link_dog_verified_v251(uuid,bigint,bigint,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_link_dog_verified_v251(uuid,bigint,bigint,boolean,text) TO authenticated;
`;
const p=JSON.parse(fs.readFileSync('supabase/backups/link-policy-before-v251.json'))[0];sql+=`ALTER POLICY ${p.policyname} ON public.${p.tablename} WITH CHECK (${p.with_check.replace('(d.owner_id = l.owner_id)','(d.owner_id = l.owner_id AND (l.allowed_dog_ids IS NULL OR d.id=ANY(l.allowed_dog_ids)))')});\n`;
// Parse registration requests only. Never creates or assigns a dog.
sql+=`CREATE FUNCTION private.registration_names_v251() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE names text[]; raw text; BEGIN
 raw:=nullif(btrim(new.raw_user_meta_data->>'dog_name'),''); IF raw IS NULL THEN RETURN new; END IF;
 SELECT array_agg(regexp_replace(btrim(x),'[[:space:]]+',' ','g') ORDER BY ord) INTO names FROM unnest(string_to_array(raw,',')) WITH ORDINALITY t(x,ord);
 IF cardinality(names) NOT BETWEEN 1 AND 2 OR EXISTS(SELECT 1 FROM unnest(names) x WHERE length(x) NOT BETWEEN 1 AND 50 OR x ~ '[;|/[:cntrl:]]') OR (SELECT count(DISTINCT lower(x)) FROM unnest(names) x)<>cardinality(names) THEN RAISE EXCEPTION 'Zadajte jedno alebo dve odlišné mená psíkov, oddelené čiarkou.'; END IF;
 UPDATE public.customer_profiles SET registration_dog_names=names WHERE user_id=new.id; RETURN new;
END $$;
REVOKE ALL ON FUNCTION private.registration_names_v251() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER z_registration_names_v251 AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.registration_names_v251();
UPDATE public.customer_profiles p SET registration_dog_names=x.names FROM (
 SELECT u.id,array_agg(regexp_replace(btrim(n),'[[:space:]]+',' ','g') ORDER BY ord) names FROM auth.users u CROSS JOIN LATERAL unnest(string_to_array(u.raw_user_meta_data->>'dog_name',',')) WITH ORDINALITY t(n,ord) GROUP BY u.id
) x WHERE p.user_id=x.id AND p.status='pending' AND cardinality(x.names) BETWEEN 1 AND 2 AND NOT EXISTS(SELECT 1 FROM unnest(x.names) n WHERE length(n) NOT BETWEEN 1 AND 50 OR n ~ '[;|/[:cntrl:]]') AND (SELECT count(DISTINCT lower(n)) FROM unnest(x.names)n)=cardinality(x.names);
`;
fs.writeFileSync('supabase/migrations/20261015190455_verified_dog_links_v251.sql',sql);fs.writeFileSync('supabase/backups/link-functions-before-v251.sql',defs.map(x=>x.definition+';').join('\n'));
