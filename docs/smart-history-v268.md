# Repeat-day suggestion v268 — 16 October 2026

User decision supersedes v267's target-week-based source selection. Determine the previous and current calendar week relative to today in Europe/Bratislava. Prefer reservations/requests in the previous week; use current week only when previous week has none. Never fall back to older weeks or combine the two patterns.

UI copy:
- Previous source: Chcete rezervovať rovnaké dni ako minulý týždeň?
- Current fallback: Chcete rezervovať rovnaké dni ako tento týždeň?
- Neither source: no suggestion. No source dates are printed.

Use own-dog pending/approved customer requests and booked/attended manual reservations. Existing target-week booking guard, capacity/cutoff checks and explicit submission remain unchanged. The combined two-dog picker remains manual as before; selecting one dog uses the suggestion.

Customer API59 adds booking_history, separate from the upcoming reservations array: only linked/authorized dog IDs, select dog_id/reservation_date/status, from previous Monday through current Sunday, booked/attended only. An unassigned account receives an empty array, without issuing a history query. No schema/permissions/reservation-writing change.

Paddy is existing dog6 and has manually entered9October attended,12October attended,14October booked,15October attended. On16October the previous-week pattern is Friday, so the candidate for a free future week is Friday; this does not create a booking or assign Paddy to any account. Admin linking must select the existing Paddy record to retain this history.

Customer1.0.98 /20261016-smart-history-fallback-v268. API58 exact live source backed up before deployment in supabase/backups/customer-portal-api-before-v268.ts; source readback of API59 must match. Git backup backup-customer-before-smart-history-v268-20261016 points to1db8be6f5a3f72f785e8e2499440a62f9498a396. Admin v267 snapshot6573f74a9902edc5da6d178de4243da8 unchanged.

Tests cover manual-only Paddy, previous priority/current fallback and corresponding DOM copy, no dates, dedupe, canceled/no-show/foreign/old/full exclusions, existing target booking, Sunday/Monday/year boundaries. Full API handler tests scope/bounded dates/history isolation/unassigned account. Existing startup, normal renewal, stable photos, quote-network, update, shared API and admin review regressions pass. No live booking/assignment/decision made during tests; physical signed-in mobile E2E remains unverified.
