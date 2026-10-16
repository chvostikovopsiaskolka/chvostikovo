# Booking review and repeat days v267 — 16 October 2026

## Confirmed cause of missing repeat-day suggestion

Hannah dog79 ordered19–23October on Friday16October (five pending requests83–87). Her customer request history includes12–16October, while older5/9October visits were manually recorded reservations and absent from customer request history. The client matched the previous calendar week5–9October based on today's date, so no proposal was returned. A regression reproduces null with the old source.

The client now uses the week immediately before the offered booking week:19–23October uses12–16October, including when ordering on Friday. No older-history fallback, foreign-dog days, or duplicate booking proposals. The offer still only selects dates and requires explicit submission. Existing target-week bookings suppress it. Two-dog combined picker remains manual; selecting one dog retains the proposal. No reservation/ledger/API behavior changed.

Customer version1.0.97 / build20261016-booking-groups-smart-v267; app/index/sw/version synchronized. Backup branch backup-customer-before-booking-v267-20261016 points to94a5a0df5b048b1c65882d8212afbfa9d8460230 (v265 UI, v266 admin sources).

## Admin

Pending bookings are grouped by customer account, dog set and request kind. A single day has direct controls; multiple days use one native disclosure with per-day controls and bulk controls below. Paired dog bookings are one unit per day and keep existing atomic pair approval. Reject remains explicit for the selected row(s). Taxi is separately grouped and routed to the existing taxi RPC. Different accounts never share bulk controls.

Green approve button occupies3/4 of the action row, red accessible X the remainder; bulk approve is filled green. Existing owner approval buttons get the same green treatment. No new modal. Counters count review cards; card shows requested day count.

Bulk processing invokes existing validated RPCs sequentially, not an unguarded direct update. No automatic mutation retries beyond existing auth refresh handling. Double clicks are guarded across review controls. Each success is reconciled; failed dates remain pending with their error, other dates continue. Partial results are reported honestly. Expanded groups survive rerender. Existing pass-interest purchase handling and report/traffic source remain intact.

Live admin final MD5 `6573f74a9902edc5da6d178de4243da8`,764613 PG characters. Immutable backup backup-admin-before-booking-review-v267-20261016 = `5994fec60a130478defbfb1920af14f3`. Guarded source deploy/rollback stored alongside changes; rebuild tools/build-admin-booking-v267.cjs.

## Validation

29 script parser checks; DOM fixtures exercise5days→1dog,1day direct, single rejection, canceled rejection, per-date partial failure, paired approval deduplication, taxi/account scope, expanded state and double-click guard. Smart Friday/Sunday/foreign-dog/exact-week/already-booked regressions. Existing authenticated customer startup, renewal, foreground photos, quote-network/update, and traffic tests pass.

No actual pending customer requests were approved/rejected for testing. Hannah83–87 must remain pending. No database schema or Edge change. Physical signed-in iPhone/Android visual QA remains unverified.
