# Week-specific reservation reminder

Customer Beta 2.0.27 / build `20261022-week-reminder-v351`. Baseline production `e11d991d5cfe158f037e7dbda1c5422edd0de98a` / Vercel `dpl_2E5QGqWu1SesTmNAxjJRua1yK2wv`.

The green planning reminder belongs immediately below “Budúci týždeň”. It includes the Sunday before that week's Monday and 20:00: on 22 October the deadline is 25 October, and from Monday 26 October it becomes 1 November. Calendar arithmetic starts from Europe/Bratislava's current date and uses UTC calendar days, avoiding fixed-millisecond arithmetic across DST.

An existing pending/approved customer request, booked/attended staff reservation, history or visit for any assigned dog in the target week suppresses its reminder. Other weeks, unassigned dogs, rejected/cancelled rows do not. Reuse the existing account-scoped week-booking predicate; do not change booking permissions, capacity, cutoffs, vaccination checks or database. Current-week orange missed-Sunday guidance remains independent and uses its original visibility rules.

The existing core reminder returns its date range/text/visibility to the design renderer. Reattach one element after the matching week's heading on calendar rerenders. If availability advances while the page is open, refresh the rendered calendar locally through the original renderer (no extra API calls). The empty overview reminder uses the same dated text/visibility.

Validation: complete one/two-dog customer runtime, existing reservation/taxi/vaccine/photo/consent/swipe flows; next-week pending/approved/staff/sibling suppression, wrong-week/foreign/rejected/cancelled cases; exact 25 October -> 1 November rollover at Bratislava Monday midnight, autumn/spring DST, December/January; one notice at the matching heading after rerenders. Physical iOS/Android remains unobserved. No production test bookings, messages, push or payments.

Rollback: revert this customer release forward against the latest production or use the baseline deployment above. No database/admin/backend change or data rollback required.
