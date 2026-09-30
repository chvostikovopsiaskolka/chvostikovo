ALTER TABLE public.portal_terms_acceptances
 ADD COLUMN document_id bigint REFERENCES public.portal_terms_documents(id),
 ADD COLUMN user_name_snapshot text,
 ADD COLUMN user_email_snapshot text,
 ADD COLUMN dog_name_snapshot text;

CREATE OR REPLACE FUNCTION private.protect_portal_terms_history() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $f$
BEGIN
 IF TG_TABLE_NAME='portal_terms_acceptances' THEN
  RAISE EXCEPTION 'Potvrdenia podmienok sú nemenné.';
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Historické podmienky nemožno zmazať.'; END IF;
 IF (NEW.id,NEW.version,NEW.title,NEW.body,NEW.document_hash,NEW.effective_from,NEW.created_at,NEW.created_by)
 IS DISTINCT FROM (OLD.id,OLD.version,OLD.title,OLD.body,OLD.document_hash,OLD.effective_from,OLD.created_at,OLD.created_by) THEN
  RAISE EXCEPTION 'Vytvorte novú verziu podmienok; historické znenie je nemenné.';
 END IF;
 RETURN NEW;
END;
$f$;
REVOKE ALL ON FUNCTION private.protect_portal_terms_history() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER portal_terms_documents_immutable BEFORE UPDATE OR DELETE ON public.portal_terms_documents FOR EACH ROW EXECUTE FUNCTION private.protect_portal_terms_history();
CREATE TRIGGER portal_terms_acceptances_immutable BEFORE UPDATE OR DELETE ON public.portal_terms_acceptances FOR EACH ROW EXECUTE FUNCTION private.protect_portal_terms_history();
REVOKE INSERT,UPDATE,DELETE ON public.portal_terms_acceptances FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.portal_accept_school_terms_verified(p_dog_id bigint,p_terms_version text,p_document_hash text,p_acceptance_text text)
RETURNS public.portal_terms_acceptances LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE
 v_uid uuid:=auth.uid();v_doc public.portal_terms_documents%rowtype;v_row public.portal_terms_acceptances%rowtype;
 v_name text;v_email text;v_dog text;
 v_text constant text:='Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.';
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 IF p_acceptance_text IS DISTINCT FROM v_text THEN RAISE EXCEPTION 'Podmienky musíte vedome prijať.'; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version;
 IF v_doc.id IS NULL OR v_doc.document_hash IS DISTINCT FROM p_document_hash THEN RAISE EXCEPTION 'Verzia dokumentu sa zmenila. Otvorte podmienky znova.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 IF NOT v_doc.active OR v_doc.effective_from>now() OR v_doc.id IS DISTINCT FROM
 (SELECT id FROM public.portal_terms_documents WHERE active AND effective_from<=now() ORDER BY effective_from DESC,id DESC LIMIT 1) THEN
 RAISE EXCEPTION 'Prijmite aktuálnu verziu podmienok.'; END IF;
 SELECT d.name INTO v_dog FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 SELECT p.full_name,u.email INTO v_name,v_email FROM auth.users u LEFT JOIN public.customer_profiles p ON p.user_id=u.id WHERE u.id=v_uid;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash,document_id,acceptance_text,accepted_at,user_name_snapshot,user_email_snapshot,dog_name_snapshot)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash,v_doc.id,v_text,clock_timestamp(),v_name,v_email,v_dog)
 ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$f$;
REVOKE ALL ON FUNCTION public.portal_accept_school_terms_verified(bigint,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_accept_school_terms_verified(bigint,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.portal_accept_school_terms(p_dog_id bigint,p_terms_version text)
RETURNS public.portal_terms_acceptances LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_uid uuid:=auth.uid();v_row public.portal_terms_acceptances%rowtype;v_doc public.portal_terms_documents%rowtype;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version;
 IF v_row.id IS NOT NULL THEN RETURN v_row; END IF;
 SELECT * INTO v_doc FROM public.portal_terms_documents WHERE version=p_terms_version AND active AND effective_from<=now();
 IF v_doc.id IS NULL THEN RAISE EXCEPTION 'Aktuálne podmienky sa nenašli.'; END IF;
 IF p_terms_version>='2026-09-30' THEN RAISE EXCEPTION 'Aktualizujte aplikáciu a vedome prijmite novú verziu podmienok.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.customer_owner_links l JOIN public.dogs d ON d.owner_id=l.owner_id WHERE l.user_id=v_uid AND d.id=p_dog_id AND d.active) THEN RAISE EXCEPTION 'Tento psík nie je priradený k vášmu účtu.'; END IF;
 INSERT INTO public.portal_terms_acceptances(user_id,dog_id,terms_version,document_hash)
 VALUES(v_uid,p_dog_id,v_doc.version,v_doc.document_hash) ON CONFLICT(user_id,dog_id,terms_version) DO NOTHING RETURNING * INTO v_row;
 IF v_row.id IS NULL THEN SELECT * INTO v_row FROM public.portal_terms_acceptances WHERE user_id=v_uid AND dog_id=p_dog_id AND terms_version=p_terms_version; END IF;
 RETURN v_row;
END;
$f$;
REVOKE ALL ON FUNCTION public.portal_accept_school_terms(bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_accept_school_terms(bigint,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.portal_terms_acceptance_history(p_dog_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $f$
DECLARE v_uid uuid:=auth.uid();v_rows jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Najprv sa prihláste.'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('terms_version',a.terms_version,'document_hash',a.document_hash,'accepted_at',a.accepted_at,'acceptance_text',a.acceptance_text,'title',t.title,'body',t.body,'dog_name',coalesce(a.dog_name_snapshot,d.name),'owner_name',a.user_name_snapshot) ORDER BY a.accepted_at DESC),'[]'::jsonb)
 INTO v_rows FROM public.portal_terms_acceptances a JOIN public.portal_terms_documents t ON t.version=a.terms_version AND t.document_hash=a.document_hash
 LEFT JOIN public.dogs d ON d.id=a.dog_id WHERE a.user_id=v_uid AND a.dog_id=p_dog_id;
 RETURN v_rows;
END;
$f$;
REVOKE ALL ON FUNCTION public.portal_terms_acceptance_history(bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.portal_terms_acceptance_history(bigint) TO authenticated;

INSERT INTO public.portal_terms_documents(version,title,body,document_hash,active,effective_from) VALUES('2026-09-30','Podmienky psej škôlky Chvostíkovo','1. Zdravotný stav psa

Psík musí byť v dobrom zdravotnom stave a schopný bezpečne sa zúčastňovať kolektívnych aktivít. Majiteľ je povinný pravdivo a včas informovať Chvostíkovo o zdravotnom stave psa, jeho ochoreniach, alergiách, obmedzeniach, užívaných liekoch alebo iných skutočnostiach, ktoré môžu ovplyvniť jeho pobyt v škôlke alebo bezpečnosť ostatných psov. Fenky počas hárania do škôlky neprijímame. Ak sa pred pobytom alebo počas neho prejavia zdravotné ťažkosti, príznaky infekčného ochorenia alebo iný stav, pri ktorom nie je vhodné pokračovať v kolektívnom pobyte, Chvostíkovo môže podľa okolností pobyt psa upraviť alebo v daný deň ukončiť a kontaktovať majiteľa.

2. Pobyt v kolektíve a zodpovednosť

Majiteľ berie na vedomie, že psia škôlka je kolektívne prostredie, v ktorom dochádza k prirodzenej interakcii medzi psami, spoločnej hre, pohybu a vzájomnému kontaktu. Chvostíkovo zabezpečuje počas pobytu psov primeraný dohľad a prijíma opatrenia na predchádzanie konfliktom a minimalizovanie rizika zranenia.

Aj pri riadnom dohľade však môže dôjsť k náhlej a nepredvídateľnej reakcii psa, konfliktu medzi psami, škrabnutiu, odrenine, pohryzeniu alebo inému zraneniu, ktorému nebolo možné vzhľadom na okolnosti primerane predísť.

Prevádzkovateľ psej škôlky Chvostíkovo nenesie zodpovednosť za zranenie alebo škodu, ktorá vznikne v dôsledku bežnej a nepredvídateľnej interakcie psov v kolektíve, pokiaľ bol zo strany dohliadajúceho personálu zabezpečený primeraný dohľad a dodržané bezpečnostné postupy.

Toto ustanovenie sa nevzťahuje na prípady, keď by k udalosti došlo v dôsledku zanedbania primeraného dohľadu, porušenia bezpečnostných povinností alebo iného pochybenia prevádzkovateľa alebo dohliadajúceho personálu.

Majiteľ je povinný pravdivo informovať Chvostíkovo o známych prejavoch agresie, konfliktnom správaní, strážení zdrojov alebo iných okolnostiach, ktoré môžu mať vplyv na bezpečnosť psa, ostatných psov alebo personálu.

3. Hygiena

Psík by mal mať základné hygienické návyky v interiéri. Majiteľ je povinný psa pred ranným príchodom do škôlky primerane vyvenčiť.

4. Očkovanie a prevencia

Psík musí mať platné očkovanie proti besnote, infekčným ochoreniam a kotercovému kašľu. Psík musí byť pravidelne odčervovaný a chránený proti vonkajším parazitom, najmä blchám a kliešťom. Pri úvodnej návšteve je majiteľ povinný preukázať platnosť požadovaných očkovaní očkovacím preukazom. Ak očkovania nie sú platné, Chvostíkovo môže ďalšiu návštevu psa dočasne pozastaviť.

5. Správanie psa

Psík musí byť socializovaný, zvládnuteľný a nekonfliktný voči ľuďom aj ostatným psom. Do kolektívu neprijímame agresívne psy, psy s neprimeranými prejavmi agresie alebo psy, ktorých správanie predstavuje neprimerané riziko pre ostatných psov alebo personál. Majiteľ je povinný oznámiť všetky známe problémy so správaním psa, najmä agresiu, výrazné stráženie zdrojov, opakované napádanie iných psov alebo inú okolnosť, ktorá môže ovplyvniť bezpečný pobyt v kolektíve. Ak sa počas pobytu prejaví správanie nezlučiteľné s bezpečnou prevádzkou škôlky, Chvostíkovo môže pobyt psa v daný deň ukončiť. Pri závažnom alebo opakovanom problematickom správaní si Chvostíkovo vyhradzuje právo ďalšie návštevy psa pozastaviť alebo psa zo škôlky natrvalo vylúčiť.

6. Veterinárne ošetrenie

V prípade náhleho zhoršenia zdravotného stavu, úrazu alebo inej situácie vyžadujúcej pozornosť Chvostíkovo neodkladne kontaktuje majiteľa a podľa závažnosti situácie zváži ďalšie potrebné kroky. Ak zdravotný stav psa vyžaduje veterinárne ošetrenie alebo bezodkladný presun na veterinárne pracovisko, majiteľ potvrdením týchto podmienok udeľuje Chvostíkovu súhlas so zabezpečením prevozu psa k veterinárnemu lekárovi a potrebného veterinárneho ošetrenia. Náklady na veterinárne ošetrenie znáša majiteľ psa, pokiaľ nevznikli v dôsledku konania, za ktoré zodpovedá Chvostíkovo.

7. Rezervácia miesta a zrušenie rezervácie

Miesto v škôlke je potrebné rezervovať vopred prostredníctvom zákazníckej aplikácie alebo po dohode s Chvostíkovom. Kapacita škôlky je obmedzená a potvrdením rezervácie je pre konkrétneho psa rezervované miesto na daný deň.

Ak sa psík rezervovaného pobytu nemôže zúčastniť, majiteľ je povinný rezerváciu zrušiť najneskôr do 19:00 hod. dňa pred plánovanou návštevou.

Po 19:00 hod. sa rezervácia považuje za záväznú a Chvostíkovo počíta s účasťou psa a drží pre neho rezervované miesto. Ak sa pes následne návštevy nezúčastní, rezervovaný vstup sa považuje za využitý.

Vo výnimočných prípadoch, najmä pri náhlom ochorení psa, úraze alebo inej závažnej nepredvídateľnej udalosti, môže Chvostíkovo neskoré zrušenie rezervácie posúdiť individuálne a rozhodnúť, že vstup nebude považovaný za využitý.

8. Permanentka

Permanentka je viazaná na konkrétneho psa a je neprenosná. 10-vstupová permanentka má platnosť 2 mesiace od prvého využitého vstupu. Platnosť permanentky teda nezačína dňom zakúpenia, ale dňom, keď je z nej prvýkrát použitý vstup. Nevyužité vstupy po skončení platnosti permanentky prepadávajú.

9. Vyzdvihnutie a odvoz psa

Služba vyzdvihnutia alebo odvozu psa je dostupná po predchádzajúcej rezervácii a v závislosti od aktuálnej kapacity Chvostíkova. Aktuálna cena služby je uvedená v platnom cenníku.

10. Záverečné ustanovenia

Majiteľ potvrdením týchto podmienok vyhlasuje, že si ich prečítal, porozumel im a súhlasí s nimi. Podmienky sa vzťahujú na psa alebo psov priradených k jeho zákazníckemu účtu, pri ktorých boli podmienky potvrdené. Chvostíkovo môže podmienky primerane aktualizovať. V prípade zmeny, ktorá má vplyv na práva alebo povinnosti majiteľa, môže byť majiteľ pri ďalšom použití zákazníckej aplikácie vyzvaný na potvrdenie novej verzie podmienok.','b7a241f10b95d8ee3354724441de3ca10414e277c07fb81f9112d909dbaa6613',false,now());
