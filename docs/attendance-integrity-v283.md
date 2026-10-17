# Attendance integrity v283 — 17 October 2026

The 14 October finalizer failed atomically; later visits reused missing entry numbers. User confirmed all eleven dogs attended. Seven remaining visits were restored after audit66 backup and rollback tests. Result: 11 visits; 226 EUR visit value plus 10 EUR taxi. Individual pass purchases remain separate from visit value. Leraie's 16 October visit moves to existing new pass66 entry1; old pass50 ends entry10 on 14 October. No new sale is created. Aron's 14 and16 October single visits are separate 25 EUR records.

Admin history failed on Menu → Statistics because only bottom navigation initialized the stats tabs. The guarded builder adds initialization to the existing delegated handler, preserving scope. The new in-app warning uses the existing main authenticated client, a staff-only RPC and existing data-ready/focus/resume events with a60-second cooldown. No frontend polling timer.

Private independent watchdog runs every10 minutes. Missing visits, reservation/visit discrepancies, duplicate pass numbers and counter mismatches persist as private incidents. Finalizer wrapper catches exceptions after the failed subtransaction rolls back, retains an operator warning, and keeps the original finalizer. Calendar trigger now also upserts corrected attended records. This is not a guarantee of physical Google client availability or push delivery. Warning is in-app; no new OS push is claimed.

Checks: actual assembled runtime reproduced zero statistics tabs before / three after; history click renders11/20 fixture; warning/error/healthy/cooldown flows PASS. Database rollback scenarios check staff/nonstaff permissions, explicit synthetic-source exclusion, persisted missing-visit incident and wrapper failure. Original operational data restored after tests.

Outstanding: Bella Jr18 September is marked attended without a visit. No fee applies; do not infer attendance without operator confirmation. Paddy9 September has a cancelled reservation with a historical visit;23 September has a Calendar-only event. No destructive cleanup.

Rollback: restore admin snapshot backup-admin-before-attendance-v283-20261017 only if current checksum matches v283. Audit99 stores previous cron4 command and calendar trigger definition. Unschedule chvostikovo-attendance-watchdog-v283, restore cron4 and calendar definition, revoke/drop new RPC/functions as appropriate; keep incidents/audit for evidence. Data repairs use before/after snapshots audit45/66; do not erase later visits.

UI/OS on physical iPhone/Android remains unobserved. No customer forms, auth, PWA, marketing or menu redesign changed.

Follow-up verification also repaired Spirit's October monthly total9→10 to match the ten confirmed visits; monthly source=app discrepancies from September2026 onwards are now included in the watchdog. Complete 14–16 October Google Calendar comparison also fixed Kevin15 October to5/10; no other matched event discrepancies remain in that interval. Original snapshots retained in audit66/99. Admin served MD5 518bd0d463dd103cf49e9832fe943983, HTTP200. CI39016884233 passed and PR74 merged61fcedf06ed86c358eb366e234cfd2bfa80629e9.
