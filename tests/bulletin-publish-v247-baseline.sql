CREATE OR REPLACE FUNCTION public.publish_bulletin_draft_v241(p_draft_id uuid, p_public_image_path text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_draft public.portal_bulletin_drafts%ROWTYPE;
        v_actor uuid := auth.uid();
        v_published_id bigint;
        v_start timestamptz;
        v_finish timestamptz;
BEGIN
 IF v_actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.staff WHERE user_id=v_actor AND active=true) THEN
    RAISE EXCEPTION 'Oznam môže zverejniť iba prihlásený administrátor.' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_draft FROM public.portal_bulletin_drafts WHERE id=p_draft_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Koncept neexistuje.'; END IF;
 IF length(btrim(v_draft.title))<1 OR length(btrim(v_draft.body))<1 OR length(v_draft.body)>2000 THEN
   RAISE EXCEPTION 'Nadpis aj text sú povinné; text môže mať najviac 2000 znakov.';
 END IF;
 IF v_draft.display_from IS NOT NULL AND v_draft.display_until IS NOT NULL AND v_draft.display_from>v_draft.display_until THEN
   RAISE EXCEPTION 'Koniec zobrazenia je pred začiatkom.';
 END IF;
 IF p_public_image_path IS NOT NULL THEN
   IF p_public_image_path !~ ('^'||p_draft_id::text||'/[a-zA-Z0-9_.-]{1,160}$')
      OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='chvostikovo-bulletin-public' AND name=p_public_image_path) THEN
      RAISE EXCEPTION 'Obrázok nie je v publikovanom úložisku.';
   END IF;
 END IF;
 v_start := COALESCE((v_draft.display_from::timestamp AT TIME ZONE 'Europe/Bratislava'),now());
 v_finish := CASE WHEN v_draft.display_until IS NULL THEN NULL ELSE
   ((v_draft.display_until+1)::timestamp AT TIME ZONE 'Europe/Bratislava') END;
 IF v_finish IS NOT NULL AND v_finish<=v_start THEN RAISE EXCEPTION 'Neplatný rozsah zobrazenia.'; END IF;
 INSERT INTO public.portal_announcements
    (title,body,active,valid_from,valid_until,created_by,paper_style,image_path,
     cta_enabled,cta_title,cta_body,cta_button_label,cta_url,source_draft_id)
 VALUES (v_draft.title,v_draft.body,true,v_start,v_finish,v_actor,v_draft.paper_style,p_public_image_path,
         v_draft.cta_enabled,v_draft.cta_title,v_draft.cta_body,v_draft.cta_button_label,v_draft.cta_url,v_draft.id)
 ON CONFLICT (source_draft_id) DO UPDATE
   SET title=EXCLUDED.title,body=EXCLUDED.body,active=true,valid_from=EXCLUDED.valid_from,
       valid_until=EXCLUDED.valid_until,paper_style=EXCLUDED.paper_style,image_path=EXCLUDED.image_path,
       cta_enabled=EXCLUDED.cta_enabled,cta_title=EXCLUDED.cta_title,cta_body=EXCLUDED.cta_body,
       cta_button_label=EXCLUDED.cta_button_label,cta_url=EXCLUDED.cta_url,updated_at=now()
 RETURNING id INTO v_published_id;
 UPDATE public.portal_bulletin_drafts SET status='archived',updated_by=v_actor,updated_at=now() WHERE id=p_draft_id;
 RETURN v_published_id;
END $function$

