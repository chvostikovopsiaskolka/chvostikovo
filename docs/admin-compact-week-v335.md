# Compact admin reservation rows · v335

Reservation lists reserve columns for avatar, smaller non-wrapping dog name and a single-line metadata/cancellation group. Long names may ellipsize; metadata can shrink within its own column, keeping X on the same row. Original handlers, dog data, restrictions, entry/taxi values and permissions are unchanged. Scope is Week/current-next and Today/tomorrow reservation cards.

General capacity label/value render on one line. Taxi selector uses four equal columns including Bez taxi; its original DOM/hidden input/delegated handler remain unchanged, only grid layout and type sizes change. Buttons retain44px minimum touch height. Build meta advances to20261021-compact-week-v335, preserving the correct canonical update source fromv334.

Validation: actual assembled admin runtime and original taxi/save handlers; actual Chromium320/360/390/430/844×390 exercises original reservationCard, long name, taxi/free entry, same-row X, one-line capacity, four same-row taxi choices and actual clicks updating hidden value. Original grouped-review/update regressions retained. No production reservation, capacity, taxi, pass, approval or notification data changes. Physical signed-in iOS/Android unverified.

Deploy guard: baselineMD54150da4d54264d3f51d790e8c077923a; backup-admin-before-compact-week-v335-20261021 plus staging-admin-compact-week-v335-20261021; two exact replacements, candidate checksum verified in the same transaction before live update. Rollback only after checking no newer source, restore backup HTML; no operational-data rollback.
