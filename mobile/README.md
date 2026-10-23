# Chvostíkovo Android — Capacitor preparation

Status: **prepared for testing; not a signed Google Play release**. Source baseline:
customer-portal-production `af169c978538c5c00ebc01dc44253bc562138337`, customer v360 / 2.0.35.
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

The GitHub Actions workflow produces a **debug APK** and an **unsigned AAB**.
These are compile artifacts, not evidence of device testing or production readiness.
Debug sideloading may show Android installation warnings. The intended customer
distribution route is Google Play internal testing.

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
release. Increment Android `versionCode` for each Play upload and keep versionName
aligned with the shared release. Initial versionCode is 1.

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
