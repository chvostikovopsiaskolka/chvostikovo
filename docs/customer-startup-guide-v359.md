# v359 — startup recovery, guide welcome, telemetry build

Baseline: customer production `510cabbd4609d2e3884a6b996c596dbdced22818` (v358 / 2.0.33), deployment `dpl_4qFMCPwsyCj5qcmGCUiFFYhW8yQu`.

The guide welcome has no extra brand label. Start remains the main orange action; Skip is plain smaller text below it. The same skip button moves back into the progress header during the five steps. Focus order, replay and account eligibility are unchanged.

A transient cold-start bootstrap failure previously displayed the login form although the saved session survived. Now it displays a recovery card with Retry. Existing visible app data stays visible when refresh fails. Retry is a read through the existing single-flight bootstrap; normal foreground/online recovery can retry the recovery screen with the existing five-second lifecycle throttle. No polling or operational write retry was added. Invalid/revoked credentials still return to login; logout and account-change guards remain. PWA update checks remain enabled.

Incident at 13:03 Bratislava on 23 October: PostgREST PGRST002 schema-cache errors, cache loaded again at 13:03:57–59. Auth refresh returned 200 at 13:03:39, no logout or invalid-refresh events in 12:58–13:08, all eight active profiles retained preexisting server sessions. This proves no global session deletion, not the visible state on every phone. The underlying cause of the PostgREST outage is unconfirmed.

A second confirmed defect explains missing admin diagnostics: v357 shortened APP_BUILD to `v357`, also used by the telemetry configuration. The existing collector accepts only the dated build contract and returned false. A telemetry POST returned HTTP200 at 13:03:59 but the incident window contains no stored trace or admin alert. v359 uses a separate dated internal telemetry identifier ending in the actual APP_BUILD; menu remains v359. No collector, alert trigger, admin source, DB grant or schema change is needed.

Verification:
- Complete customer startup runtime: expired/valid session, shared refresh, network/503/revoked, delayed logout/account switch, unexpected401 fallback, storage modes and expiry guards pass.
- Added real schema-cache503 → recovery → Retry/foreground → app tests, with stored session retained and no polling. Existing visible app stays visible.
- Actual assembled app + bundled SDK in Chromium exports failed bootstrap traces with the valid build and no tokens, identifiers or raw error text. Retry opens app without credentials. Recovery screenshot inspected at390px.
- Existing PGlite collector reproduces short-build rejection and accepts the actual current app telemetry build.
- The actual Chromium SDK packet was passed to the LIVE collector under an existing authenticated customer role in one ROLLBACK transaction. Short v358 rejected; corrected packet persisted and created one alert per span per active staff. Assertions passed; rollback/readback left zero v359 probe traces. No test pushes sent.
- Guide full runtime1/2dogs and all five steps/skip/replay/gates/photo paths pass. Chromium320/360/390/430/844×390/1280 for1/2dogs passes welcome hierarchy,44px Skip, transparent background, spotlight/card containment and stable nav after close. Welcome screenshot inspected.
- Physical iOS/Android behavior and lockscreen push receipt are unverified.

Rollback: backup/customer-before-startup-guide-v359-20261023 points to baseline. Restore/selectively revert frontend after checking newer releases. Restoring v358 also restores its telemetry-build defect; prefer a targeted forward repair. No data rollback or session reset. No pass, booking, payment or notification fixtures committed.
