# Customer notices and rules PDF controls — 16 October 2026

Baseline: production d7ebdec94b7426d2f74a552554a2251d997771fd, v256 / published 1.0.90; Vercel dpl_7bgEy3LeTkzZZhdmeqvbyUNYCjSH. Backup branch: backup-customer-before-notice-pdf-v258-20261016 (same SHA).

Release: 1.0.91 / 20261016-notice-pdf-v258. Shared-pass candidate v257 is outside this release.

The dashboard no longer repeats vaccination-expiry reminders above the bulletin board. Unread reminders still appear in the popup, including three simultaneous expiries; actions align right with 44px touch height and smaller text. Dog vaccination status/actions and pass-expiry notices remain unchanged.

Rules modal waits for the existing document, owner PDF history and acceptance reads before becoming visible. No temporary loading sentence or late-inserted PDF panel. Existing account/dog isolation is checked again after asynchronous reads; errors remain readable. PDF buttons use equal grid widths/heights and reset inherited margins; download uses the existing orange primary button. No legal wording, acceptance or PDF integrity change.

Diagnosed update-marker mismatch: version.json and shell were v256, but APP_BUILD/APP_VERSION were still v255/1.0.89. Existing release checker compared against that older constant, potentially causing an unnecessary reload. All markers now agree; no broader startup refactor.

Validation: node syntax app.js/sw.js; full DOM boot; customer-auto-update-v193; customer-v254-ui pair booking and overview regressions; customer-notice-pdf-v258 deferred history, account switch, history failure, three vaccine popup actions/no dashboard duplicate, release-marker consistency. All PASS. Chromium download returned a truncated archive; rendered desktop/iOS/Android and physical devices are not verified. No production test bookings, uploads, acceptances or push messages.

Rollback: revert this release commit/PR to baseline. No DB/Edge/admin change or data migration. Preserve any newer unrelated production changes when reverting.
