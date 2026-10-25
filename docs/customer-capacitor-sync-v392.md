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

Validation: local 10 native/package tests and current release contract passed.
Final CI compilation and regression results must be recorded before delivering
new Android files. Older v360/v361 artifacts are obsolete.
