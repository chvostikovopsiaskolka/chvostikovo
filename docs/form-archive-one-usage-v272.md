# Form archive and shared usage choice v272 — 16 October 2026

## Confirmed permission failure

Screenshot error `permission denied for function crm_phone_v263` reproduced for a real staff JWT subject and role authenticated updating test application86 status→archived, in ROLLBACK. Expression index public.web_crm_phone_v263 evaluates private.crm_phone_v263(phone) during table UPDATE, including status/note edits. The normalizer is immutable and reads only its input. The earlier form-submission fix granted service_role execute; authenticated still lacked it.

Minimal migration crm_phone_index_staff_execute_v272 grants EXECUTE on this pure helper to authenticated. It does not grant private schema USAGE, anonymous execute, table privileges or bypass staff RLS. Exact same staff archive UPDATE succeeds in ROLLBACK after the fix; a real customer subject updates0rows. Application86 left new so the operator can remove it through the normal button; the UI archives rather than physically deletes records. No unrelated record modified. Rollback revoke is in changes/crm-index-staff-v272.sql.

## One usage question

Web Forms.tsx removes the second usage selector and submission field; inquirySchema no longer requires duvod2 and payload's second dog inherits first duvod. Optional legacy duvod2 type remains compatible but does not override the common choice. Individual names/breed/weight/sex/age/neuter/health/temperament fields stay separate. The server independently inherits the first validated usage choice, accepts missing second usage and omits the repeated usage line from the second dog's email section. Historical data remains unchanged.

Admin dog badge shows usage only when dog_order=1. Stable-v10-clean and served HTML expected MD5 7060e5acc2a672a4a061bbe3aac8a158/767229PGcharacters. Backup backup-admin-before-second-usage-v272-20261016 MD5 10cb4a2eae30c79a4c14ddd4e5090664. Guarded deploy/rebuild in tools/changes. Existing second-dog historical usage is hidden, not destroyed.

Edge web-form-submit27 ACTIVE, exact live readback matches local source. Prior26 source in main PR61 supabase/backups/web-form-submit-before-v272.ts. Web main PR61; customer PWA unchanged.

Verification: full Edge handler mocked transport accepts two dogs without second usage; synthetic live dry_run smoke passes (no write/SMS). Production smoke changed from an owner's phone to +421000000000 synthetic fixture after automatic approval blocked the original personal-data POST. TypeScript passes,260React autofill cases+8foreign prefixes pass, attribution and form alert regressions pass, separate application-detail/health conversion checks pass. Bun-only local suite adapted to Jiti/React/VM syntax checker; Pages CI runs canonical Bun checks. Local web compilation succeeds but prerender is blocked by host uv_interface_addresses restriction; actual Pages CI/deployment must be verified separately. Actual admin badge DOM verifies first usage visible, second absent. Physical signed-in mobile interaction unverified.
