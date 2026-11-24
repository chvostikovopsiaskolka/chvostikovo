<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Modern Web Guidance — project Codex entry (20.11.2026)

**Active repository skill:** `.agents/skills/modern-web-guidance/SKILL.md` (GoogleChrome/modern-web-guidance upstream mirrored with provenance and private-work policy). For **HTML, CSS, responsive UI, animations, forms, accessible interaction, images/performance and browser-side JS** use the skill before designing the technical implementation: search one precise web-platform use case, retrieve the actually matching guide, check Baseline/Safari/WebKit fallbacks, then reuse existing components and relevant browser regression. For a **broad retrospective codebase audit** use the skill's `legacy-scan . --json`, validate every reported finding in source, and remember the scanner covers only a subset of guidance.

**Two complementary layers, not a visual template:** Agency Agents / existing Bellaris UI quality skill and approved project design decide **what** to build, Modern Web Guidance helps **how** to build with modern browser features. Do not invent a fashionable layout or override approved fonts, photos, colors, text or UI contracts. For trivial copy-only tasks / backend / CI / secrets / SQL, do not trigger unnecessary UI research.

**Evidence and boundaries:** Chvostíkovo web only: respect marketing consent, SK/EN, lead forms, tracking, reduced-motion, responsive hero, iOS/Android and existing form/Pages tests. Do not touch customer PWA, admin, Supabase or Android as a consequence of this guidance-only integration. Only run `npx -y modern-web-guidance@latest` after package/network approval where required; set `DISABLE_TELEMETRY=1` for private work; never send project/customer details as a search query. If the CLI is unavailable, mark guidance **NOT RUN** and do not fake retrieved IDs or a completed scan. Do not edit dependencies, browser targets, LIVE URLs or dangerous auth/DB behavior just to satisfy a hint. Always report relevant retrieved IDs, which component/test changed and which mobile/desktop checks remain unverified. This configuration does **not** itself prove local Codex discovery or installation of the npm CLI.

## Dočasný režim spoločného PR pre drobné úpravy — 20.–30.11.2026

**Výslovne schválená dočasná výnimka z automatického okamžitého release:** platí iba do **30.11.2026 23:59 Europe/Bratislava**. Od **1.12.2026** sa bez ďalšieho zásahu prestáva uplatňovať a opäť platí bežné dokončenie zadania podľa projektových AGENTS. Nemeň kvôli tomu GitHub billing, vypnutie CI ani produkčný deploy mechanizmus.

- **Zlučuj:** súvisiace, nízkorizikové UI, CSS, textové a malé funkčné úpravy **jedného produktu/repozitára** v jednej pracovnej vetve a jednom PR. Ak už existuje vhodný otvorený PR, bezpečne pokračuj v ňom. Počet je počet samostatných používateľských požiadaviek na drobnú zmenu, nie počet súborov, commitov alebo testov. Rozsah a priebežný počet udržuj v popise toho istého PR, bez nového registra.
- **Pred hranicou:** pri 1–3 drobných zmenách ponechaj spoločný PR pripravený, ale bez merge a bez LIVE deploya; výslovne označ výsledok ako rozpracovaný. Cielené lokálne testy vykonávaj podľa dopadu. Neopakuj celý build/test ani netlač zbytočné priebežné commity na GitHub; na finálnom commite spusti všetky relevantné povinné CI, bezpečnostné regresie a potom skutočné LIVE overenie.
- **Pri štvrtej a každej ďalšej drobnej zmene v balíku:** ak používateľ ešte neurčil termín nasadenia, opýtaj sa **raz na rozhodnutie o balíku**: „Máme viac ako 3 súvisiace zmeny v jednom PR. Chceš ich teraz finalizovať, otestovať a nasadiť LIVE, alebo zatiaľ zbierať ďalšie?“ Bez odpovede **nemerguj ani nenasadzuj LIVE**; pokračovanie v zbieraní je možné na používateľov pokyn. Vždy rešpektuj výslovné „nasad LIVE“, „finalizuj“, „iba návrh/preview“, „priprav PR“ alebo „nenasadzuj“, aj pri menšom počte.
- **Výnimky:** urgentné opravy, kritické bugy, Auth/RLS, súkromie, DB/dáta, účtovanie, rezervácie, bezpečnostné kontroly alebo významná integračná závislosť sa nezdržiavajú len kvôli číslu 4. Dodrž platný rizikový schvaľovací proces; neobchádzaj required CI, ochrany vetiev, rollback ani izoláciu projektov.
- **Dokumentácia:** počas otvoreného balíka eviduj priebežný stav v jeho PR. Po skutočnom release urob jeden súhrnný zápis do existujúcej tematickej stránky wiki a jedného logu. Neoznač otvorený PR za produkčnú verziu. Po 1.12. porovnaj reálny GitHub billing/spotrebu, nie odhad.


## Chvostíkovo PWA icon rule

Before changing the PWA/home-screen icon for either the admin app or customer portal, read `system/PWA_ICON.md`.

The known-good icon is the **exact admin asset `Store-v2.png` (500x500 PNG)**. Reuse that exact asset/bytes for the customer portal as well. Do not generate, approximate, or substitute a different icon unless the user explicitly asks for a new design.

For the customer portal, the production solution confirmed working on 2026-09-15 serves the same `Store-v2.png` content through the existing same-origin icon route and uses it in the manifest/iOS icon path. Verify the actual iPhone **Add to Home Screen** preview before considering icon work complete.

## Permanent delivery agreement — user decision 27 October 2026

- Source order: observed LIVE production -> current GitHub code/commits/branches -> the private Bellaris Workspace wiki (`chvostikovopsiaskolka/Bellaris-workspace`, versioned Markdown on `main`) -> its synchronized local Obsidian copy -> Google Drive as historical archive/backup. Observed behavior is evidence, not permission to discard newer explicit requirements. Record discrepancies and dates.
- For normal development read only relevant wiki sections and affected code. Do not open, compare, synchronize or update Drive routinely. Use Drive only for an explicitly requested restore, backup or historical audit; preserve existing scheduled backups.
- An explicit implementation request (edit/fix/add/change/implement) authorizes the requested ordinary change through relevant tests, commit, push, required PR, checked merge to the designated production branch, existing deployment mechanism, LIVE verification and wiki update. Do not stop at a local edit, build, commit, PR or preview, or ask for the same permission again.
- First verify the project, current LIVE version and Git state; synchronize without losing drafts; retain a reproducible rollback; make the smallest isolated change. Reuse existing tools/dependencies. Run tests appropriate to the risk; preserve existing CTA, forms, attribution, navigation and shared language variants. Do not repeat successful checks unless later changes invalidate them. Auth, database, reservations, passes, health data and critical integrations require their full relevant regressions.
- Separate approval is required for destructive data changes, incompatible migrations, pricing/payments/billing changes, ads/budgets, bulk SMS/email/push, first client launch, DNS/cutover, customer-data migration, service disconnection, or significant security/access changes outside the requested scope. A first migration/launch is never implied by an ordinary UI request.
- Respect explicit planning-only, preview-only, PR-only and do-not-deploy instructions. If permissions, required CI, rollback or deployment prerequisites fail, do not bypass safeguards; report the exact blocker and leave a reviewable safe branch. Never force-push or rewrite published history.
- Verify the served artifact and relevant user flow before saying LIVE. Distinguish automated/browser checks from physical-device observations. Finish with outcome, commit/version, tests, deployment, rollback and unverified limits.
- Update the existing relevant wiki section and log, merge its checked documentation change to wiki `main` and read it back. Obsidian is a synchronized copy, not a competing source. Never copy private wiki contents, credentials or customer data into this repository. A link does not grant access to the private wiki; report missing access.

## Public website release efficiency — owner decision 24 November 2026

- For the public marketing website only, test the final candidate once before checked merge. Do not run the new assertions against the old production version. Both Chromium and WebKit remain required; they may run concurrently in isolated processes/reports, with a failure in either engine failing the job.
- The owner performs post-publication visual acceptance on his actual device. For ordinary web UI/content releases, the assistant confirms the successful GitHub Pages deployment of the intended commit and reports what the candidate tests actually verified; do not repeat a whole browser suite after publication or claim physical-device visual approval. The scheduled daily and manual technical browser monitoring remain independent. Security-critical changes and explicit incident investigations retain their necessary LIVE verification. This narrower handoff supersedes any general requirement for duplicate post-deploy UI testing, not the requirement to verify successful publication.
- PR browser checks test the freshly built candidate and select affected route consumers using scripts/public-web-impact.cjs. Isolated Aria changes cover LEAD, TEST and the puppy landing in both engines; unknown/shared styles, forms, libraries, backend, build or routing changes fail closed to the full suite. The existing required job is never skipped. Scheduled/manual monitoring keeps full LIVE coverage; do not repair unrelated homepage fixtures inside an isolated LEAD task or run new assertions against old LIVE.
- Responsive form cards: use the available content width at desktop breakpoints, retain sensible mobile insets and test real bounds/no overflow at both desktop and narrow mobile widths. Reuse approved components; do not impose a mobile-only maximum width at desktop.

## Production paths

- Public website: this repository, `main` -> existing GitHub Pages workflow -> https://chvostikovo.sk.
- Customer PWA: this repository, `customer-portal-production` -> existing Vercel project -> https://app.chvostikovo.sk. Never deploy customer changes through web main.
- Admin: verify the existing Supabase frontend snapshot/approved publishing mechanism, stable version and rollback; never publish admin through Pages or customer Vercel. Backend releases remain separate and require their relevant schema/access checks.

## Scope, privacy and operational safeguards

- Repository `main` contains the marketing website and its GitHub Pages
  build. Customer PWA, administration and backend are separate deployment
  paths even if they share a repository or integration. Check the intended
  branch and deployment before acting; NEVER deploy one to fix another.
- Customer data, credentials, tokens, staff-only records, private architecture,
  full production tables, and detailed security/rollback internals must not
  be committed to this public repository, issues or prompts.
- The Chvostíkovo System mentioned in historical material is retired.
  Do not revive or synchronize it.
- A new idea in 06 is not permission to build or launch it.
- For a documentation-only change, do not claim the application was tested
  or deployed. Preserve a reversible Git commit and label status accurately.

## Web-focused quality baseline (not a substitute for document 01)

- The web must clearly explain the real service and direct people to a
  genuine, accessible inquiry/contact action. Use verified prices,
  eligibility and business information only.
- Maintain semantic headings, meaningful titles/descriptions, appropriate
  canonical/hreflang/robots/sitemap, internal links, accessible focus and
  touch targets, responsive imagery, stable layout and reasonable load cost.
- Contact forms must accept both manually typed values and mobile autofill;
  correctly separate dog breed and weight, validate on server as well as
  client, avoid logging sensitive payloads, and preserve input when sending
  fails. Verify tracking does not double-count or manufacture conversions.
- Do not promise Google rankings, customer numbers or results without
  dated and independently validated evidence.

## Source of truth and limits

Repository files document implementation; current Bellaris Workspace wiki records
operational decisions; production APIs and served artifacts establish what runs.
Use the source order above and report conflicts with the latest explicit request.

These rules do not grant private wiki or deployment access. If access is missing,
report the precise gap and keep a safe reviewable branch; do not substitute a
routine Drive read or claim a deployment.

## Proportionate backup and CI policy — owner decision 10 November 2026

- For an ordinary low-risk UI, text, CSS, layout, image or navigation change, the exact pre-change Git commit SHA and a tested `git revert`/deployment rollback path are the reproducible rollback. Do **not** automatically create a `backup/*` branch, ZIP, GitHub/Workspace duplicate, database snapshot or export for every such edit. Do not force-push or rewrite published history.
- Group a **named stable checkpoint** about every 10 successfully deployed low-risk changes **per production delivery path**, or at a meaningful release boundary, whichever comes first. Reuse existing successful release commits and deployment histories; avoid duplicating entire working trees or database snapshots. A checkpoint is a reference to a verified version, not necessarily an extra branch or data copy.
- A risky change still requires a specific pre-change restorable point **before writing**: database schema/data or migrations, Auth/RLS/security/access, bookings, passes/payments, health records, production integrations, DNS and any irreversible operation. Verify restore scope and dependencies. Git code history is not a substitute for database/data or Supabase Storage backups.
- Preserve provider-managed database backups and existing recovery/audit evidence until their retention, current dependencies and restore path are independently verified. Never bulk-delete branches, tags, production tables, rollback scripts, snapshots, or customer data as a routine tidying step.
- Run targeted existing local checks once where possible, mandatory final CI on the final candidate commit once, and one relevant LIVE readback after deploy. Do not rerun a full suite when no functional code changed; rerun only checks invalidated by new changes, while keeping security-critical and production release gates intact. Avoid cross-project monitoring jobs and cancel superseded PR-only runs, not manual checks.
- Keep Chvostíkovo, Bellaris and other client repositories, billing and deployments isolated. Apply this policy via the private workspace standard and each project's applicable instructions, not by mixing project source into a shared branch.

## Product inquiries — owner decision 2 November 2026

- Products use the existing direct inquiry forms on each product detail, not a cart or checkout. Do not restore a cart/link/drawer without explicit authorization. /kosik and /objednavka are noindex redirect aliases to /produkty. Retired frontend source is stored as noncompiled text under archive/future-product-cart, not in the production database. Preserve product inquiry transport, idempotency, validation, autofill and existing backend records.
