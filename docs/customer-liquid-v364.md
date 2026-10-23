# Customer v364 / 2.0.39 — Liquid surfaces and message preview

Release candidate based on the verified live customer commit `2f212bc669cdeda1960a4b2b9797a78c38d9236b` (v363 / 2.0.38). Before editing, all eight served app-shell files matched that Git commit and Vercel deployment `dpl_EpWXRLX2aKs8tFy6CuW4m6UwuhRX` on `app.chvostikovo.sk`.

## Scope

- Overview and Reservations share a warm peach background with static white paws. Milk-white surfaces have light borders, soft shadows and a small 4px blur enhancement; opaque defaults and reduced-transparency fallback remain readable without blur.
- The dog profile retains its existing font, photo, name placement and one-/two-dog structure. It has a solid pink/blue interior, white frame, filled gender-coloured names and an inner milk-white information panel instead of a divider.
- The standalone single-entry overview card is removed from the DOM. Active and queued passes still follow the existing renderer. Bookings remain directly after the compact inbox buttons when no pass is present. Entry accounting and reservation labels are untouched.
- Phase 1 announcement archive, per-user receipts, badges, existing chat and explicit push navigation are retained. Announcement detail heading and close button share a vertical centre.
- Only `staff_message_customer` notification formatting changes: title Chvostíkovo; actual notification-record message body, whitespace/control normalization and Unicode-safe 240-character preview, with a generic fallback. Content never enters the navigation URL or new diagnostics. Existing recipient-scoped subscription selection, icon, notification tag and dispatch path remain unchanged. Device settings control lock-screen preview visibility.

No migration, RLS change, new polling, realtime connection, operational API request or second chat system is introduced. The separate native Android draft has no active FCM integration; this release does not rebuild or publish it.

## Validation and release gate

Run `node tests/customer-release-contract.cjs` first, followed by every step of `.github/workflows/admin-stability.yml` against the final candidate. New DOM tests cover absence of the single card/gap, active/queued pass transitions, one/two dogs, menu/logout styling scope and unchanged operational data. Push tests execute the complete Edge handler with synthetic payloads, mocked subscription delivery and the actual service worker, including preview, fallback, recipients and startup/login deep links.

`tests/customer-liquid-browser-v364.cjs` exercises actual assembled scripts in isolated Chromium at 320/360/390/430px, landscape 844×390 and desktop 1280px for one/two dogs. It covers sex colours, filled names, long names, profile frame, pass transitions, calendar layout, announcement heading alignment, reduced transparency, unsupported-filter fallback and stable navigation. Phase 1 inbox browser tests retain archive/read/badge/chat/back coverage. Android/iPhone user agents in Chromium are layout simulations, not physical platform verification.

No synthetic production message, push or business record is created. Physical iPhone PWA, Android PWA, OS notification preview/delivery, native FCM and device-specific resume/update remain unverified until observed on devices. The historical guide demo's internal 12px calendar overflow at 360px under container fonts was reproduced on both v362 and v363; it is outside this isolated change. Guide DOM regression and the relevant inbox guide step are tested separately.

A successful build is not proof of LIVE operation. Merge only after full GitHub CI is green for the last candidate SHA, using customer-portal-production. Verify the resulting production SHA, Vercel READY deployment/alias and byte equality of served files; verify the deployed Edge source separately. Record actual outcomes in project documents 00, 02, 05 and one release entry in 07 after verification.

## Reproducible rollback

Immutable Git backup: `backup/customer-before-liquid-v364-20261023` at `2f212bc669cdeda1960a4b2b9797a78c38d9236b`. Restore/revert the isolated release through customer-portal-production and its normal Vercel path; do not rewrite branch history. The former production deployment is `dpl_EpWXRLX2aKs8tFy6CuW4m6UwuhRX`.

The same backup contains the exact former admin-push v40 sources (`supabase/functions/admin-push/index.ts` plus unchanged `security-v336.ts`), matching live entrypoint checksum `e90c0b3a4d2ce76053ca3d106aa514d9454608640fd968fd7c979c65e3357e97`. Redeploy those two files with the existing `verify_jwt:false` webhook/user authentication contract to roll back the preview independently. There are no database changes to undo. Recheck served sources, release contract and aliases after rollback.
