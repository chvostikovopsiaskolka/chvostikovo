CREATE OR REPLACE FUNCTION private.enqueue_weekly_booking_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  local_now timestamp := clock_timestamp() AT TIME ZONE 'Europe/Bratislava';
  next_monday date := date_trunc('week',local_now)::date + 7;
  inserted integer := 0;
BEGIN
  IF extract(isodow FROM local_now) <> 7 OR extract(hour FROM local_now) <> 18
     OR extract(minute FROM local_now) <> 5 THEN RETURN 0; END IF;

  INSERT INTO public.portal_notifications(
    recipient_user_id,notification_type,title,body,entity_type,entity_id,
    event_key,visible_from,visible_until,push_title,push_body)
  SELECT DISTINCT profile.user_id,'weekly_booking_reminder',
    'Nezabudnite prihlásiť psíka 🐾',
    'Ešte ste si nevybrali dni pre psíka na budúci týždeň. Prihláste ho v aplikácii.',
    'weekly_booking_reminder',null,
    'weekly-booking:'||next_monday::text,local_now::date,local_now::date,
    'Nezabudnite prihlásiť psíka 🐾',
    'Ešte ste si nevybrali dni pre psíka na budúci týždeň. Prihláste ho v aplikácii.'
  FROM public.customer_profiles profile
  JOIN public.customer_owner_links link ON link.user_id=profile.user_id
  JOIN public.dogs dog ON dog.owner_id=link.owner_id AND dog.active=true
  WHERE profile.status='active'
    AND EXISTS (SELECT 1 FROM public.portal_push_subscriptions sub
                WHERE sub.user_id=profile.user_id AND sub.active=true)
    AND (EXISTS (SELECT 1 FROM public.visits visit
                WHERE visit.dog_id=dog.id
                  AND visit.visit_date BETWEEN next_monday-7 AND next_monday-3)
         OR EXISTS (SELECT 1 FROM public.reservations past
                WHERE past.dog_id=dog.id AND past.status IN ('booked','attended')
                  AND past.reservation_date BETWEEN next_monday-14 AND next_monday-3))
    AND NOT EXISTS (SELECT 1 FROM public.customer_booking_requests request
                    WHERE request.dog_id=dog.id
                      AND request.reservation_date BETWEEN next_monday AND next_monday+4
                      AND request.status IN ('pending','approved','cancel_requested'))
    AND NOT EXISTS (SELECT 1 FROM public.reservations reservation
                    WHERE reservation.dog_id=dog.id
                      AND reservation.reservation_date BETWEEN next_monday AND next_monday+4
                      AND reservation.status='booked')
  ON CONFLICT (recipient_user_id,event_key) WHERE event_key IS NOT NULL DO NOTHING;
  GET DIAGNOSTICS inserted=ROW_COUNT;
  RETURN inserted;
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_cancel_reservation(p_reservation_id bigint, p_reason text DEFAULT NULL::text)
 RETURNS customer_booking_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_reservation public.reservations%rowtype;
  v_now_local timestamp := now() at time zone 'Europe/Bratislava';
  v_deadline timestamp;
  v_reason text := nullif(left(btrim(coalesce(p_reason,'')),500),'');
  v_row public.customer_booking_requests%rowtype;
begin
  if v_uid is null then raise exception 'Najprv sa prihláste.'; end if;
  select r.* into v_reservation from public.reservations r
  join public.dogs d on d.id=r.dog_id
  join public.customer_owner_links l on l.owner_id=d.owner_id
  where r.id=p_reservation_id and r.status='booked' and l.user_id=v_uid for update of r;
  if v_reservation.id is null then raise exception 'Rezervácia sa nenašla.'; end if;
  v_deadline := (v_reservation.reservation_date-1)::timestamp + time '21:00';
  if v_now_local > v_deadline then
    raise exception 'Rezerváciu bolo možné zrušiť najneskôr deň vopred do 21:00. Kontaktujte Chvostíkovo.';
  end if;
  update public.reservations set status='cancelled' where id=v_reservation.id;
  -- Both linked owners see the same final state after a reservation cancellation.
  update public.customer_booking_requests
     set status='cancelled',cancelled_at=clock_timestamp(),cancellation_reason=v_reason
   where reservation_id=v_reservation.id and status in ('approved','cancel_requested');
  insert into public.customer_booking_requests(
    user_id,dog_id,reservation_date,status,reservation_id,projected_entry_number,projected_pass_total,
    taxi_mode,taxi_amount,cancellation_reason,cancelled_at
  ) values (
    v_uid,v_reservation.dog_id,v_reservation.reservation_date,'cancelled',v_reservation.id,
    v_reservation.planned_entry_number,v_reservation.planned_pass_total,
    coalesce(v_reservation.taxi_mode,'none'),coalesce(v_reservation.taxi_amount,0),v_reason,now()
  ) returning * into v_row;
  return v_row;
end;
$function$;

INSERT INTO public.portal_terms_documents(version,title,body,document_hash,active,effective_from)
SELECT '2026-10-03',title,'1. Zdravotný stav psa

Psík musí byť v dobrom zdravotnom stave a schopný bezpečne sa zúčastňovať kolektívnych aktivít. Majiteľ je povinný pravdivo a včas informovať Chvostíkovo o zdravotnom stave psa, jeho ochoreniach, alergiách, obmedzeniach, užívaných liekoch alebo iných skutočnostiach, ktoré môžu ovplyvniť jeho pobyt v škôlke alebo bezpečnosť ostatných psov. Fenky počas hárania do škôlky neprijímame. Ak sa pred pobytom alebo počas neho prejavia zdravotné ťažkosti, príznaky infekčného ochorenia alebo iný stav, pri ktorom nie je vhodné pokračovať v kolektívnom pobyte, Chvostíkovo môže podľa okolností pobyt psa upraviť alebo v daný deň ukončiť a kontaktovať majiteľa.

2. Pobyt v kolektíve a zodpovednosť

Majiteľ berie na vedomie, že psia škôlka je kolektívne prostredie, v ktorom dochádza k prirodzenej interakcii medzi psami, spoločnej hre, pohybu a vzájomnému kontaktu. Chvostíkovo zabezpečuje počas pobytu psov primeraný dohľad a prijíma opatrenia na predchádzanie konfliktom a minimalizovanie rizika zranenia.

Aj pri riadnom dohľade však môže dôjsť k náhlej a nepredvídateľnej reakcii psa, konfliktu medzi psami, škrabnutiu, odrenine, pohryzeniu alebo inému zraneniu.

Prevádzkovateľ psej škôlky Chvostíkovo nenesie zodpovednosť za zranenie alebo škodu, ktorá vznikne v dôsledku bežnej a nepredvídateľnej interakcie psov v kolektíve, pokiaľ bol zo strany dohliadajúceho personálu zabezpečený primeraný dohľad a dodržané bezpečnostné postupy.

Toto ustanovenie sa nevzťahuje na prípady, keď by k udalosti došlo v dôsledku zanedbania primeraného dohľadu, porušenia bezpečnostných povinností alebo iného pochybenia prevádzkovateľa alebo dohliadajúceho personálu.

Majiteľ je povinný pravdivo informovať Chvostíkovo o známych prejavoch agresie, konfliktnom správaní, strážení zdrojov alebo iných okolnostiach, ktoré môžu mať vplyv na bezpečnosť psa, ostatných psov alebo personálu.

3. Hygiena

Psík by mal mať základné hygienické návyky v interiéri. Majiteľ je povinný psa pred ranným príchodom do škôlky primerane vyvenčiť.

4. Očkovanie a prevencia

Psík musí mať platné očkovanie proti besnote, infekčným ochoreniam (DHPPi+L) a kotercovému kašľu. Psík musí byť pravidelne odčervovaný a chránený proti vonkajším parazitom. Pri úvodnej návšteve je majiteľ povinný preukázať platnosť požadovaných očkovaní očkovacím preukazom. Pri registrácii v zákazníckej aplikácii majiteľ zároveň zadá dátumy platnosti povinných očkovaní a nahrá fotografie očkovacieho preukazu, aby bolo možné údaje priebežne evidovať a kontrolovať. Ak očkovania nie sú platné, Chvostíkovo môže ďalšiu návštevu psa dočasne pozastaviť.

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

Majiteľ potvrdením týchto podmienok vyhlasuje, že si ich prečítal, porozumel im a súhlasí s nimi. Podmienky sa vzťahujú na psa alebo psov priradených k jeho zákazníckemu účtu, pri ktorých boli podmienky potvrdené. Chvostíkovo môže podmienky primerane aktualizovať. V prípade zmeny, ktorá má vplyv na práva alebo povinnosti majiteľa, môže byť majiteľ pri ďalšom použití zákazníckej aplikácie vyzvaný na potvrdenie novej verzie podmienok.',encode(extensions.digest('1. Zdravotný stav psa

Psík musí byť v dobrom zdravotnom stave a schopný bezpečne sa zúčastňovať kolektívnych aktivít. Majiteľ je povinný pravdivo a včas informovať Chvostíkovo o zdravotnom stave psa, jeho ochoreniach, alergiách, obmedzeniach, užívaných liekoch alebo iných skutočnostiach, ktoré môžu ovplyvniť jeho pobyt v škôlke alebo bezpečnosť ostatných psov. Fenky počas hárania do škôlky neprijímame. Ak sa pred pobytom alebo počas neho prejavia zdravotné ťažkosti, príznaky infekčného ochorenia alebo iný stav, pri ktorom nie je vhodné pokračovať v kolektívnom pobyte, Chvostíkovo môže podľa okolností pobyt psa upraviť alebo v daný deň ukončiť a kontaktovať majiteľa.

2. Pobyt v kolektíve a zodpovednosť

Majiteľ berie na vedomie, že psia škôlka je kolektívne prostredie, v ktorom dochádza k prirodzenej interakcii medzi psami, spoločnej hre, pohybu a vzájomnému kontaktu. Chvostíkovo zabezpečuje počas pobytu psov primeraný dohľad a prijíma opatrenia na predchádzanie konfliktom a minimalizovanie rizika zranenia.

Aj pri riadnom dohľade však môže dôjsť k náhlej a nepredvídateľnej reakcii psa, konfliktu medzi psami, škrabnutiu, odrenine, pohryzeniu alebo inému zraneniu.

Prevádzkovateľ psej škôlky Chvostíkovo nenesie zodpovednosť za zranenie alebo škodu, ktorá vznikne v dôsledku bežnej a nepredvídateľnej interakcie psov v kolektíve, pokiaľ bol zo strany dohliadajúceho personálu zabezpečený primeraný dohľad a dodržané bezpečnostné postupy.

Toto ustanovenie sa nevzťahuje na prípady, keď by k udalosti došlo v dôsledku zanedbania primeraného dohľadu, porušenia bezpečnostných povinností alebo iného pochybenia prevádzkovateľa alebo dohliadajúceho personálu.

Majiteľ je povinný pravdivo informovať Chvostíkovo o známych prejavoch agresie, konfliktnom správaní, strážení zdrojov alebo iných okolnostiach, ktoré môžu mať vplyv na bezpečnosť psa, ostatných psov alebo personálu.

3. Hygiena

Psík by mal mať základné hygienické návyky v interiéri. Majiteľ je povinný psa pred ranným príchodom do škôlky primerane vyvenčiť.

4. Očkovanie a prevencia

Psík musí mať platné očkovanie proti besnote, infekčným ochoreniam (DHPPi+L) a kotercovému kašľu. Psík musí byť pravidelne odčervovaný a chránený proti vonkajším parazitom. Pri úvodnej návšteve je majiteľ povinný preukázať platnosť požadovaných očkovaní očkovacím preukazom. Pri registrácii v zákazníckej aplikácii majiteľ zároveň zadá dátumy platnosti povinných očkovaní a nahrá fotografie očkovacieho preukazu, aby bolo možné údaje priebežne evidovať a kontrolovať. Ak očkovania nie sú platné, Chvostíkovo môže ďalšiu návštevu psa dočasne pozastaviť.

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

Majiteľ potvrdením týchto podmienok vyhlasuje, že si ich prečítal, porozumel im a súhlasí s nimi. Podmienky sa vzťahujú na psa alebo psov priradených k jeho zákazníckemu účtu, pri ktorých boli podmienky potvrdené. Chvostíkovo môže podmienky primerane aktualizovať. V prípade zmeny, ktorá má vplyv na práva alebo povinnosti majiteľa, môže byť majiteľ pri ďalšom použití zákazníckej aplikácie vyzvaný na potvrdenie novej verzie podmienok.','sha256'),'hex'),false,clock_timestamp()
FROM public.portal_terms_documents WHERE version='2026-09-30' AND document_hash='b7a241f10b95d8ee3354724441de3ca10414e277c07fb81f9112d909dbaa6613'
ON CONFLICT(version) DO NOTHING;
