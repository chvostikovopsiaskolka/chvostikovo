# Shared acceptance setup and CRM repair — 16 October 2026

Customer remains 1.0.94 / v261, API58 and admin stable-v10-clean MD5 3a420f031dd671da1d0692918290f80f unchanged. This work repairs meta-crm-event v5 → v6 and adds explicitly authorized test data.

## Regression evidence

PGlite runs real booking RPC → cancellation/rebooking → staff approval → day finalization twice → daily finance → no-show for an owner with exactly one dog, independently with a 10-entry pass, 20-entry pass and a 25 EUR single. Exactly one attendance, one charged entry, one daily count, idempotent finalization and reversed no-show all PASS. The single-dog expired vaccination gate leaves no booking. Existing shared cases cover 8/10,9/10,10/10 and 18/20,19/20,20/20, two attendances/redemptions and pass10_count=2 with one pass row. One shared renewal interest creates one purchase, queued validity is deferred; cancellation replans the sibling. Full app renewal and actual admin/API regression PASS. These are local integration tests, not a guarantee of physical device behavior.

## Authorized live test setup

User requested his existing two-dog test account, pass at9/10 and intro tomorrow10:00. Verified owner76, authorized dogs87 Bella/88 Iris, current account scope and no conflicting activity. One transaction created pass68:10 entries,9 used, active16Oct–16Dec2026, source test_shared_v257, no purchase date, price0. Two explicit pass_dogs rows. No historical visits fabricated. Existing financial function intentionally excludes this test source, and daily financial data before/after matched. Real shared passes still count two attending dogs. No Monday booking or renewal interest was submitted on the user's behalf.

Intro17 is one structured pair record, Bella a Iris, Saturday17October2026 at10:00 Europe/Bratislava, sent to the verified test account's own phone ending9028 rather than the malformed old owner contact. Both dogs already exist: direct audited exception for SMS acceptance, source83 retains converted status and existing dog IDs; do not register them again. Normal save_web_intro_two_v250 correctly refuses new scheduling from a converted application. The test does not relax that guard. Exact live v8 feed source tested as a complete handler: one item with both names/date/time, secret required. External Apps Script project/scheduler was not accessible via Drive search, and actual sending/delivery remains unverified.

Private shared_audit_v244 entity test_setup_v262, entity_id owner76-20261016 stores original application and finance plus resulting pass/intro IDs; ordinary pass/membership audit triggers also fired. Source83 is now explicitly is_test=true so CRM v6 skips it and test identity cannot contribute advertising conversions. Future staff approval of a renewal remains a real sale operation: do not confirm a simulated payment without a separate test plan.

Read-only authenticated production Monday19October quote returned Bella10/10 frompass68 and Iris single, committed=false; transaction rolled back. This is expected before a next-pass interest exists. The user can make the reservation, see the normal last-entry question, and choose the next shared10. Local SQL tests verify replanning to old10 and next1 and one shared admin interest.

## CRM diagnosis and repair

Exact live v5 source redeclared const rows inside sendCrmStage. Native JavaScript parsing failed, and live OPTIONS returned503 BOOT_ERROR, request01a14458-23cc-7ff8-9984-e829aaf13da5. This supersedes older documentation saying v5 dedupe worked merely because deployment was ACTIVE. v6 renames the first binding, preserves actual Auth+staff checks and cron-secret auth, retains event-name/stage dedupe, records cross-form duplicate completion to stop endless retry, and skips explicit test submissions.

Contact matching remains conservative: normalized phone plus equal emails when both exist, otherwise exact trimmed case-insensitive owner name. Group lookup is not limited by the 90-day retry window. A delayed direct application can inherit fbc/fbp and source URL from the original matching consenting lead; application-level marketing consent is still required. Current application tracking wins if present. Two dogs remain one owner event. Conflicting identity data are not silently merged.

PASS complete actual handler transport tests: long-delayed direct application, original consenting attribution, shared canonical event ID, two dogs/one conversion, qualified versus converted stages, cross-form repeat, missing consent, test exclusion, conflicting email or name, staff auth, boot/OPTIONS. v6 ACTIVE exact-source readback PASS; live OPTIONS200, GET405 and unauthenticated POST400 prove startup/gating without sending a Meta event. Existing hourly retry remains active at minute07. Actual new CAPI acceptance/advertising attribution will be confirmed by the next real transition/log, not invented by testing.

Admin lead/application cards and consolidated CRM reporting are still separate V-027 work. The older pair76/77 has the same phone but Dana versus Danka and no email, so current conservative identity matching does not link them automatically. Do not silently rewrite that customer's name or merge them based on a guess. The user's possible Waiting for application status is recorded as a proposal in V-027; no additional workflow steps or UI have been deployed.

## Rollback and cleanup

v5 is saved exactly in supabase/backups/meta-crm-event-before-v262.ts for diagnostics, but must not be restored unchanged because it cannot boot. If attribution needs rollback, fix forward while retaining unique bindings, auth and test exclusion. No customer/admin code or schema changed. Test cleanup must target the audited exact IDs and respect any later bookings/redemptions; preserve audit/history and the known test flag. Do not run a wholesale restore or reconvert source83.
