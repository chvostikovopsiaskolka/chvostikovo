# Customer v367 / 2.0.42 — bounded read transport recovery

Baseline: live `308b828e6ca415f2076a7970200bf25d58373831`, v366 / 2.0.41, Vercel `dpl_3JLYoSqrAhUK1cx5VR1EeDS7sAdw`. The Liquid/profile changes are preserved.

## Incident evidence

The user's notification screenshot shows two v364 alerts. Production telemetry at 2026-10-23 17:49:40 UTC (19:49:40 Bratislava) contains one `request.error` for `edge/customer-portal-api` (TypeError, HTTP status 0, 939ms), followed by `operation.error/customer-operation` at the same received timestamp. They describe a transport failure and its failed operation, not evidence of two independent business defects. No message/body/account data is stored in this telemetry.

Server logs show subsequent customer API GETs returning HTTP 200 at 17:49:42.996 and 17:49:46.628 UTC. The failed browser request has no HTTP response; these logs do not establish whether the underlying cause was mobile connectivity, the browser, or an intermediary. A nearby PostgREST timeout log is not proof that it caused this client event. Do not claim that every future network failure is prevented.

## Change

Only read-only customer API GET transport failures (`TypeError`/`NetworkError` from fetch or response-body reading) receive one recovery attempt after 350ms. A healthy read remains one request. HTTP errors, aborts and application/parser failures are not automatically retried by this helper. Offline/hidden pages do not start the recovery request. Before the second request, the existing session guard refreshes if needed and the account is checked again; logout or account changes stop it. Existing 401 handling, shared read-only quote recovery, bootstrap singleflight, persistent session, recovery screen, foreground refresh and PWA update rules remain.

POST mutation transport failures are never replayed by this helper. Booking/message/payment requests and idempotency rules are untouched. Original telemetry remains active; a recovered GET does not throw a second operation failure. No new polling or normal-path requests.

## Validation

`tests/customer-read-recovery-v367.cjs` loads the actual assembled app and covers healthy reads, first fetch/body transport failure, persistent failure, HTTP503, application error, offline/hidden, logout/new account during delay, and a failed message POST issued exactly once. Existing full session/startup suite and complete workflow must pass on final source. Browser profile/calendar/inbox checks retain the previous Liquid release behaviour. Synthetic browser fixtures only; no production test messages or push.

## User-authorized test permanentka

The explicitly requested own-profile preview was added after verifying owner/dog identity and absence of any unconsumed active/queued pass. A guarded transaction was first exercised in ROLLBACK, then committed: 10 entries, 0 used, active, 23 October–23 December 2026, purchase price 0, purchased_on NULL, existing `test_shared_v257` source. Existing reservation rows, visit count and payment receipt count were asserted unchanged; the existing owner scope includes the pass. No paid confirmation or Meta purchase was generated. Private `shared_audit_v244` contains the before-state and created row under entity `customer_ui_pass_preview_v367`. Record IDs/owner identity remain in the private audit, not this public source file.

Rollback the UI using immutable branch `backup/customer-before-read-recovery-v367-20261023` (the baseline SHA above) or selectively revert this release if newer changes exist. Data rollback is independent: inspect the private preview audit and remove only its matching unused test pass if no usage/dependencies have since appeared. Never remove a used pass or its audit automatically. Physical iPhone/Android transport recovery and rendering remain unverified until observed.
