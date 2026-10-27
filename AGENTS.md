# Chvostíkovo: stability before additional features

Before changing the admin, customer portal, backend or CRM, read `STABILITY.md` and only the relevant current Bellaris Workspace wiki section. Determine the live version and current Git commit; do not assume this checkout is live.

Keep unrelated changes isolated and preserve drafts. Do not rewrite published Git history. Follow the existing icon rule in `system/PWA_ICON.md` before any icon work.

The admin is served from the Supabase `frontend_snapshots` key `stable-v10-clean`, not from the customer portal deployment. A successful customer Vercel deployment does not prove that admin code runs. Test the assembled admin's actual script scopes and initialization; isolated helpers with fabricated global dependencies are insufficient.

Never say a feature is live or verified solely because code exists, a parser passes, or deployment returns success. Verify the served artifact and the relevant flow. Mark physical iOS/Android behavior as unverified unless it was actually observed.

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

- Customer PWA: `chvostikovopsiaskolka/chvostikovo`, `customer-portal-production` -> existing Vercel production project -> https://app.chvostikovo.sk. Preserve the version/release contract in STABILITY.md; pass the full required customer CI before merging.
- Public web: `main` -> GitHub Pages -> https://chvostikovo.sk. Never merge customer application changes into web main for deployment.
- Admin: existing approved Supabase frontend snapshots; verify the stable source and rollback, publish by that mechanism and inspect the real Admin UI. No admin deployment through Pages/customer Vercel. Backend is separate.
