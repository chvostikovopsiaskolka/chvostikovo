# Customer reservation layout v336 — 21 October 2026

Customer Beta 2.0.18, build `20261021-reservation-layout-v336`.

The Sunday 20:00 reminder is now the first child of the highlighted two-week calendar. The existing deadline source still owns its text and visibility; the design restores one reminder after each core calendar render. Current-week guidance uses orange highlighting. Overview headings use the same family, weight, size, spacing and line height, and reservations are called “Moje rezervácie”. The ticket validity badge shares the used-entry row above the dashed divider. The board keeps its content and accessible label without a separate visible Nástenka heading.

No booking, pass consumption, taxi, consent, photo, admin or backend logic changes. The existing customer fixtures verify one/two dogs, pass/no-pass, photos, Monday/Sunday guidance, repeated calendar render and booking/taxi flows. Chromium checks 320/360/390/430px and landscape, matching heading styles and metadata alignment, calendar containment, orange notice, modal and navigation regressions. Physical signed-in iOS/Android behavior remains unverified.

Rollback: source baseline `308469d06586aa59a349e477923d4a890818f776`, retained branch `backup/customer-before-reservation-layout-v336-20261021`. Restore only the customer files from that point while preserving newer independent changes, bump cache/build coherently and redeploy the customer Vercel project. Previous production customer deployment: `dpl_9KNk464prA3yNTmtzBfUpnjbKaHE` (Beta 2.0.17/v333). Admin remains its separate v335 Supabase snapshot.
