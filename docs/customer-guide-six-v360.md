# v360 — six-step tour using existing reservation components

Baseline: production dfb94dd9a7f9f1c651a5d6a37da0959c8a9a90c3, v359/2.0.34, Vercel dpl_7pLyCjHBzFobQL5HW61GemdWhECD.

The one-dog profile name moves6px right (margin-left−27→−21). Vaccination/visit rows, photograph and two-dog layout stay unchanged.

The optional tour now has six steps: profile; pass/reservations/bulletin together; orange reservation button; existing reservation card or example; two-week selection/taxi example; Menu. Copy explains purchased-pass expiry and used visits, removes the two-dog sentence from the orange-button step, and places calendar guidance in its own step. Welcome and progress use six steps. Existing-account eligibility, recorded state and manual replay are unchanged.

The previous hand-styled example is replaced with the actual reservation template plus the same design-layer roster presentation used by real cards. A shared day-tile template, selected-day renderer and taxi-choice renderer also serve both the live picker and read-only example. Their default parameters preserve live behavior. The preview uses synthetic future dates from two different weeks, two selections, the first taxi disclosure expanded, the second collapsed, and the normal Rezervovať2dni button.

Preview data never enters state.data, selectedDatesV37, taxi maps, availability, requests or API payloads. The tour mounts inert DOM without booking/cancel/taxi event handlers. Real picker content is temporarily hidden via a scoped marker, not replaced; it is restored on Back/Continue/Skip/logout. No duplicated IDs, test reservations, payments, friends or notifications are added. Original data may still refresh while the example is visible.

Calendar-step help uses a compact explanation layout so calendar, both selected rows, taxi options and submit fit together at360–430px portrait. At320px/landscape, the bounded example pane can scroll without changing normal components. Other tour steps retain their original help-card layout. Bottom navigation remains stable.

Validation: full assembled customer-design tests1/2dogs pass real day selection, optional/per-dog taxi, rosters/privacy, shared/individual entry, photos, vaccination editors and existing controls. Full six-step guide tests pass account/onboarding/vaccine gates, skip/replay/logout, back/forward restoration and inert demo-submit; operational data, availability and selected dog unchanged. Notice photo tests pass. Chromium320/360/390/430/844×390/1280 for1/2dogs passes six-step flow, name offset, spotlight/card containment, preview width,44px controls and navigation restoration. At360–430 portrait the complete preview fits without scrolling.390px steps2/4/5 screenshots inspected. Session-startup and telemetry ingestion contract tests pass; actual customer+SDK503→recovery→retry browser test passes with current v360 build. Physical iOS/Android behavior remains unverified.

Rollback: backup/customer-before-guide-six-v360-20261023 points to baseline. Revert only this frontend diff after checking for newer releases; no DB rollback or guide-state reset. v359 startup recovery, internal telemetry build contract and PWA update checks remain intact.
