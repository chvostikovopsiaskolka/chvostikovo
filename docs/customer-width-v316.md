# Customer Beta 2.0.7 / v316: reservation page width

The Android screenshot showed wider page margins in Reservations than Overview. The design picker had a 600px cap, 13px inner padding and inherited the legacy phone modal `max-width: portrait-width - 28px`. Together these added an unintended outer inset before the page padding.

The full-screen design picker now uses the same 820px page cap as Overview, explicitly overrides the legacy modal maximum width, and uses matching 14px normal / 12px mobile gutters. On phones it retains the existing portrait-width reference on rotation, matching the body's established behavior. Calendar frame padding, date tile sizing, text, selected-days ordering, bottom navigation and all booking logic are unchanged. No scaling/zoom workaround; content adapts to available width.

Validation: full customer runtime tests with one/two dogs, actual picker/selection/taxi/chat/vaccine/photo regressions pass; JS/SW syntax and whitespace checks pass. CSS inspection confirms the design selector overrides the legacy phone modal constraint and matches Overview's mobile/landscape gutters. Physical Android screenshot after release remains for the user to verify; no claim of physical-device geometry testing.

Baseline production Git `00297157c24360683485c9fde54e2d74c439fc4a` (PR122 admin release with unchanged customer Beta2.0.6/v315). Backup `backup/customer-before-width-v316`. Baseline Vercel deployment `dpl_9dub11GR46fjc8nyv4KF2qbgzxSb`. Forward rollback/redeploy only after checking newer releases. Admin v321/API61 and all database data remain unchanged.
