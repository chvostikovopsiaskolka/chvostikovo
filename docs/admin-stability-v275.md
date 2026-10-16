# Admin stabilization v275 — 16 October 2026

## Reproduced defects and correction

The live v273 HTML (MD5 66f5ff1b4ae2ac53c850200376f85a23) included traffic-v266 as a standalone script. In the actual assembled runtime it throws `cmSafeV71 is not defined`, because that helper and campaign state belong to the main async closure. Prior isolated traffic tests fabricated globals and therefore did not catch the integration failure. The existing graphic presentation is now installed inside the actual main scope, before auth registration. The later v119 report plugin is adapted after DOMContentLoaded so it cannot restore the old presentation.

Web statistics show two KPI cards, a dated line chart, four colored page columns, source donut, button-style CTA counts and form/field progress below one another. Main/lead/puppy/English filters and date range use the existing staff-only traffic RPC. No nested sections hide the main metrics. Campaign overview and chosen-campaign detail show spend, link click, impression and daily-reach charts together; visuals remain inside the chosen campaign. Report keeps its emoji and compact cards. Counts remain events/page openings, and reach is a daily/ad sum, not unique people. The graph viewport is narrowed for readable mobile labels.

The admin bottom nav was already a direct body child with fixed positioning, not a content-card child. User screenshots show a viewport drift; exact native iPhone cause was not reproduced. Added a measured correction against VisualViewport bottom, with scroll/resize/foreground/focusout and geometry events, no polling/page scrolling/photo remount. It unwinds the correction as the native position returns, skips pinch zoom, and respects existing hidden/modal rules. The app minimum height uses stable viewport units. Physical iPhone keyboard/resume/rotation geometry remains unverified.

Admin-push v26 used only record.dog_name. v27 reads up to two names from validated raw_payload.dogs with legacy first-name fallback; application title uses singular/plural and body includes both names. Lead count/title/tag and authorization stay unchanged; a lead with dog names also includes them. No SMS templates are changed and no test notification was sent.

## Checks

- Full assembled script execution reproduces the OLD ReferenceError and boots the NEW artifact without JS errors, without invented global campaign helpers.
- Actual delegated handlers: Web/Campaign tabs, page filters, campaign open/back, visible graphs/CTA/forms, selected creative detail and late report adapter pass with synthetic and current read-only staff RPC payload.
- The same runtime check passes against the downloaded LIVE frontend response, not merely the local builder.
- Existing group approval, direct waiting-for-application control, decoded image node identity/token renewal/version invalidation and recovery rendering tests pass against the NEW artifact.
- Measured nav transitions cover initial drift, native restore, keyboard-sized viewport/offset, focusout and pinch. Physical device behavior is not simulated by these tests.
- Actual push formatter covers one/two dogs, legacy, empty entries, lead count/tag and no delivery calls.
- Public form regression: 260 React submissions/autofill cases, error/attribution/detail conversion and recovery checks pass.
- LIVE SQL in ROLLBACK covers service_role lead + two-dog application INSERT, CRM link, one-use corrected phone, original +2min SMS deadline and destination, preserved CRM link and authenticated active-staff archive. is_test=false deliberately exercises the real linking branch; all names/numbers are synthetic and the entire transaction rolls back. is_test=true is intentionally excluded from automatic linking.
- Existing customer previous/current/manual booking-history regressions pass. Customer source/build, booking/pass/vaccination semantics, form Edge28 and CRM functions were not changed.

## Live release and rollback

Admin stable-v10-clean / staging-admin-stability-v275-20261016: MD5 e598134cb674e673e06c5daf61c1e94a, 774791 Postgres characters. Public frontend response matches exactly. Backup-admin-before-stability-v275-20261016 retains MD5 66f5ff1b4ae2ac53c850200376f85a23. Guarded stage/deploy/rollback SQL in supabase/changes.

Admin-push27 ACTIVE with exact source readback; verify_jwt=false and existing internal authorization unchanged. Prior26 source saved in supabase/backups/admin-push-before-v275.ts; restore as a new version only if current source still matches this release. Existing delivered notifications are not rewritten or resent.

The compressed exact v273 HTML is committed in supabase/backups/admin-before-v275.html.gz. The v275 builder no longer depends on an untracked parent-workspace baseline, so the new build is reproducible from the checkout. AGENTS.md and STABILITY.md codify the mandatory release checks; Google Docs00/03/05/07 are updated with current scope/evidence/limitations.
