# Chvostíkovo Android — Capacitor preparation

Status: **prepared for testing; not a signed Google Play release**. Source baseline:
customer PWA candidate v394 / 2.0.69 (28 October 2026), based on
production `3159725685584014b50b912e09995b2d68fcebfd`. Earlier v360/v361 APK/AAB files
are obsolete. Every subsequent Android file must be rebuilt after shared changes.
The production PWA and database are not changed by building this directory.

## Shared source and repeatable builds

Use Node 22+ and Java 21, Android SDK platform 36 / build tools 36.0.0.

```sh
cd mobile
npm ci
npm run sync
npm test
npm run android:debug
```

`scripts/build.mjs` copies an allowlist of current customer files from the repository
root. It never copies admin, server code, backups, customer records or signing keys.
`native-runtime.js` is added only to the mobile HTML. There is no `server.url`: UI
code is bundled locally, while existing authenticated APIs still use Supabase.
The PWA service worker and its release-marker reload are skipped only in native
mode. The PWA continues to use its existing updater. Keep shared changes in the
root source; never edit generated `www` or Android assets manually.

Android `versionName` and `versionCode` are read directly from root `version.json`
(v394 -> code 394, name 2.0.69). Use a newer shared build number for each Play
upload. The build cleans old output, includes the optical engine's runtime assets
and records shared plus packaged SHA-256 hashes and the Git source commit in
`mobile-build.json`. Packaging tests verify source parity and vendor references.
This does not publish or update an already-installed APK automatically: sync this
branch with the current production source, test, rebuild and distribute each release.

The GitHub Actions workflow produces a **debug APK** and an **unsigned AAB**.
These are compile artifacts, not evidence of device testing or production readiness.
Debug sideloading may show Android installation warnings. The intended customer
distribution route is Google Play internal testing.

## Windows / Android Studio — local build verified 28 October 2026

**[TEST / device observation, not release approval]** On a Windows notebook,
branch `feat/capacitor-android-v361` at `eb209bc`, the v392/2.0.67 native
**debug APK** was built, found on disk, installed and opened on a physical
Android phone. `assembleDebug` reported `BUILD SUCCESSFUL` (156 Gradle
tasks in 4m35s). This is NOT a signed AAB, successful Google Play upload,
confirmed FCM delivery or regression pass for all customer flows.

### The actual failure chain and durable prevention

- Android Studio first attempted **Gradle 8.14.3 with JDK 25**; change Gradle
  JVM to **JDK 21**. A working local JBR 21 was under
  `$env:USERPROFILE\.jdks\jbr-21.0.11`. PowerShell still required
  `JAVA_HOME`; Android Studio's own JDK setting did not populate that shell.
- `npx`/`node` were initially unavailable: install an appropriate Node.js
  LTS and reopen the terminal/IDE. Tested: Node 24.22.1 / npm 11.19.1.
  In PowerShell, `npm.cmd` / `npx.cmd` avoid script-execution policy issues.
- `npm.cmd ci` installed 102 dependencies using the existing lockfile.
  It also reported three *moderate* advisories, a `uuid` deprecation and an
  `esbuild` install-scripts warning. These were not resolved/audited by the
  successful debug build. **Do not run `npm audit fix --force`** as a shortcut;
  review `npm audit` and build dependencies separately before release.
- Initial Gradle sync lacked
  `android/capacitor-cordova-android-plugins/cordova.variables.gradle`:
  use Capacitor sync, do not create a dummy Gradle script.
- Direct `cap sync android` failed because `www/index.html` was absent;
  the canonical build is **`npm run sync`**, which runs the shared asset
  builder, copies the approved icon, then synchronizes Capacitor.
- The builder repeatedly failed on `vendor/liquidlens/liquid-glass.js`,
  `vendor/simple-liquid-glass/webgl.js` and
  `vendor/liquidlens/chvostikovo-paws.png`. Root cause was **Git sparse
  checkout** allowing only `.github`, `docs`, `mobile`, `system`, `tests`
  while omitting tracked `vendor` files. `git ls-files -v -- vendor/...`
  showed **`S` (skip-worktree)**. After preserving local work and checking
  Git status, `git sparse-checkout disable` restored the complete checkout.
  The next build succeeded: **v392; 36 allowlisted shared files**.
  Do not solve this by downloading missing assets one by one, by generating
  replacement pictures, or by editing the allowlist to silently omit assets.
  Sparse checkout may omit other required root files without an immediate
  error; verify a complete source checkout before every reproducible release.

### Repeatable local Windows path (do not deploy production)

From the root of the Android-source Git checkout, first verify branch, commit,
dirty state and source parity with the designated production PWA. **Do not
discard local drafts, untracked files, `google-services.json` or signing
materials**. A `.codex/visualizations` checkout is temporary; create a
separate durable checkout before relying on it for future Play builds.

```powershell
git status --short
git branch --show-current
git rev-parse --short HEAD
git sparse-checkout list
git ls-files -v -- vendor/liquidlens/chvostikovo-paws.png
# If vendor is skipped (S), review local changes/backups first:
# git sparse-checkout disable
cd mobile
npm.cmd ci
npm.cmd run sync
npm.cmd test
Test-Path .\www\index.html
cd android
$env:JAVA_HOME = "$env:USERPROFILE\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
& "$env:JAVA_HOME\bin\java.exe" -version
.\gradlew.bat assembleDebug
Test-Path .\app\build\outputs\apk\debug\app-debug.apk
```

Required: **Java 21 / compatible Gradle JVM**, Android SDK Platform 36 and
matching Build-Tools/Platform-Tools; correct existing Firebase
`google-services.json` in `mobile/android/app` (gitignored). The actual
test used `npm.cmd run build`, then `npm.cmd run sync`, then Gradle. The
full `npm.cmd test` suite above is a **future requirement**, not a test
claimed as completed during this manual session. The debug file is
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

### Physical Android observations — OPEN (28 October 2026)

**[USER-OBSERVED ON DEVICE; NOT FIXED/NOT VERIFIED RESOLVED]** The installed
v392 debug APK opens, but the following must be reproduced, scoped and tested
on physical devices before a Play release:

1. Scrolling appears to stretch/overscroll text and allows motion past the
   actual end of content when notices are below the fold. Inspect WebView
   scrolling ownership, Android overscroll behavior and native/HTML heights
   without breaking access to the last announcement or the fixed bottom nav.
2. Device auto-rotate was enabled, but the app did not rotate to landscape.
   Check manifest/activity configuration, WebView, device policy and actual
   rotation behavior; do not assume the manifest is the only cause.
3. Grey bands cover the top status area (clock/battery) and bottom Android
   gesture/navigation area. Test edge-to-edge/window insets, SystemBars,
   theme status/navigation bar colors, icon contrast and background on the
   same phone. Do not hide OS controls or apply global Web CSS patches blindly.
4. **Notifications toggle cannot be enabled.** Native runtime calls
   `customer-native-push` to subscribe its owner-bound FCM token; on
   28 October 2026 the deployed Supabase Edge Function listing did **not**
   contain that slug. This is a deployment/configuration *blocker to
   investigate*, not proof of the sole cause: also verify Firebase project,
   Google Services package, permissions, registration callbacks, backend
   secrets, RLS and actual registration/delivery. No production push/schema
   rollout is implied by the APK build. Test only with a synthetic/authorized
   device/account; never broadcast test notifications to customers.

**Acceptance before internal Play testing:** no scroll overrun or viewport
occlusion; portrait and intended landscape policy explicit; visible,
high-contrast status/navigation controls; toggle can register/unregister
only its own device; foreground/background FCM delivery, tapping the push,
logout/account-switch and duplicate PWA/native subscriptions tested;
authenticated reservation/pass/notice flows regression-tested. Confirm
`mobile-build.json` source SHA and Android versionCode/versionName against
the **current** customer production baseline. Verify signing, App Links and
a signed AAB separately; a debug APK is never production readiness.

**Rollback / scope:** this section records diagnostics and procedures only;
it does not change deployed PWA, Android code, Supabase, Firebase or Google
Play. Retain `eb209bc` and the original APK as build references; when
repairing native code in the future, keep an isolated commit and revert only
that change if new device regressions occur. No `git reset --hard`,
`git clean` or forced push on the user's active checkout.

## Native integrations

- App ID: `sk.chvostikovo.app`; display name: `Chvostíkovo – psia škôlka`.
- Existing maskable icon reused, no new logo. Android backups disabled.
- System insets handled natively, keeping the existing viewport/nav layout.
- System back calls the existing guarded close actions; at root it minimizes.
- Resume uses the shared refresh-before-API path; pause closes Realtime and flushes
  existing telemetry. No new polling loop.
- Native notifications use FCM, explicit permission, owner-bound registration,
  bounded/coalesced synchronization, unsubscribe on logout, and a notification channel.
- App Links accept only exact HTTPS customer callback paths. Tokens are never put
  in logs or persisted in callback markers; a SHA-256 marker prevents launch loops.
- Google Play checks are throttled to five minutes on foreground entry. A notice
  in Menu opens the app's Google Play update page. Sideloaded debug builds may have
  no Play update status. This does not force every user to update immediately.
- Existing JavaScript/request telemetry is retained. Native JVM crashes/ANRs are
  **not** covered by the browser SDK and still require native monitoring setup.

## Firebase — required before customer distribution

1. In a Firebase project owned by the operator, register Android app
   `sk.chvostikovo.app`. Download `google-services.json` and place it at
   `mobile/android/app/google-services.json` (gitignored).
2. Enable FCM HTTP v1. Create/configure an appropriately scoped service account for
   sending messages. Store its JSON **only as a Supabase Edge secret** named
   `FIREBASE_SERVICE_ACCOUNT_JSON`. Never place it in the app, git, chat or Actions logs.
3. Review and apply `backend/native-push.sql` once. It creates an RLS-enabled,
   service-only token table, with no anon/authenticated table grants.
4. Deploy `backend/customer-native-push.ts` as `customer-native-push` with companions
   `security-v336.ts` and `fcm.ts`; it explicitly validates the Supabase user and
   existing blocked-account/rate-limit rules. Gateway `verify_jwt=false` is required
   with the current publishable-key setup; authorization remains enforced in code.
5. Fetch the **current LIVE** `admin-push` entrypoint and its companion files. Run
   `node scripts/prepare-push-dispatch.mjs LIVE-index.ts CANDIDATE-index.ts`, review
   the isolated diff, add `native-dispatch.ts` and `fcm.ts`, then deploy with the
   usual source/hash backup guard. Existing web push is preserved. Without Firebase
   configuration this added dispatch returns without new database requests.
6. Test permission deny/grant, background delivery, token refresh, logout and account
   switch on physical Android with a synthetic test account. Do not send test pushes
   to ordinary customers. Watch for duplicate reminders if both PWA and native push
   remain enabled on the same phone; turning off the old PWA subscription is a
   separate user-controlled migration step.

Backend files in this directory are **not applied or deployed automatically**.
No Firebase project/service-account configuration was available in this session.

## Verified e-mail links

The manifest accepts `https://app.chvostikovo.sk/`, `/index.html` and
`/email-confirmed.html`. After Play App Signing is configured, take the **app signing
certificate SHA-256 fingerprint** from Play Console (not only the upload certificate).

```sh
node scripts/assetlinks.mjs AA:BB:... # supply the actual complete fingerprint
```

Publish the generated JSON as `https://app.chvostikovo.sk/.well-known/assetlinks.json`,
with HTTP 200, application/json and no redirects. Include any separately used test
signing certificate only if desired. Confirm Android domain verification and test
the complete Supabase confirmation/recovery e-mail flow on device. Existing Auth
redirects use the existing customer HTTPS origin; do not change unrelated redirects.
A browser-originated redirect does not guarantee automatic handoff on every browser;
physical testing remains required. Without installed app/verified association the
web fallback remains available.

## Signed Google Play release

Keep the upload keystore outside the repository and back it up. Set these variables
in the build environment, never in committed Gradle files:

- `CHVO_KEYSTORE_PATH`, `CHVO_KEYSTORE_PASSWORD`, `CHVO_KEY_ALIAS`, `CHVO_KEY_PASSWORD`
- `CHVO_NATIVE_PUSH_VERIFIED=1` and `CHVO_APP_LINKS_VERIFIED=1` **only after actual tests**

Then `npm run android:bundle`. The preflight deliberately blocks an unconfigured
release. The shared build number must increase for each Play upload; Android reads
it directly as `versionCode`. Current candidate uses code 394 and versionName 2.0.69.

Upload the signed AAB to Google Play internal testing, add testers' Play Google
accounts and share the opt-in link. They sign in with existing Chvostíkovo credentials;
Google Play account and Chvostíkovo e-mail need not match. Internal testing is limited
to 100 testers; it remains a testing distribution channel.

## Rollback

No production change is needed to remove this preparation. Close the draft PR or
revert only its commit; do not revert later unrelated PWA releases. If native backend
is subsequently activated, preserve token-table audit/privacy requirements and
disable native delivery using server configuration; do not restore an old full
admin-push over newer fixes. Never reset booking, pass, attendance or payment data.

## Mobile refinement v393 — 28 October 2026

- Shared v393 login/registration, loader, selected-day priority and real-visit week selection.
- Android portrait policy in the manifest; existing Capacitor native system/IME insets retained.
- WebView overscroll stretch disabled without disabling normal content scrolling or touch handlers.
- Explicit white window/system background and dark icons; Android 10+ contrast scrims disabled.
  The previous DayNight window background was used by Capacitor SystemBars for native inset areas.
- Smaller system splash uses the approved existing artwork. No artificial loading delay.
- FCM carries the existing account-scoped message/article URL and notification tag. Native taps use
  the existing shared recipient/conversation/onboarding guards; arbitrary URL navigation is rejected.
- Windows tests use fileURLToPath and isolate the missing-configuration preflight from local Firebase files.

Verification: native runtime/backend/policy/package/dispatch tests and isolated PostgreSQL schema checks;
JDK 21 / SDK 36 debug compilation. No Android device was connected to adb. System-bar appearance,
keyboard gestures, background/terminated delivery and App Links require a physical test. The server
FCM secret is being supplied by the operator; missing backend activation is tracked in the release
wiki. This is a debug candidate, not a Play publication or proof of delivered notifications.

Rollback: retain the previous v392 APK and its source branch. Reinstalling older debug code may need
an Android-approved version downgrade; do not uninstall or clear customer data as a routine rollback.
PWA rollback is separate. Native push server rollout must preserve existing web push and token privacy.

### Backend activation — 28 October 2026

Deployed `native_push_devices_v393` (additive, service-only/RLS), `customer-native-push` v1,
and `admin-push` v42. Deployed files read back identical; missing/invalid bearer both return 401;
no synthetic device remains (count 0). Firebase server secret is still to be supplied by the operator.
Full assembled webhook tests preserve web delivery/copy/targets and skip native lookup without FCM.

Fresh LIVE `admin-push` v41 backup: `supabase/backups/admin-push-before-native-v393.ts`,
SHA256 `521f6d8a3d60e5f103c0f7e9c3bbd977b335331761960ba32e7955ba43196829`, with companion security backup.
Rollback native dispatch by deploying those exact v41 sources only if v42 has not received newer
changes. Preserve the device table and existing web subscriptions. Never put tokens or Firebase
service-account contents into Git. Sending/receiving is unverified until a synthetic device account
can register with the configured secret and foreground/background/terminated scenarios are observed.
