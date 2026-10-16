# Waiting for an application and CRM continuity — 16 October 2026

User authorized a visible Waiting for application checkbox without removing the lead, plus correct future interest → application → intro → client tracking. Customer PWA remains1.0.94/v261 and customer API58; no booking/pass/financial rules changed.

## Deployed workflow

Existing lead detail has Čakáme na prihlášku. Staff RPC sets waiting_for_application and marks a new lead reviewed, never archived. It remains in the lead list with a checked waiting status. Unchecking clears waiting and retains reviewed. Linked application arrival clears waiting and the card shows Prihláška prijatá, Úvodná návšteva dohodnutá or Klient from actual related records. The source lead keeps its own converted_dog_id empty, so one client is not fabricated in both forms. Reciprocal navigation stays within existing details; no additional modal or mandatory step.

Persistent application.crm_lead_id references the original lead. Automatic match at application INSERT uses normalized phone plus equal nonempty emails when both exist, otherwise exact trimmed case-insensitive owner name; conflicting candidate emails block automatic grouping. Earliest unambiguous prior lead wins, without a day limit. Known test identities do not auto-link. A staff-only inline selection can link differing spellings after confirming the same phone/email and identity. Wrong form types, an already differently-linked application, unrelated contacts and real/test mixing are rejected; all links/waiting changes are privately audited. Original submissions and source marketing data remain intact.

Legacy backfill found0 exact matches. Historical76 Dana /77 Danka remains unlinked pending explicit staff confirmation, not silently merged. That candidate now appears in the lead detail for review. No actual lead was marked waiting on the user's behalf, no registration or SMS was fabricated. Existing counts37 lead rows/20 application rows unchanged.

## CRM delivery

meta-crm-event8 ACTIVE exact-source verified. It follows persisted lead groups even when spelling/phone later changes; fallback conservative matching remains for unlinked legacy contacts. Original consenting ad tracking is retained on direct returns; current application marketing consent is required. QualifiedLead means an actually saved intro; ConvertedLead means actual registration. Checkbox or application linking alone sends neither stage. Each contact/stage uses one canonical event ID; previous sent logs across linked forms suppress repeats and linked duplicates are recorded.

Pair intro/register and direct pair registration now call the existing guarded sender after successful DB writes; direct registration awaits delivery attempt before reload. CAPI failure does not undo a registration. An intro INSERT/source assignment records crm_qualified_at on its source form; that marker survives removal of the intro when registration completes. Hourly retry uses this durable marker and converted.updated_at, so failures can recover even after intro deletion or a long delay after application creation. Same event ID on retry, marketing/test/auth guards remain. No new Meta events from toggling or linking.

Real production evidence from the previous v6 restoration: at11:07UTC/13:07Bratislava16Oct, hourly retry delivered two missing ConvertedLead events for real applications59/61; both Meta responses events_received=1. Test83 qualified/converted skipped. This verifies acceptance, not guaranteed advertising attribution in Meta reports. v263 did not replay additional historical conversions or invoke cron manually.

## Source and deployment

Schema apply_migration entries20261016111713 web_crm_waiting_and_links_v263 and20261016112152 web_crm_qualified_transition_v263. Exact SQL in supabase/changes/crm-waiting-v263.sql and crm-qualified-transition-v263.sql. New columns/constraints/FK indexes and private RLS/no-client-grant audit. Two intentional authenticated SECURITY DEFINER RPCs check real active staff; anon EXECUTE revoked. Advisor INFO private audit without policies and WARN two authenticated definer RPCs are intentional and covered by authorization tests. References https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable .

Admin stable-v10-clean finalMD5 e0cd8f3987a9b90bc17032e3a39c5484,725211 PostgreSQL characters. Backup backup-admin-before-crm-workflow-v263-20261016 exactMD5 3a420f031dd671da1d0692918290f80f. Final deterministic patch admin-crm-workflow-v263.sql includes both the new extension and pair delivery additions; admin-crm-pair-events-v263.sql records the incremental patch used after the initial extension, not an additional step after the final full patch. CRM v6 exact backup supabase/backups/meta-crm-event-before-v263.ts.

## Verification and rollback

PASS native PGlite staff/RLS RPCs: waiting/reviewed stays visible, direct delayed application links and clears waiting, source converted marker not duplicated, spelling difference only explicit link, repeated link, wrong contact/prior root/test/customer denied, private audit inaccessible, qualification survives intro deletion. PASS actual admin card+extension DOM including failure rollback, persisted checkbox, manual selection, reciprocal navigation and client labels. PASS all27 admin scripts, actual pair handlers qualified/converted order, failed registration, pre-reload send and tolerated CAPI failure. PASS full Edge handler transport including original attribution, canonical IDs, changed identity with persisted link, no consent/test, real Auth/staff and cron-secret checks, failure→hourly retry with same eventID and no duplicate conversion. Existing v262 CAPI regression retained.

LIVE staff RPC positive waiting/link exercised only in ROLLBACK; historical76/77 unchanged. LIVE anon EXECUTE denied; final admin hash/backup/source markers, CRM8 exact source and API boot/auth readback PASS. No authenticated physical iPhone/Android visual test or new end-to-end Meta event was fabricated.

Rollback admin only by final-hash guarded restore from the exact backup, retaining compatible schema/CRM8 and all user workflow/audit data. Do not drop links/timestamps/audit or restore v6 matching/retry blindly once links exist. Prefer a forward fix for CRM changes. Billing/customer deployment can remain unchanged.
