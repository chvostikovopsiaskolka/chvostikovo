# Verified dog linking v251 — LIVE 2026-10-15

Admin stable-v10-clean MD5 829c660075986f00c3e549d385002af9 (715101 characters). Customer API v56 ACTIVE, exact source readback verified. Customer PWA remains 9a4e41625b2aa5908ddb8694a27096a6c5079c36 / Beta 1.0.87 v246.

Registration requests containing Bella, Iris are recognized as two separate requested names. Auth insert trigger stores registration_dog_names; safely parsed pending metadata is backfilled, without creating dogs or linking accounts. Admin selects an existing dog, confirms completed introductory visit and verifies ownership with a note. Only a two-name request receives the second-dog question; No grants only the selected dog, Yes selects another existing active dog of the same recorded owner. Manual second attachment remains available. No third explicit dog. One dog may have two customer accounts. No matching by name grants access.

allowed_dog_ids NULL preserves existing owner links; new links have explicit dog IDs. Customer API authorization/photo fallback, existing ownership checks, notification recipient joins and terms INSERT policy respect the scope. Existing business rules and vaccination logic are unchanged. Each confirmed link is audited once; profile row locking serializes duplicate/concurrent staff approvals. Legacy direct linking RPC now requires the verified wrapper.

SQL file: supabase/migrations/20261015190455_verified_dog_links_v251.sql. Connector apply_migration failed twice with Invalid or expired requestState and produced no changes; the exact file was then applied atomically with execute_sql BEGIN/COMMIT. This deployment is NOT recorded by apply_migration in Supabase migration history. Reconcile migration history before a later CLI db push; do not reapply the file.

Tests: native production table schema in PGlite, staff/intro/owner checks, one/second/max2 dogs, second owner, idempotent audit, comma parsing, API scoped/legacy behavior; JSDOM full click paths Yes/No and no prompt for one dog. Admin all-script parsing and intake, introductory-visit and bulletin regressions passed. LIVE negative RPC checks rejected missing intro confirmation, wrong owner and legacy bypass with no business writes. Exact API source and snapshot hash readback passed. Logged-in LIVE browser/mobile E2E and real push delivery were not available. Adriana remains pending and unlinked; dogs 87/88 remain under owner 76, no staff approval was performed on her behalf.

Scope: shared passes and pair booking remain draft #41, not deployed by v251. Future PWA registration confirmation dialog is still part of unfinished V030 work; existing comma input is recognized by this server/admin release.

## Rollback

1. Run supabase/changes/rollback-link-ui-v251.sql only if current snapshot is the v251 hash. This restores backup-admin-before-verified-links-v251-20261015 (664b6216a4abad04112f7bd0d50c5b3b). Keep API v56 and scoped SQL functions, allowed_dog_ids, registration names and audit. Older admin's direct approve button then rejects with the verified-approval message; existing customer access stays safe. Repair linking UI before resuming approvals.
2. Never restore API v55 or owner-wide SQL while any explicit scope exists: it would expose other dogs. Full legacy restoration is possible only after SELECT count(*) FROM customer_owner_links WHERE allowed_dog_ids IS NOT NULL and SELECT count(*) FROM private.dog_link_audit_v251 both return zero; recheck under a table lock and restore exact saved definitions/policy in one transaction. Keep additive columns/audit for history. No DROP or deletion of links/dogs/owners is part of rollback.

Reproduction: npm ci --prefix tests/shared-v244; node tests/verified-links-v251.mjs. Baseline snapshot is the production backup key; builders use staged-admin-v250.html as local baseline. Do not deploy the unrelated shared-pass draft migration.
