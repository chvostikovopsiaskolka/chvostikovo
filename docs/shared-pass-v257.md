# V256 / V257 — two-dog follow-up, 16 October 2026

V256 LIVE: customer d7ebdec94b7426d2f74a552554a2251d997771fd, Beta 1.0.90, Vercel dpl_7bgEy3LeTkzZZhdmeqvbyUNYCjSH. Read-only terms migration applied through apply_migration. It groups only existing authenticated user's matching signed version/hash and explicitly scoped same-owner dogs. Original acceptances 25 and 26 remain immutable, with their original separate timestamps. The PDF lists Bella and Iris and the original confirmations. Download/share passes only a PDF File, never url/text; redundant terms button removed. Divider centered, vaccination check/alert reused, both dogs default first, iOS select tap appearance suppressed (physical iPhone verification still required).

V257 prepared against that exact production SHA, API v57 and admin MD5 e8fc02fdd98e98accf81a01f9ea38422. No PR41 wholesale merge. The additive migration reuses only reviewed shared-ledger components and exact current business function backups. V251/V252 ownership scopes and V254 owner consent/booking logic are preserved.

## Model and behavior

One passes row with two explicit pass_dogs rows; legacy dog_id remains the anchor, not a second purchase. Individual passes are unchanged. Owner-pool advisory lock, concrete projected_pass_id, chronological shared planning across pending requests and booked reservations; actual visits retain dog_id, pass_id, reservation_id and entry number. Planned first-use expiry projection is not persisted before attendance. Both 10 and 20 entry products retain current two-month business rule. Server never allocates 11/10 or 21/20.

Shared booking preview/commit is authorized and idempotent, quote checked under locks, all selected dogs/dates atomic. At overflow the existing picker shows the named allocations and 25 EUR single-entry fee before explicit confirmation. No extra modal for routine booking, no silent purchase. Retry retains the same UUID and confirmed quote. Old clients cannot submit shared bookings through legacy single-dog endpoints without checking allocation. Normal one-dog booking remains unchanged.

One deliberate shared renewal interest, one staff approval, one purchase row. Current and queued passes separate; queued validity starts on first actual use. Shared renewal selection offers 10/20. This follow-up does not claim the entire original V029/V030 project complete: initial first-shared-purchase UI for all new owners, signup two-name confirmation, full physical iPhone/Android E2E and all broader original acceptance tests still require completion/validation.

Admin indexes the same pass into both dog views but keeps financial purchases in their original unique pass array. It displays both members and scope on pass requests, and expands the ledger inside the existing pass card. Group approvals are labeled when two pending dogs are processed together. Existing owner-linking design is untouched.

## Tests

Native PGlite fixtures load current production schema/business definitions, V251 scopes, V254 terms/pair batch, then V257. Scenarios: 4/10, 8/10, 9/10, 10/10, 18/20, 19/20, 20/20; future allocation, stale quote, replay, atomic pair capacity/health failure, unauthorized dog, per-dog taxi, two actual visits/one pass, repeat attendance/no-show, one shared renewal purchase and repeat approval, cancellation of one sibling, projected expiry, duplicate redemption guard, test finance exclusion and staff-only membership RLS. Legacy individual 5/10 regression.

JSDOM runs actual picker code for 0/10, 8/10 and explicit split confirmation at 9/10/10/10, as well as lost response after commit (same UUID and confirmed quote). Full Edge handler is executed with mocked transport to check secondary-only scope and real query shape. Existing v254 picker and complete app boot regressions pass. Actual terms history handler shares only files; generated PDF is text-extracted and rendered/visually inspected with embedded Slovak font. Admin inline scripts parse. These are isolated local tests, not physical-mobile or simultaneous independent production-connection tests.

## Rollback

Customer baseline backup branch backup-customer-before-v257-20261016 at d7ebdec94b7426d2f74a552554a2251d997771fd. Earlier v256 backup backup-customer-before-v256-20261016 at 8be76df7bf1ed926eb751690c216e56136744153. Admin backup snapshot backup-admin-before-shared-v257-20261016, MD5 e8fc02fdd98e98accf81a01f9ea38422. Exact prior business functions and API v57 are versioned alongside this release.

After any shared history exists, DO NOT revert the ledger or restore single-dog-only business functions. Emergency stop: set private.shared_release_v244.enabled=false; retain shared planner/finalization and all immutable history. Customer old UI may be restored only with shared booking frozen (legacy endpoint guard prevents incorrect charges); keep compatible API/migration. Admin snapshot restoration requires matching current checksum and pauses shared management; shared financial data must not be deleted. Restore frontend via a forward Git commit, never force-reset production.

## Authorized test entitlement

Requested by Marek for existing account Adriana Konkoľova, verified active user 9e82bb5f-d2b5-464c-966a-efd68de3a3f5, owner76, explicitly scoped dogs87 Bella and88 Iris. Before seed: no passes, no pending/approved bookings, no booked reservations, no visits. Planned seed creates exactly one 0/10 entitlement with source test_shared_v257, no purchased_on or purchase_price, and two explicit memberships. It must be audited and idempotent; never reset an existing pass counter. Validity starts at actual first use; test pass visits carry zero value and are excluded from daily financial calculations, and no sale appears in purchase reports. No real payment is marked received. Final LIVE IDs/checksums must be appended only after successful readback.
