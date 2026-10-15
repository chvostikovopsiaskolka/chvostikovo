# Customer v254/v255 — verified LIVE 2026-10-15

Final customer Beta 1.0.89 / build 20261015-two-dog-booking-v255, production SHA 8be76df7bf1ed926eb751690c216e56136744153 (PR44 + PR45). Vercel dpl_2ecjna43vrbUydAX9atumFR7HTpN READY. Customer API v57 ACTIVE, admin-push v26 ACTIVE; both exact source readbacks matched deployment inputs. Public app/version/helper/styles HTTP200 with exact-source equality. Admin snapshot remains v253 e8fc02fdd98e98accf81a01f9ea38422 (this release does not update admin HTML).

## User-visible changes

- Crop editor keeps only the top gesture instruction; duplicate bottom caption removed.
- Empty vaccination proof message: Na dokončenie nahrajte fotografie očkovaní z očkovacieho preukazu.
- Touch highlight/callout/text selection disabled on button surfaces and child icons, including modals outside #appView. Focus is cleared before native photo picker; keyboard focus-visible stays. Text entry/selection is preserved in inputs. Vaccination proof editor keeps existing individual replacement/upload behavior; editor text wraps instead of overflowing.
- Two-dog overview has two adjacent square photos with names and each dog's entry/pass, vaccine status, visit count and gradebook button underneath. No chip selector plus duplicate large photo. Photo/name opens that dog's existing details editor; vaccine/visit controls remain individual. One-dog layout unchanged. Completed-today pass remains visible; queued pass is labelled planned and validity retained.
- Booking picker offers Bella / Iris / Obaja psíkovia. Both sends one atomic/idempotent transaction, creates two pending requests per selected day and consumes two capacity places. Existing staff approvals/cancellations remain independent per dog. Combined list shows both dogs' reservations with dog names. Taxi is chosen per dog/day; the second dog's taxi defaults to none.
- Mandatory vaccination/proof, ownership, cutoff, closure and capacity checks run separately through the exact existing portal_request_booking function. Entire submitted multi-day pair rolls back on any failure. Chronological planning uses the existing individual pass model; no new purchase is created.
- School terms are consciously accepted once by this account for the same recorded owner. Authorized other dog receives a same-version/hash/time acceptance linked to the source via private.owner_terms_copies_v254. No transfer to another account/owner, no replacement of original history. Existing valid same-version acceptance is synchronized lazily in one RPC instead of the former read. Future newly linked dog of the same owner can inherit the existing valid consent on onboarding.
- One staff booking push event covers both names/all submitted days. Existing single-dog notification remains compatible. This uses the existing booking_batch suppression/event mechanism; no trigger containing credentials was read or edited.

## Database and tests

Additive SQL: 20261015200808_owner_terms_pair_booking_v254.sql, atomic execute_sql BEGIN/COMMIT. No apply_migration history entry; reconcile migration history before future CLI push (v251 also already LIVE without its history entry). Adds private idempotency/consent audit tables and nullable private booking_batch_push_events.dog_ids; new authenticated RPCs validate auth.uid and scope, explicit grants revoke PUBLIC/anon. Security advisor INFO for private RLS/no policies and generic WARN for deliberate authenticated SECURITY DEFINER wrappers reviewed; each wrapper has auth and scoped checks. Existing business/vaccination functions were compared unchanged before deployment.

PASS: native 70-table schema PGlite tests (2 places, capacity1 rollback, one-dog missing/expired vaccination or proof rollback, foreign dog, duplicates, same-key replay/no extra request/event, taxi per dog, multi-day pair, individual pass/no purchase, owner terms hash/consent/copy/audit/idempotence/second-owner isolation); actual picker JSDOM (two IDs, per-dog taxi, lost-response retry same UUID, one-place prevention); overview stable photo nodes/per-dog action/one-dog/current-versus-queued pass; full index/app/helper boot; JS/TS parsing; grouped and legacy push text. LIVE anonymous negative RPC checks and exact source/version/deployment readback passed. No test customer reservations, owners/dogs, visits, sales or SMS were created in production. Owner-consent copies happen only as customers use authorized sync/acceptance RPCs.

Not verified: physical iPhone/Android/native picker visuals, signed-in browser E2E/real push delivery, two independent PostgreSQL connections. The mobile tap fix is a code-level fix pending physical confirmation, not a claim that an actual device was tested.

## Rollback

Primary: restore customer backup branch backup-customer-before-v254-20261015 at 9a4e41625b2aa5908ddb8694a27096a6c5079c36 (Beta1.0.87/v246), or revert PR45 then PR44 and verify Vercel production. Keep API57/admin-push26 and new RPCs/tables/column: they are backward-compatible and retain pending pair requests, source-linked consents and audit. Do not delete consent or booking history. API56/admin-push25 exact originals are in supabase/backups/v254, but reverting API would strand cached newer clients; prefer forward repair. Scoped authorization must never fall back to API55. Emergency pair stop: supabase/changes/disable-pair-booking-v254.sql revokes new pair RPC execution only, then repair/restore grant after validation. No DROP/rewrite of data.

Shared permanentka remains unfinished draft #41, not LIVE. Pair booking currently bills existing individual passes/single/free entry per dog. Before continuing #41 rebase on customer v255, API57/admin26 and scoped/linking schema v251/v252; never run the old combined draft migration against this schema.

Reproduce: npm ci --prefix tests/shared-v244; node tests/customer-v254.mjs; node tests/customer-v254-ui.mjs; node tests/customer-v254-boot.cjs.
