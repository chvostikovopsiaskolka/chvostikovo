# Verified cleanup — 2026-10-04

Customer production baseline: 9db5e4086b122a6e7f6e845facde30c5e42a6183 (v145).
Release: 20261004-customer-cleanup-v146.

- Consolidated three independent active-terms document readers into one concurrent,
  account/token-scoped read with a 60-second cache, explicit refresh and retry after
  errors. Acceptance records and historical document/PDF reads remain separate.
- Moved the final runtime-injected visual patch verbatim into the end of styles.css,
  retaining cascade order and removing its unnecessary startup listener/style node.
- Removed two unused local variables; settings relocation now avoids rewriting or
  reappending an unchanged logout button.
- Service worker reuses build-stamped assets from the current release cache. Version
  checks and email confirmation remain network-only; navigation stays network-first.
  Activation deletes only obsolete Chvostikovo shell caches, not unrelated caches.
- Admin snapshot: guarded unchanged weekday text writes. A regression fixture
  reproduces the original self-triggering child-list observer cycle (10 rounds) and
  confirms the fixed renderer makes no child-list mutations on unchanged input.

Backups: customer-before-cleanup-20261004.bundle; immutable admin Git baseline
93a8d6786d0537e56b5b18d30e5daec971b2a079 and production database snapshot
backup-stable-v10-clean-before-cleanup-20261004 (MD5
55c2a5ce10f75393c8cadd264a522870).

Verification: v143 registration/upload, v144 onboarding/terms UI, v145 automatic
upload/onboarding/Android install regressions; new v146 cache/read/DOM regressions;
11 admin inline scripts and all admin/customer CSS parsed successfully. Historical
terms, acceptances, migrations, rollback backups, test fixtures and older versioned
DOM identifiers are deliberately retained: these are not redundant live app copies.
No booking, financial, vaccination, push scheduling or database authorization changes.

Scope limitations: simulated browser regression tests are not a physical-device
iOS/Android test or independent security certification. Supabase reports password
leak protection disabled; this auth setting is outside this cleanup. The earlier
September CDN spike has not been conclusively attributed to the local DOM cycle:
the cycle itself does not directly send CDN requests.
