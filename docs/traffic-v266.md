# Admin Návštevnosť v266 — 16 October 2026

Replaces the Kampane presentation with Web / Kampane. Existing admin workflows and customer PWA files are unchanged.

Web defaults to all pages. Two KPI cards show page openings and openings with meta_paid/google_paid source; these are events, not distinct people. A dated line plot follows the selected interval/page. Four colored columns compare Hlavný web / Lead / Šteniatka / English (English is no longer merged into WEB). Source donut, button-shaped click rows and form/field activity follow. Internal navigation remains its own source. /hero-test is excluded. Form events remain events; abandonment is labeled last field, not proven lost customers. Stored contacts retain the existing test exclusion rules.

Campaigns shows a compact summary and dated selectable metric chart. Visuals are only inside the selected campaign, as independent disclosures with existing click/video metrics plus new reaction/engagement metrics. Historic spend is retained. Reach is explicitly labeled as a sum of daily/ad reaches, not unique interval reach. Missing metrics remain a dash; partial historical engagement/reaction sums are suppressed.

Daily reports use the same compact cards and charts; report history/read notifications remain intact. Web date and Meta day are kept separate by the small campaign section date. Meta data may use a prior imported day; report query reads seven previous days for that case. No unrelated status timestamps, Beta copy, technical footers or instructional text are shown.

## Production

- public.frontend_snapshots stable-v10-clean: MD5 `5994fec60a130478defbfb1920af14f3`, 753604 Postgres characters.
- Backup backup-admin-before-traffic-v266-20261016: MD5 `e0cd8f3987a9b90bc17032e3a39c5484`, 725211 characters.
- Final staging staging-admin-traffic-v266-final-20261016 matches live.
- Additive staff-only RPC admin_traffic_dashboard_v266(date,date), migration 20261016134528. No anonymous EXECUTE; customer role rejected; active staff verified.
- chvostikovo-marketing-meta-sync v5 adds post_engagement/post_reaction from existing Meta actions. Cron schedule/authorization unchanged. Manual cron-equivalent 30-day read/import succeeded: run30, 300 ad-day rows, 2026-09-16 through 2026-10-15; both new metric keys in all300 rows.
- Existing report publication/notification schedule and stored report history unchanged.

## Verification

28 script blocks parse. DOM tests cover two tabs, paid/total totals, four pages/EN, date axes, campaign/creative isolation, visual disclosure, report fallback/missing data. Full Meta handler fixture verifies existing metrics and new action fields. Staff SQL read agrees with raw English path count18 for1–16October; customer denied; anon privilege false. All browser requests are read-only analytics.

Cloud browser cannot reach the local preview server (connection refused). Physical signed-in iPhone/Android visual QA remains unverified. No guarantee is inferred from parser/DOM checks.

Rebuild with tools/build-admin-traffic-v266.cjs. Guarded publish SQL and rollback are in supabase/changes. Rollback only if the live checksum matches; keep imported metrics and additive RPC. Restore the prior Edge source from supabase/backups/meta-sync-before-v266.ts only if rolling back that importer is necessary.
