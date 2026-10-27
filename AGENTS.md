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
