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

The local Java build environment cannot reach dependency servers, while downloads
through the configured HTTP tooling work. Reproducible GitHub Actions compilation
is provided; record its final result before claiming an APK/AAB was built.

Detailed setup and exact outstanding prerequisites: `mobile/README.md`.
