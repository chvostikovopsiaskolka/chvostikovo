# Android Capacitor preparation — 23 October 2026

**Prepared, not deployed.** Production remains customer v360 / 2.0.35 at
`af169c978538c5c00ebc01dc44253bc562138337`. No Google Play release or native
push delivery is claimed. Rollback: discard this isolated branch/PR; production
PWA/admin/DB are unchanged.

The Android project uses Capacitor 8.5.3 and shared root assets, with native-only
push/App Links/update/back/lifecycle adapters. Native mode skips the PWA service
worker/release-marker reload; ordinary PWA behavior is preserved. The app is
packaged locally, not pointed at a remote `server.url`. There are no changes to
booking, taxi, cancellation, vaccination gates, pass usage, payments or CRM logic.

Prepared server files are not deployed: service-only RLS token table; authenticated
native subscription endpoint; FCM HTTP v1 sender; guarded helper to add native
dispatch to the **latest** admin-push. Firebase configuration, upload signing and
Play signing-domain association are required before customer distribution.

Tests: existing customer startup/recovery, 1/2 dog design/booking/taxi, six-step
guide and confirmation-return suites passed locally. Native tests cover trusted
callback paths and replay marker, pause/resume/back, coalesced push registration,
session-before-subscribe, logout unsubscribe, explicit disable, endpoint auth/
blocked access/owner binding and release preflight. Existing telemetry metadata
contract is retained. Physical Android/iOS and actual Firebase push are unverified.

GitHub Actions run 39956938313 successfully compiled the debug APK and unsigned
release AAB from commit `6db893cf3f933b46fc5294592e73b40d542a91e8`
(tree `8c3518a32fed7c539265a2c4ab26e1c5ae6c254b`). Artifact
`chvostikovo-android-preview` (12503356326) contains the APK (6,430,274 bytes),
AAB (4,740,851 bytes) and shared asset hash manifest. Downloaded ZIP SHA-256:
`7877c82b3d8b25644a3e34d031c5e1839ac24242f0f476ea36c96606ec780da0`.
The earlier SDK setup failure was corrected by explicitly requesting current
platform/build-tools packages instead of the removed `tools` package.

The separate admin stability CI run 39956938237 passed. The actual browser
customer telemetry regression also passed locally: boot 503 -> recovery ->
privacy-filtered SDK packet -> manual retry without login. A compiled artifact
does not establish physical Android behavior or actual Firebase delivery.

Draft PR: https://github.com/chvostikovopsiaskolka/chvostikovo/pull/162

Detailed setup and exact outstanding prerequisites: `mobile/README.md`.
