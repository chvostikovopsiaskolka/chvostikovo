# Customer v362 – magnetic noticeboard
Date: 2026-10-23. Baseline: customer v361 / 2.0.36, commit 8855e0912f290c5d6795181954f0198ffd06abf0, Vercel dpl_99a8JXPC5oNk5JRxKzv3s7b1mvyk.
Rollback: backup/customer-v361-20261023-before-board at exact baseline, or selectively revert change on future commits.

Implementation:
- Reuse #customerBulletinV229 and the existing published notice/expanded content/unread/zoom flow.
- Replace cork and brown wood edges with light metallic surface and a narrow graphite frame; hide the original decorative screw pseudo-elements.
- Keep original pastel papers, excerpts, tap/click actions and red unread badge; draw small steel magnets via CSS, without images or extra fetches.
- Reduce single-dog Žiacka knižka label from 13 to 12px while retaining icon, 40px touch target, keyboard outline and coming-soon behavior. Two-dog label stays compact.
- Leave registration, calendar, bookings, roster visibility, vaccinations, permanentka, telemetry and nav untouched. No DB, admin or Supabase change. PWA version 2.0.37/v362 with standard cache bump.
- Android Capacitor remains an isolated draft; sync shared sources and version into it and produce a NEW debug APK, not a Play release. Physical iOS/Android UI and native push cannot be asserted from CI.
Acceptance: existing customer-design, customer guide/session, bulletin and v362 CSS/version tests PASS, Android build PASS if attempted, live Git/Vercel alias plus served-file verification, physical devices pending.

Quality gate updated after first two PR164 failures: version-agnostic carry-forward assertions in v361/v362 visual tests, one early centralized cross-file release preflight, documented in STABILITY.md and docs/release-versioning.md. Do not claim a new deployment from updating tests; exact new commit CI and Vercel evidence still required.
