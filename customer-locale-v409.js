/* Chvostíkovo SK/EN customer interface v409.
 * Presentation-only: no auth, API, profile, terms or checkout mutation.
 * Keep legally binding text and staff-written notices in their original language.
 */
(() => {
  'use strict';
  const STORAGE_KEY = 'chvostikovo-customer-locale-v408';
  const DICTIONARY = new Map([
  ["Späť na úvod","Back to welcome"],
  ["Späť","Back"],
  ["Bližšie k vášmu psíkovi","Closer to your dog"],
  ["Zákaznícky portál","Customer portal"],
  ["Permanentka, dochádzka, rezervácie aj oznamy. Všetko dôležité na jednom mieste.","Passes, attendance, bookings and announcements. Everything important in one place."],
  ["Prehľad funkcií","Features"],
  ["Permanentka","Pass"],
  ["Dochádzka","Attendance"],
  ["Oznamy","Announcements"],
  ["Vytvoriť účet","Create an account"],
  ["Už mám účet","I already have an account"],
  ["Prihlásenie","Sign in"],
  ["Prihlásiť sa","Sign in"],
  ["Obnova hesla","Reset password"],
  ["Nové heslo","New password"],
  ["E-mail","Email"],
  ["Heslo","Password"],
  ["Zapamätať prihlásenie","Remember me"],
  ["Zabudli ste heslo?","Forgot your password?"],
  ["Meno a priezvisko","Full name"],
  ["Telefón","Phone number"],
  ["Meno psíka","Dog's name"],
  ["Podľa mena ho priradíme k vášmu účtu.","We will link your dog to your account by name."],
  ["V prípade dvoch psíkov vyplňte mená oboch oddelené čiarkou (napr. Bella, Iris).","If you have two dogs, enter both names separated by a comma (e.g. Bella, Iris)."],
  ["Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.","At least 8 characters, including upper- and lower-case letters and one digit."],
  ["E-mail k účtu","Account email"],
  ["Pošleme vám odkaz na vytvorenie nového hesla.","We will email you a password reset link."],
  ["Poslať odkaz na obnovu","Send reset link"],
  ["Späť na prihlásenie","Back to sign in"],
  ["Zopakujte nové heslo","Repeat your new password"],
  ["Uložiť nové heslo","Save new password"],
  ["Skúsiť znova","Try again"],
  ["Appku sa nepodarilo načítať","The app couldn't be loaded"],
  ["Prihlásenie zostalo zachované. Skontrolujte pripojenie alebo to skúste znova o chvíľu.","Your sign-in has been preserved. Check your connection or try again shortly."],
  ["Neplatné prihlasovacie údaje.","Invalid sign-in details."],
  ["Požiadavka sa nepodarila.","The request couldn't be completed."],
  ["Prístup k účtu je zablokovaný. Kontaktujte Chvostíkovo.","Your account is blocked. Please contact Chvostíkovo."],
  ["Zadajte e-mail.","Enter your email."],
  ["Zadajte heslo.","Enter your password."],
  ["E-mail bol odoslaný.","Email sent."],
  ["Skontrolujte e-mail.","Check your email."],
  ["Zmena hesla","Change password"],
  ["Otvoriť účet","Open account"]
  ]);
  // v409: selected navigation/booking/vaccination/guide UI, never customer content.
  for(const [sk,en] of [["Môj psík","My dog"],["Správa údajov a informácií o psíkovi","Manage your dog's information"],["Údaje psíka","Dog details"],["Očkovania","Vaccinations"],["Oznamy","Announcements"],["Pravidlá škôlky","Daycare rules"],["Žiacka knižka","Report card"],["Pripravujeme","Coming soon"],["Moje kontaktné údaje","My contact details"],["Vaše osobné údaje a kontakty","Your personal and contact details"],["Nastavenia","Settings"],["Upozornenia a súhlasy","Notifications and consents"],["Upozornenia","Notifications"],["Súhlasy a podmienky","Consents and terms"],["Požiadať o vymazanie účtu","Request account deletion"],["Odhlásiť sa","Sign out"],["Všetky práva vyhradené.","All rights reserved."],["Sledujte Chvostíkovo aj na sociálnych sieťach 🐾","Follow Chvostíkovo on social media 🐾"],["Nájdete tu príbehy, fotky a videá vašich štvornohých ratolestí z ich dní v škôlke.","Enjoy stories, photos and videos from your dogs' days at daycare."],["Napíšte nám správu","Send us a message"],["Správy","Messages"],["Napíšte nám otázku k rezervácii alebo čokoľvek iné.","Ask us about a booking or anything else."],["Zavolať do Chvostíkova","Call Chvostíkovo"],["Súvisiaca rezervácia (nepovinné)","Related booking (optional)"],["Bez konkrétnej rezervácie","No specific booking"],["Správa","Message"],["Odoslať správu","Send message"],["Napíšte správu pre Chvostíkovo…","Write a message to Chvostíkovo…"],["Vyberte deň","Choose a day"],["Rezervácie na ďalší týždeň do nedele 20:00.","Book next week's visits by Sunday at 8 PM."],["Ak potrebujete individuálny termín, kontaktujte nás.","Contact us if you need an individual arrangement."],["Rezervácie","Bookings"],["Rezervovať miesto","Book a place"],["Rezervovať","Book"],["Upraviť","Edit"],["Zrušiť","Cancel"],["Potvrdiť","Confirm"],["Vybraté dni","Selected days"],["Vyberte psíka","Select a dog"],["Otvoriť údaje psíka","Open dog details"],["Moje rezervácie","My bookings"],["Dnes","Today"],["Zajtra","Tomorrow"],["Použité vstupy","Visits used"],["Platnosť od","Valid from"],["Platí do","Valid until"],["Bez aktuálnej permanentky","No active pass"],["Aktívna permanentka","Active pass"],["Plánovaný vstup","Planned visit"],["Jednorazový vstup","Single visit"],["Posledný vstup","Final visit"],["Rezervácia","Booking"],["Čaká na schválenie","Pending approval"],["Schválené","Approved"],["Zrušené","Cancelled"],["Návštevy","Visits"],["Počet návštev","Visit count"],["Príchod","Arrival"],["Odchod","Departure"],["Otvoriť Správy","Open messages"],["Zobraziť viac","Show more"],["Zobraziť všetky","Show all"],["Zavrieť","Close"],["Uložiť","Save"],["Uložiť kontaktné údaje","Save contact details"],["Uložiť očkovania","Save vaccinations"],["Údaje môžete kedykoľvek doplniť alebo upraviť.","You can complete or update these details at any time."],["Fotografie očkovacieho preukazu","Vaccination record photos"],["Nahrajte alebo odfoťte 1 až 5 fotografií strán s platnosťou očkovaní.","Upload or take 1 to 5 photos showing the validity of vaccinations."],["Kotercový kašeľ","Kennel cough"],["Besnota","Rabies"],["Infekčné ochorenia","Infectious diseases"],["Má váš psík leptospirózu zaočkovanú zvlášť?","Has your dog received a separate leptospirosis vaccination?"],["Dátum vyplňte iba pri samostatnom očkovaní L4. Ak má psík spoločné DHPPi+L, nechajte toto pole prázdne.","Enter the date only if L4 was given separately. Leave this blank for a combined DHPPi+L vaccination."],["Platí do (nepovinné)","Valid until (optional)"],["Zdravotné údaje","Health information"],["Plemeno","Breed"],["Váha","Weight"],["Pohlavie","Sex"],["Dátum narodenia","Date of birth"],["Súhlasy","Consents"],["Podmienky škôlky","Daycare terms"],["Ochrana osobných údajov","Privacy policy"],["Preskočiť","Skip"],["Pokračovať","Continue"],["Dokončiť","Finish"],["Spustiť sprievodcu","Start guide"],["Sprievodca appkou","App guide"],["Sprievodca aplikáciou","App guide"],["Ukážka rezervácie","Example booking"],["Rezervovať 2 dni","Book 2 days"],["Váš psík v Prehľade","Your dog in Overview"],["Permanentka a vaše rezervácie","Your pass and bookings"],["Vaše rezervácie","Your bookings"],["Výber dní a taxi","Choose dates and taxi"],["Všetko ostatné v Menu","Everything else in Menu"],["Ťuknutím na profil otvoríte údaje a fotografiu psíka. Pri očkovaniach nájdete ich platnosť, pri grafe počet návštev. Pri zapnutých upozorneniach pripomenieme končiace očkovanie 14 a 7 dní vopred.","Tap the profile to see your dog's details and photo. Check vaccination validity and visit count. With notifications enabled, we'll remind you 14 and 7 days before vaccinations expire."],["Ak máte zakúpenú permanentku, tu uvidíte jej platnosť a počet využitých vstupov. Pod ňou nájdete svoje rezervácie a možnosť Upraviť. Cez Oznamy otvoríte novinky zo škôlky a cez Správy nám priamo napíšete.","Here you'll find your pass validity and used visits. Below are your bookings and an Edit option. Open daycare news in Announcements or contact us in Messages."],["Tlačidlom Rezervovať miesto v spodnej lište otvoríte dostupné dni. Po výbere uvidíte Vybraté dni a potvrdenie rezervácie.","Use Book a place in the bottom bar to view available dates. After selecting, review Selected days and confirm the booking."],["Tu nájdete vytvorené rezervácie a stav schválenia. Podľa dostupných možností pridáte alebo upravíte taxi či zrušíte návštevu. Ak chcete zmeniť termín, zrušíte pôvodný a vyberiete nový.","Find your bookings and approval status here. Depending on availability, you can add or edit taxi transport or cancel a visit. To change a date, cancel the original and book a new one."],["Ukážka: vyberte dni v kalendári. Vybraté dni a tlačidlo Rezervovať nájdete pod kalendárom. Ku každému dňu môžete pridať taxi.","Example: select dates in the calendar. Selected days and the Book button appear below. Taxi transport can be added for each day."],["V Menu nájdete údaje psíka, očkovania, svoje kontakty aj správy pre škôlku. V Nastaveniach si môžete tohto sprievodcu kedykoľvek zopakovať. Pripravujeme aj rozšírenú žiacku knižku a odmeny.","The Menu contains your dog's details, vaccinations, contacts and messages. You can repeat this guide in Settings. More report-card features and rewards are coming."],["Ukážeme vám Prehľad, rezervácie a Menu v šiestich krátkych krokoch. Sprievodcu môžete kedykoľvek preskočiť.","We'll show you Overview, Bookings and the Menu in six short steps. You can skip the guide any time."]]) DICTIONARY.set(sk,en);
  // v411: complete registration/legal labels and extend customer UI without data mutation.
  for (const [sk,en] of [["Permanentky, návštevy, rezervácie a novinky na jednom mieste.","Passes, visits, bookings and updates in one place."],["Zopakujte heslo","Confirm password"],["Oboznámil/a som sa so","I have read the"],["zásadami ochrany osobných údajov","privacy policy"],["Informácie o spracúvaní osobných údajov","Privacy notice"],["Prevádzkovateľ:","Data controller:"],["Marek Leder – Bellaris, IČO: 56447001, miesto podnikania: Miškovecká 1023/2, 040 11 Košice-Juh. Prevádzkareň Chvostíkovo: Poľská 2207/6, 040 01 Košice-Juh. Zapísaný v Živnostenskom registri Okresného úradu Košice, č. 820-106266. Kontakt: chvostikovo.psiaskolka@gmail.com, +421 951 069 395.","Marek Leder – Bellaris, company ID: 56447001, registered place of business: Miškovecká 1023/2, 040 11 Košice-Juh. Chvostíkovo daycare premises: Poľská 2207/6, 040 01 Košice-Juh. Registered in the Trade Register of the Košice District Office under No. 820-106266. Contact: chvostikovo.psiaskolka@gmail.com, +421 951 069 395."],["V zákazníckom portáli spracúvame údaje potrebné na poskytovanie služieb škôlky, najmä meno a priezvisko, e-mail, telefónne číslo, údaje o psíkovi, rezervácie, návštevy, permanentky, taxi službu, komunikáciu so škôlkou, údaje o očkovaniach, fotografie očkovacieho preukazu a fotografiu psíka, ak ju nahráte.","In the customer portal, we process the information necessary to provide our daycare services, in particular your full name, email address, telephone number, information about your dog, bookings, visits, passes, dog transport, communications with the daycare, vaccination details, photographs of vaccination records and a photo of your dog if you upload one."],["Údaje používame na správu účtu, organizáciu rezervácií a návštev, bezpečnú starostlivosť o psíka, komunikáciu a plnenie povinností súvisiacich s prevádzkou škôlky.","We use this information to manage your account, organise bookings and visits, care safely for your dog, communicate with you and meet the obligations associated with operating the daycare."],["Nepoužívame reklamné nástroje ani údaje nepredávame.","We do not use advertising tools or sell your information."],["Na technickú prevádzku portálu využívame poskytovateľov infraštruktúry potrebných na fungovanie aplikácie.","We use the infrastructure providers necessary for the app to operate."],["Údaje uchovávame počas trvania zákazníckeho vzťahu a následne po dobu potrebnú na splnenie zákonných povinností a ochranu právnych nárokov. V súvislosti so svojimi údajmi môžete požiadať o prístup, opravu, vymazanie alebo obmedzenie spracúvania, ak sú splnené zákonné podmienky.","We keep your information during the customer relationship and afterwards for as long as necessary to meet legal obligations and protect legal claims. You may request access, rectification, deletion or restriction of processing of your personal data where the applicable legal conditions are met."],["Potvrdením pri registrácii neudeľujete marketingový súhlas. Potvrdzujete, že ste sa s týmito informáciami oboznámili.","Acknowledging this notice during registration does not give marketing consent. It confirms that you have read this information."],["Kompletné zásady ochrany osobných údajov pre web aj zákaznícku aplikáciu sú verejne dostupné aj bez prihlásenia:","The complete privacy policy for the website and customer app is publicly available without signing in:"],["Otvoriť zásady ochrany osobných údajov","Open privacy policy"],["Rozumiem","I understand"],["Potvrdiť a pokračovať","Confirm and continue"],["Potvrdzujem, že som si Podmienky psej škôlky Chvostíkovo prečítal/a, ich obsahu rozumiem a súhlasím s nimi.","I confirm that I have read and understood Chvostíkovo's dog daycare terms and agree to them."],["Potvrdiť a prijať podmienky","Accept terms and continue"],["Podmienky psej škôlky Chvostíkovo","Chvostíkovo Dog Daycare Terms"],["Prečítajte si podmienky. Až potom sa sprístupní potvrdenie o prečítaní podmienok.","Please read the terms. The confirmation option will become available once you have reached the end."],["Teraz môžete potvrdiť, že ste si podmienky prečítali.","You can now confirm that you have read the terms."],["Zavrieť výber psíka","Close dog selection"],["Verzia:","Version:"],["Pravidlá škôlky momentálne nie sú dostupné.","Daycare rules are currently unavailable."],["Pravidlá potvrdené","Terms accepted"],["Moje potvrdené verzie","My accepted versions"],["Otvoriť alebo stiahnuť PDF","Open or download PDF"],["Otvoriť PDF","Open PDF"],["Stiahnuť PDF","Download PDF"],["Zatiaľ nemáte potvrdenú verziu podmienok.","You have not accepted a version of the terms yet."],["Najprv sa prihláste.","Please sign in first."],["Doplniť údaje","Complete details"],["Heslo nie je zhodné.","Passwords do not match."],["Heslá sa nezhodujú.","Passwords do not match."],["Heslo musí mať aspoň 8 znakov.","Password must contain at least 8 characters."],["Potvrdenie hesla","Confirm password"],["Skryť heslo","Hide password"],["Zobraziť heslo","Show password"],["Údaje psíka","Dog details"],["Aktualizovať údaje","Update details"],["Zmeniť fotografiu","Change photo"],["Vybrať fotografiu","Choose photo"],["Alergie a zdravotné obmedzenia","Allergies and health restrictions"],["Alergie","Allergies"],["Obmedzenia","Restrictions"],["Povaha","Temperament"],["Pes","Male"],["Suka","Female"],["Áno","Yes"],["Nie","No"],["Kastrovaný","Neutered"],["Nekastrovaný","Not neutered"],["Odvoz domov","Drop-off at home"],["Vyzdvihnutie","Collection"],["Vyzdvihnutie aj odvoz domov","Collection and drop-off"],["Taxi do škôlky","Taxi to daycare"],["Taxi zo škôlky","Taxi home"],["Bez taxi","No taxi"],["Už mám rezerváciu","I already have a booking"],["Mám záujem","I'm interested"],["Vybrať dni","Choose dates"],["Požiadať o rezerváciu","Request a booking"],["Na schválenie","Awaiting approval"],["Potvrdené","Confirmed"],["Čaká na potvrdenie","Awaiting confirmation"],["Požiadať o permanentku","Request a pass"],["Kúpiť permanentku","Buy a pass"],["Zostávajúce vstupy","Remaining visits"],["Zostáva","Remaining"],["Využité","Used"],["Platnosť permanentky","Pass validity"],["Bez platnej permanentky","No valid pass"],["Neprišiel","Did not attend"],["Moje údaje","My details"],["Upraviť údaje","Edit details"],["Oznamy zo škôlky","Daycare announcements"],["Oznámenia","Notifications"],["Správy od škôlky","Messages from daycare"],["Načítavam…","Loading…"],["Načítavam aktuálne pravidlá škôlky…","Loading the current daycare terms…"],["Nastavenia upozornení","Notification settings"],["Povoliť upozornenia","Enable notifications"],["Vypnúť upozornenia","Disable notifications"],["Pridať na plochu","Add to Home Screen"],["Zavrieť okno","Close window"]]) DICTIONARY.set(sk,en);
  // v413: profile/vaccination onboarding labels; customer and staff data remain untouched.
  for(const [sk,en] of [["Zadám neskôr","I'll add them later"],["Doplňte očkovania psíka","Complete your dog's vaccinations"],["Doplniť očkovania","Add vaccinations"],["* označuje povinný údaj","* indicates a required field"],["(nepovinné)","(optional)"],["Základné údaje psíka už máte uložené. Chýbajú len platné očkovania alebo fotografia očkovacieho preukazu. Bez nich zatiaľ nie je možné rezervovať miesto.","Your dog's basic details are saved. Only valid vaccinations or a photo of the vaccination record are missing. Bookings are unavailable until they are added."],["Doplňte dátum narodenia, plemeno a pohlavie psíka. Váha je nepovinná. Platné očkovania a doklady už evidujeme.","Enter your dog's date of birth, breed and sex. Weight is optional. Valid vaccinations and records are already on file."],["Najprv doplňte dátum narodenia, plemeno a pohlavie psíka. Váha je nepovinná. Potom môžete doplniť očkovania a fotografie preukazu.","First enter your dog's date of birth, breed and sex. Weight is optional. You can then add vaccinations and record photos."]]) DICTIONARY.set(sk,en);
  // v420: remaining built-in auth, dashboard, pass and reservation UI (never staff/client content).
  for(const [sk,en] of [
    ['Poslať nový overovací odkaz','Resend verification link'],
    ['Zatiaľ nemáte vytvorenú rezerváciu.','No bookings yet.'],
    ['Najbližšia rezervácia je neskôr než o dva týždne.','Your next booking is more than two weeks away.'],
    ['Prosíme o rezerváciu miesta do nedele 20:00.','Please book by Sunday at 8 PM.'],
    ['Posuňte pre zobrazenie ďalších dní →','Swipe to see more days →'],
    ['Rezervované návštevy','Booked visits'],
    ['Najbližšia návšteva · ','Next visit · '],
    ['Najbližšia návšteva, ','Next visit, '],
    ['Upraviť rezerváciu','Edit booking'],
    ['Schválená','Approved'],
    ['Zamietnutá','Declined'],
    ['Čaká na schválenie. Kamarátov uvidíte po schválení rezervácie.','Pending approval. Friends will appear once your booking is approved.'],
    ['Rezervácia bola zamietnutá.','The booking was declined.'],
    ['Zatiaľ sa neprihlásil žiaden kamoš.','No dog friends have booked yet.'],
    ['Zobraziť kamošov v škôlke','See dog friends at daycare'],
    ['Rezervujte miesto pre svojho psíka. Vyberte si deň/dni nižšie.','Book a place for your dog. Choose your day(s) below.'],
    ['Očkovania nie sú platné','Vaccinations are not valid'],
    ['Očkovania sú platné','Vaccinations are valid'],
    ['Platné očkovania','Valid vaccinations'],
    ['Návštevy v škôlke:','Daycare visits:'],
    ['Použité','Used'],
    ['Použité vstupy','Visits used'],
    ['Platnosť bez obmedzenia','No expiry date'],
    ['Platnosť permanentky','Pass validity'],
    ['Platnosť do','Valid until'],
    ['Jednorazový vstup','Single visit'],
    ['Plánovaná permanentka','Planned pass'],
    ['Spoločná','Shared'],
    ['Zostáva platných','Valid remaining'],
    ['Upraviť fotky','Edit photos'],
    ['Všetky očkovania platné','All vaccinations valid'],
    ['Najprv zadajte platný e-mail použitý pri registrácii.','First enter the valid email you used to register.'],
    ['Nový odkaz môžete vyžiadať najskôr o 2 minúty. Skontrolujte zatiaľ posledný e-mail.','You can request another link in two minutes. Please check your latest email.'],
    ['Ak e-mail čaká na potvrdenie, poslali sme nový odkaz. Otvorte iba najnovšiu správu a nežiadajte opakovane ďalšie odkazy.','If your email is awaiting confirmation, we sent a new link. Open only the newest email and avoid requesting several links.'],
    ['E-mail ešte nie je potvrdený. Otvorte najnovší potvrdzovací e-mail. Ak odkaz nefunguje, požiadajte nižšie o nový.','Email not verified yet. Open the latest confirmation email, or request a new link below.'],
    ['Nesprávny e-mail alebo heslo. Ak ste ešte nepotvrdili e-mail, najprv použite najnovší potvrdzovací odkaz. Inak skúste obnoviť heslo.','Incorrect email or password. If your email is unverified, use the latest confirmation link. Otherwise, try resetting your password.'],
    ['Skontrolujte formát e-mailovej adresy a skúste to znova.','Check your email address format and try again.'],
    ['Priveľa pokusov. Chvíľu počkajte a skúste to znova.','Too many attempts. Please try again later.'],
    ['Prihlásenie sa nepodarilo. Skúste to znova.','Sign-in failed. Please try again.'],
    ['Zrušiť rezerváciu','Cancel booking'],
    ['Bez udania dôvodu','Without a reason'],
    ['Chcem zmeniť termín','I want to change the date'],
    ['Po uzávierke odošlite žiadosť o zrušenie v správe škôlke.','After the deadline, ask to cancel via a message to the daycare.'],
    ['Leptospiróza L4','Leptospirosis L4'],
    ['Niektoré očkovania už nie sú platné.','Some vaccinations have expired.'],
    ['Doplňte chýbajúce očkovania alebo doklad.','Add the missing vaccinations or vaccination record.'],
    ['Blíži sa koniec platnosti očkovania.','One or more vaccinations expire soon.'],
    ['Nezabudnite preočkovať svojho psíka a aktualizovať doklad, aby ste predišli zablokovaniu ďalších rezervácií.','Please renew the vaccination and update its record to avoid future booking restrictions.'],
    ['Prihlásený škôlkar','Daycare dog'],
    ['Kamaráti v škôlke','Dog friends at daycare'],
    ['Zatiaľ tu nie sú ďalší kamaráti.','No other dog friends are here yet.'],
    ['📅 Moje rezervácie','📅 My bookings'],
    ['Pozrite si kamošov v škôlke ›','See dog friends at daycare ›'],
    ['Vybraté dni ↓','Selected days ↓'],
    ['Obsadené','Fully booked']
  ]) DICTIONARY.set(sk,en);
  // v421: built-in navigation/calendar/transport labels; never translate customer text,
  // staff-written notices, chat, or signed documents.
  for(const [sk,en] of [
    ['Prehľad','Overview'],['Hlavná navigácia','Main navigation'],
    ['Otvoriť produkty Chvostíkova v prehliadači','Open Chvostíkovo products in the browser'],
    ['Rezervácia škôlky','Daycare booking'],['Vyberte deň alebo dni','Choose a day or days'],
    ['Najbližšie dva týždne','Next two weeks'],['Psík','Dog'],['Obaja psíkovia','Both dogs'],
    ['Opakované dni rezervácie','Recurring booking days'],['Tento týždeň','This week'],
    ['Budúci týždeň','Next week'],['O dva týždne','In two weeks'],
    ['Vybraté dni ↓','Selected days ↓'],['Taxi podľa vybraného dňa','Taxi for the selected day'],
    ['Potrebujete odvoz? 🚕','Need transport? 🚕'],[' · Vybrané',' · Selected'],
    ['Vybrané','Selected'],['Vyzdvihnutie aj dovoz','Pickup and drop-off'],
    ['Dovoz domov','Drop-off home'],['Pridať taxík','Add transport'],
    ['Upraviť taxi','Edit transport'],['Pridať taxi','Add transport'],
    ['Taxík čaká na schválenie','Transport awaiting approval'],
    ['Prajete si zmeniť typ taxíka?','Change your transport option?'],
    ['Požiadať o zmenu','Request a change'],
    ['Nestihli ste rezervovať miesto do nedele?','Missed the Sunday booking deadline?'],
    ['Kliknite na deň, odošlite žiadosť a počkajte na schválenie. Pri plnej kapacite nám napíšte správu.','Select a day and submit your request for approval. If fully booked, message us.'],
    ['Niektoré dni nemajú dostatok voľných miest.','Some days have limited availability.'],
    ['Kliknite na požadovaný deň a napíšte nám správu. O možnosti prihlásenia vás budeme informovať.','Select your preferred day and message us. We will let you know if a place becomes available.'],
    ['Čaká','Pending'],['Uplynulo','Past'],['Zatvorené','Closed'],['Plno','Full'],
    ['Napíšte nám','Message us'],['Obsadené','Occupied'],
    ['Zatvorené pre rezervácie','Bookings closed'],['Čaká na schválenie','Awaiting approval'],
    ['Schválená','Approved'],['Zamietnutá','Declined'],
    ['Rezervujte miesto pre svojho psíka. Vyberte si deň/dni nižšie.','Book a place for your dog. Select your day(s) below.'],
    ['Pridať taxík','Add transport'],['Odvoz','Transport'],
    ['Zobraziť kamošov v škôlke','See daycare friends'],
    ['Oznamy škôlky','Daycare announcements'],
    ['Načítavanie aplikácie','Loading app'],['Psia škôlka','Dog daycare']
  ]) DICTIONARY.set(sk,en);
  // v414: the new dock shortcut is an external catalog link, not an in-app checkout.
  DICTIONARY.set('E-shop','Shop');
  const root = document.getElementById('authView');
  const controls = document.getElementById('customerLocaleSwitchV408');
  if (!root || !controls) return;
  const original = new WeakMap();
  const knownAttributes = new WeakMap();
  let lang = 'sk';
  try {
    const requested = new URL(location.href).searchParams.get('lang');
    lang = requested === 'en' || requested === 'sk' ? requested :
      localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'sk';
  } catch (_) { lang = 'sk'; }
  try { if (new URL(location.href).searchParams.has('lang')) localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  const dynamicRootIds=['appView','customerGuideV358','dogDetailsModal','bookingPickerV37',
    'privacyInfoModal','schoolTermsModal','schoolRulesModalV55','schoolTermsReadModal',
    'customerContactModal','customerGradebookModal','dogSettingsModalV36',
    'dogDetailsOnboardingModalV75','waitingDogAssignmentModalV75','shareOnboardingModalV75'];
  // The fixed dock sits outside #appView, so it must be translated as well.
  const roots=()=>[root,document.querySelector('.bottom-nav'),...dynamicRootIds.map(id=>document.getElementById(id))].filter(Boolean);
  // Never translate user/staff-authored content or the signed canonical terms body.
  const excluded='script,style,textarea,[contenteditable="true"],#messageThread,.message-thread,#announcementNotice,#notificationList,.customer-bulletin-dialog-v229,.customer-bulletin-history-row-v229,#schoolTermsBody,#schoolRulesBodyV55,#schoolTermsReadBody';
  // App-owned onboarding dialogs use .legal-body for layout too; only signed terms stay untranslated.
  const skip=element=>!!element?.closest?.(excluded) ||
    (!!element?.closest?.('.legal-body') &&
      !element.closest('#privacyInfoModal,#dogDetailsOnboardingModalV75,#waitingDogAssignmentModalV75,#shareOnboardingModalV75,#dogSettingsModalV36,#customerContactModal,#customerGradebookModal'));
  const weekdayEn={pondelok:'Monday',utorok:'Tuesday',streda:'Wednesday',štvrtok:'Thursday',piatok:'Friday',sobota:'Saturday',nedeľa:'Sunday'};
  const dayShortEn={Po:'Mon',Ut:'Tue',St:'Wed','Št':'Thu',Pi:'Fri',So:'Sat',Ne:'Sun'};
  const monthsEn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const translate = (text,element) => {
    const exact=DICTIONARY.get(text);if(exact)return exact;
    // Only calendar UI may contain short weekday abbreviations. Never map
    // ordinary names, announcements, signed text or user-entered data.
    if(element?.closest?.('#bookingPickerV37,.booking-picker-v37,.design-selected-day,#designBookingCarousel,.design-visit-card')){
      const shortDay=text.slice(0,1).toUpperCase()+text.slice(1).toLowerCase();
      if(dayShortEn[shortDay])return dayShortEn[shortDay];
      const date=text.match(/^(pondelok|utorok|streda|štvrtok|piatok|sobota|nedeľa)\s+(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/i);
      if(date)return weekdayEn[date[1].toLowerCase()]+', '+Number(date[2])+' '+monthsEn[Number(date[3])-1]+' '+date[4];
      if(weekdayEn[text.toLowerCase()])return weekdayEn[text.toLowerCase()];
    }
    let availability=text.match(/^(\d+)\s+voľné$/);
    if(availability)return availability[1]+' places left';
    availability=text.match(/^Obsadené\s+(\d+)\s+z\s+(\d+)\s+miest$/);
    if(availability)return 'Occupied: '+availability[1]+' of '+availability[2]+' places';
    availability=text.match(/^(Vyzdvihnutie aj dovoz|Vyzdvihnutie|Dovoz domov)\\s*·\\s*(\\d+\\s*€)$/);
    if(availability)return (DICTIONARY.get(availability[1])||availability[1])+' · '+availability[2];
    availability=text.match(/^Rezervovať\s+(\d+)\s+(deň|dni|dní)$/);
    if(availability)return 'Book '+availability[1]+' days';
    availability=text.match(/^Potrebujete odvoz\?\s*🚕(\s*·\s*Vybrané)?$/);
    if(availability)return 'Need transport? 🚕'+(availability[1]?' · Selected':'');
    availability=text.match(/^Taxi na\s+(.+)$/);
    if(availability)return 'Transport on '+availability[1];
    availability=text.match(/^Upraviť rezerváciu na\s+(.+)$/);
    if(availability)return 'Edit booking on '+availability[1];

    let match=text.match(/^([0-9]+) z ([0-9]+)$/);
    if(match)return match[1]+' of '+match[2];
    match=text.match(/^([0-9]+) z ([0-9]+) vstupov$/);
    if(match)return match[1]+' of '+match[2]+' visits';
    match=text.match(/^Platnosť: ešte ([0-9]+) (deň|dni|dní)$/);
    if(match)return Number(match[1])===1?'Valid for 1 more day':'Valid for '+match[1]+' more days';
    match=text.match(/^Návštevy v škôlke:\s*([0-9]+)$/);
    if(match)return 'Daycare visits: '+match[1];
    match=text.match(/^Platnosť do (.+)$/);
    if(match)return 'Valid until '+match[1];
    match=text.match(/^Platí do (.+)$/);
    if(match)return 'Valid until '+match[1];
    match=text.match(/^Prosíme o rezerváciu miesta do nedele (.+?) do 20:00\.$/);
    if(match)return 'Please book by Sunday '+match[1]+', 8:00 PM.';
    return null;
  };
  const bare = node => (node?.nodeValue || '').trim();
  function updateText(node) {
    if (node.nodeType !== 3 || !node.parentElement ||
      skip(node.parentElement)) return;
    const current = bare(node);
    if (!current) return;
    let record = original.get(node);
    if (!record || (current !== record.sk && current !== record.en)) {
      const en = translate(current,node.parentElement);
      if (!en) return;
      record = {sk: current, en};
      original.set(node, record);
    }
    const next = lang === 'en' ? record.en : record.sk;
    if (current === next) return;
    const value = node.nodeValue;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    node.nodeValue = leading + next + trailing;
  }
  function updateAttributes() {
    for(const scope of roots()) for(const element of scope.querySelectorAll('[aria-label],[title],[placeholder]')){
      if(skip(element))continue;
      let records=knownAttributes.get(element);
      if(!records){records=new Map();knownAttributes.set(element,records);}
      for(const attribute of ['aria-label','title','placeholder']){
        const current=element.getAttribute(attribute);
        if(current===null||!current.trim())continue;
        let record=records.get(attribute);
        if(!record||(current!==record.sk&&current!==record.en)){
          const en=translate(current,element);if(!en)continue;
          record={sk:current,en};records.set(attribute,record);
        }
        const next=lang==='en'?record.en:record.sk;
        if(current!==next)element.setAttribute(attribute,next);
      }
    }
  }
  // A bulletin may be active in the archive without being featured on Overview.
  // Reuse the authoritative unread counter; never infer unread from the carousel.
  const unreadSourceV421=document.getElementById('customerAnnouncementsCountV363');
  const dogSummaryV421=document.querySelector('#menuDogGroup > summary');
  let dogUnreadV421=null;
  if(unreadSourceV421&&dogSummaryV421){
    dogUnreadV421=document.createElement('span');
    dogUnreadV421.className='customer-dog-unread-v421 hidden';
    dogUnreadV421.setAttribute('aria-hidden','true');
    dogSummaryV421.insertBefore(dogUnreadV421,dogSummaryV421.querySelector('.menu-chevron'));
  }
  function syncDogUnreadV421(){
    if(!dogUnreadV421)return;
    const raw=Number(unreadSourceV421.textContent.trim());
    const count=!unreadSourceV421.classList.contains('hidden')&&Number.isFinite(raw)&&raw>0?Math.floor(raw):0;
    dogUnreadV421.classList.toggle('hidden',!count);
    dogUnreadV421.textContent=count?String(count):'';
    if(count){
      const message=lang==='en'
        ? 'My dog, '+count+' unread announcement'+(count===1?'':'s')
        : 'Môj psík, '+count+' neprečítan'+(count===1?'ý oznam':count>=2&&count<=4?'é oznamy':'ých oznamov');
      dogSummaryV421.setAttribute('aria-label',message);
    }else dogSummaryV421.removeAttribute('aria-label');
  }
  if(unreadSourceV421){
    new MutationObserver(syncDogUnreadV421).observe(unreadSourceV421,{
      childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']
    });
  }
  function apply(){
    for(const scope of roots()){
      const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
      let node;while((node=walker.nextNode()))updateText(node);
    }
    updateAttributes();
    for(const button of document.querySelectorAll('#customerLocaleSwitchV408 button[data-customer-locale],#customerLocaleInMenuV409 button[data-customer-locale]')){
      const active=button.dataset.customerLocale===lang;
      if(button.getAttribute('aria-pressed')!==String(active))button.setAttribute('aria-pressed',String(active));
      button.classList.toggle('active',active);
    }
    if(document.documentElement.lang!==lang)document.documentElement.lang=lang;
    syncDogUnreadV421();
  }
  let queued = false;
  const requestApply = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {queued = false;apply();});
  };
  const clickLocale=event=>{
    const button=event.target.closest('button[data-customer-locale]');
    if(!button||!event.currentTarget.contains(button))return;
    const chosen=button.dataset.customerLocale;if(chosen!=='sk'&&chosen!=='en')return;
    lang=chosen;try{localStorage.setItem(STORAGE_KEY,lang)}catch(_){}
    apply();
    window.customerDesignRefreshLocaleV420?.();
  };
  controls.addEventListener('click',clickLocale);
  document.getElementById('customerLocaleInMenuV409')?.addEventListener('click',clickLocale);
  const observer=new MutationObserver(records=>{
    if(records.some(record=>{
      const element=record.target.nodeType===1?record.target:record.target.parentElement;
      if(element?.closest?.('.lg-v3-material,.lg-v3-output')||skip(element))return false;
      if(element?.closest?.('#authView,.bottom-nav,'+dynamicRootIds.map(id=>'#'+id).join(',')))return true;
      return [...record.addedNodes].some(node=>node.nodeType===1&&
        (dynamicRootIds.includes(node.id) || node.querySelector?.(dynamicRootIds.map(id=>'#'+id).join(','))));
    }))requestApply();
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
  window.ChvostikovoLocale = Object.freeze({
    getLanguage: () => lang,
    setLanguage: value => {
      if (value !== 'sk' && value !== 'en') return false;
      lang = value;
      try {localStorage.setItem(STORAGE_KEY,lang)} catch (_) {}
      apply();
      window.customerDesignRefreshLocaleV420?.();
      return true;
    }
  });
  apply();
})();
