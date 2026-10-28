# Android Capacitor synchronization — 25 October 2026

Prepared only; no production or Play publication. Android draft PR162 is updated
from customer production commit `9819732f9063aceef0ec0a833a3b9908e9d9ed0a`
(v392 / 2.0.67), preserving its native-only auth, push, lifecycle, back and update
adapters. Production code, DB and deployed Edge Functions are not changed.

This includes the existing Liquid Glass runtime, Android dock, foreground read
recovery and current vaccination proof UI. Merge conflicts use current production
UI/release/tests while retaining native logout and shared bridge hooks.

Android reads its version directly from root version.json (code392/name2.0.67).
The packaging allowlist includes optical runtime JS/PNG/license files, excludes
vendor source and server code, cleans stale output and records exact source and
packaged SHA-256 checksums. Tests verify parity against the current shared source.
No generated www or native assets are edited manually.

Rollback: original draft head `508078a373facd5bd6d2ab11c3836ecc70ef882f`
is retained as backup/capacitor-before-v392-20261025. Restore only the draft or
revert this synchronization; never overwrite newer production changes.

Firebase credentials, native backend activation, release signing and verified
App Links remain outstanding. Debug APK/unsigned AAB are compile/test artifacts,
not a signed Play release. Real Android/iOS and native FCM flows remain unverified.

Validation: local 10 native/package tests, current release contract, customer
startup/recovery, 1/2-dog design/booking/taxi, six-step guide and confirmation
return passed. Android CI40235700492 SUCCESS; source
`daf1d7493b17d572eaf99069ab7b2eb9e5fa80d2`, tree
`a448e9406485c97d2991af53bf5c77b86a6de5c5`. Artifact12615415037 ZIP SHA-256:
`ef1a404f4ab70d3e8d1d0bc8b2be218fc0d1c07fbac906a04621480605fa3a11`.

Downloaded and inspected both ZIP containers. APK binary AndroidManifest.xml:
package sk.chvostikovo.app, versionCode392, versionName2.0.67. All 37 packaged
files and their shared source hashes match the tested checkout in APK and AAB;
no PWA service worker or vendor development source. APK6,914,415 bytes SHA-256
`273e68a4cce43dae366039dd5ff8d5d6473457b816c59a36a40f1c808588339d`;
unsigned AAB5,214,199 bytes SHA-256
`60c23ca126431664deb0ba7e6063ea8fb2fba86239a9acd522c3a93e99b69f3e`.

CI40235700518: full verify and Chromium/WebKit browser jobs both SUCCESS.
Production source rechecked at9819732/v392 after compilation; unchanged by this
task. Older v360/v361 artifacts are obsolete. Test APK is saved separately as
Chvostikovo-Android-v392.apk; it is not a Google Play upload bundle.
