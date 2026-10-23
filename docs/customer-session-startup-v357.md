# Verzia 357 — pripravené prihlásenie pred načítaním

[SCHVÁLENÉ NA VYDANIE — 23.10.2026] Používateľ výslovne potvrdil zverejnenie v357 v existujúcom verejnom repozitári a nasadenie. Viditeľné označenie aj titulok Git/PR iba v357, interná kompatibilná semver2.0.32 ostáva vo version.json/APP_VERSION. Existujúca kontrola novej PWA verzie a ochrana rozpracovaných formulárov zostávajú; pre budúci natívny Capacitor balík sa mechanizmus aktualizácie posúdi pri integrácii, nie odstránením PWA mechanizmu teraz. Nasadenie sa označí LIVE až po readbacku.

Základ: customer-portal-production 3fc21f24eedb9487b689010342db3f23a5bd24a1, Beta 2.0.31 / 20261023-name-edge-v356. Pred zmenou verejne servované app.js SHA256 759af6a730789b296c8eefb911054f04f87d82c3080e36cbf6b882143a16e574 zhodné s Git. Predchádzajúce produkčné nasadenie dpl_2rhALoDuZ3e2ADQBimciU18Aixi2, projekt prj_96ys4vEuosoiVCWmcps2gakCkItX / team_jvejA5gjOfk5Prg8xM6aYXRH. Lokálna nemenná rollback vetva backup/customer-before-startup-v357-20261023 ukazuje na uvedený základ.

## Výsledné správanie

Pri prvom načítaní, návrate z pozadia a relevantných požiadavkách appka lokálne kontroluje expires_at, prípadne exp z JWT. Pri platnosti kratšej než minúta najprv obnoví reláciu. Ide iba o plánovanie obnovy; token a oprávnenia naďalej kontroluje server. Pri platnom tokene nie je žiadne dodatočné overovacie API volanie. Nie je pridaný polling ani časovač pravidelného obnovovania.

API, dokument podmienok, stav prijatia, nástenka, push registrácia a Realtime zdieľajú existujúce jedno rozpracované obnovenie. Súbežný focus/visibility počas počiatočného bootstrapu nespustí druhý dátový sync. Existujúce cache, push cooldown, terms dedup a jedna bounded401 fallback vetva zostávajú. Monitorovanie a staff push prahy sa nemenia; neočakávané skutočné chyby sa naďalej zbierajú. Táto verzia nepridáva označovanie zotavených udalostí.

Obnova je viazaná na reláciu, z ktorej vznikla. Neskorá odpoveď neobnoví odhlásený účet ani neprepíše novšie prihlásenie. Rešpektuje localStorage / sessionStorage voľbu. Dočasný výpadok siete alebo5xx pri refreshi uložené prihlásenie nemaže; skutočne odmietnutý refresh sa pri bootstrap/resume vráti na login. Serverové RLS, account-block, autorizačné pravidlá, API/backend, push odosielanie, rezervácie, permanentky a údaje klientov sa nemenia. Prihlásenie odvolané na serveri alebo chybný čas zariadenia stále môže vyvolať odmietnutie; nulový počet všetkých401 sa nesľubuje.

## Overenie

tests/customer-session-startup-v357.cjs vykonáva skutočný kompletný app.js s DOM a uloženou reláciou. Overuje cold-start s expirovaným tokenom + súbežné terms/push/socket, jeden refresh pred chránenými požiadavkami, jedno načítanieAPI, zdieľané terms, platný token bez refreshu, foreground/focus dedup, offline/503 zachovanie relácie, revoked refresh login, logout/newlogin počas oneskorenej odpovede, session-only storage, existujúci bounded401 retry, JWT exp fallback a minútovú rezervu. Test zapojený do existujúceho CI.

Existujúce full customer1/2psy, saved-session boot/resume1/2psy, stabilné fotky pri resume1/2psy, vaccination-photo replacement/draft/error/account isolation, read-only quote retry bez opakovania zápisov, terms dedup/account/cache a JS/CSS parser PASS. tests/customer-session-browser-v357.cjs: reálny Chromium cold-start s expirovanou reláciou, jeden refresh, žiadny starý token priAPI/terms/push, bez pageerror a rovnaká geometria spodnej navigácie Prehľad/Menu pri320/360/390/430/844×390 PASS. Testy používajú výlučne syntetické lokálne údaje a transport; neposielajú produkčné rezervácie, správy, push, SMS ani konverzie. Fyzický iPhone/Android nepozorovaný.

## Release a návrat

Nový build v357, Beta 2.0.32, súhlasné app.js/index.html/sw.js/version.json. Vydanie až po relevantných kontrolách, kontrole nezmeneného remote základu, CI a overení produkčného aliasu a presných súborov. Po novších vydaniach robiť selektívny forward revert, neprepísať ich starým snapshotom. Pred vrátením na staré nasadenie overiť novšie zmeny. Bez databázového rollbacku, keďže DB nebola menená. Žiadna úplná produkčná záloha ani súkromné údaje sa do Git nepridávajú.
