# CRM, photos and Hannah attendance v270 — 16 October 2026

## CRM and photos

The v263 CRM module referenced private main-app functions from a standalone script. It failed before installing the lead detail extension. Move the existing module into the actual main closure and publish the final openWebSubmission entry point. The waiting checkbox is directly in the lead detail, not behind “mark handled”. Existing staff-only RPC marks reviewed+waiting, retains the lead in the list, and does not send a client conversion. Existing matching/manual links/Meta stage logic remains unchanged.

Admin loadData discarded signed photo URLs and owner photos, then requested fresh URLs on every reload. Care refresh dropped owner_photos. Both now preserve photos for identical path/version and reuse URLs within the existing 50-minute validity window, invalidate actual changes, and do not request already-fresh photos. Pending overview originally replaced its HTML twice; it now delegates to the grouped renderer. Dashboard and pending markup updates retain the exact image nodes across text changes, use stable photo identity across signed-token changes, and invalidate actual photo versions. Unchanged markup does not touch DOM. Never clear an existing photo while unrelated data loads.

Project rule for both apps: preserve displayed, decoded photos on foreground/resume and unrelated updates; refresh only changed content, do not turn URL signature changes into image changes, keep the existing photo until its replacement loads, test one/two dogs and account switch. This is a persistent implementation/QA requirement, not a claim that OS cache can never be evicted. Customer PWA source unchanged; customer-resume-photos-v260 regression passes for one and two dogs. Physical iPhone/Android behavior not directly tested.

## Attendance

cron job4 failed at 08:05 UTC on14October: `reservations_planned_pair_check`, row328 single/unpaid, attempted planned_entry_number=NULL and planned_pass_total=10. The day transaction rolled back, leaving11booked reservations without visits. Minimal private.finalize_day fix clears planned_pass_total when actual entry number is null; no grants or price changes. Exact previous function is in private.shared_audit_v244 function_backup_v270 and supabase/backups/finalize-day-before-v270.sql. Full real finalizer14October regression succeeds processed11 in ROLLBACK (no historical batch committed).

Marek explicitly confirmed Hannah's14October attendance. Guarded audited correction only for dog79/reservation349/pass64: insert missing20€ visit, pass used5→6, chronological visits/reservations/customer cards1–6, legacy/monthly count+1, refresh14October daily financials, replan future pending requests. Purchase stays200€ on9October; no new sale/pass. Future19–23October are7,8,9,10,new-perma1; last refers to existing pending interest11. All requests83–87 remain pending. Historical Google Calendar upserts sent through existing integration; readback finds9Oct1/10,12Oct2/10,13Oct3/10,14Oct4/10,15Oct5/10,16Oct6/10.

Ten other14October reservations remain booked/missing attendance. Do not invent their attendance: operator must confirm them before a broader repair. Failure and outstanding impact are recorded in documentation.

## Deployment and verification

Admin stable-v10-clean and public served HTML MD5 `669359151b8bb61584b2b1d6355280d0`,767201 PG characters. Immutable prior backup `backup-admin-before-crm-photos-v270-20261016`, MD5 `08dbaca92cebc85bc648e4570ee5deff`. Guarded source deploy/rollback and repair SQL in supabase/changes. Data correction has immutable before/after audit entity attendance_repair_v270 / hannah-20261014; do not blindly undo after new attendance.

Actual assembled production scope test: grouped booking surfaces, direct lead wait checkbox and RPC persistence, unchanged/text/token image node identity, actual photo version invalidation and fresh-photo no-refetch. Existing group partial failure/pair/taxi/account/busy, CRM SQL/runtime, traffic and customer foreground-photo regressions pass. No real lead state changed for tests, no future reservations approved, no SMS resent.
