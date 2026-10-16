# Customer resume and shared passes — 16 October 2026

Baseline: customer 1b1d57c9db2a0424069f53ee4e954db479295908, 1.0.92/v259; customer-portal-api57; admin stable-v10-clean e8fc02fdd98e98accf81a01f9ea38422. All 22 baseline business function hashes match the prepared shared draft backups. No wholesale merge of PR41 or stale customer UI.

Release: 1.0.93 / 20261016-resume-shared-passes-v260. Backup customer branch backup-customer-before-resume-shared-v260-20261016. Exact API57 backup and prior business functions are in supabase/backups; DB deployment creates private.shared_baseline_v260 and backup-admin-before-shared-v260-20261016 before changes, guarded by exact hashes. Feature remains disabled until API/admin/customer deployment completes.

## Photos and existing one-dog UI

Existing notification, vaccine editor/text wrapping/stable proof thumbnails, and rules/PDF code is common to one- and two-dog accounts. New DOM tests cover both profile counts on foreground return. Existing image elements and src stay intact through signed-URL refresh, name/sex changes and general resync. Helper preload skips photographs already mounted, including the second dog's photograph. Actual changed photo path/update timestamp replaces only that dog's image. Account scope is part of the key. An OS-killed PWA or a new-release page reload still creates a new document; retained-DOM tests do not claim to control iOS process eviction.

## Shared pass flow

One pass row and two explicit pass_dogs members; one purchase, separate reservations/visits/taxi for each dog. No automatic conversion of existing passes or test credit. In the existing booking picker a two-dog owner can choose Záujem o permanentku, then use the existing interest modal for individual/shared and 10/20. Interest is not a paid sale; staff approval creates one purchase. First actual use starts the two-month validity. Current and queued passes remain separate.

Shared members submit through a locked server allocation quote. 8/10 + both gives 9/10 and10/10. 9/10 gives final old entry and explicit 25 EUR single for the second dog unless a next pass/interest is available. Overflow review and confirmation stay inside the existing picker; its renewal action can request the next shared pass before retrying allocation. Idempotent operation and quote survive lost responses. Old single-dog clients are prevented from silently bypassing shared allocation. Ordinary individual and one/two single-entry bookings keep existing paths.

API bootstrap exposes only authorized member IDs, including a secondary-only account, and checks the feature flag together with memberships in one RPC. Shared balance is reachable from both dogs. Staff UI indexes one pass into both dog views while unique purchase arrays remain single rows; manual planning counts sibling pending/booked entries. Membership and owner-transfer guards preserve history. New objects have RLS and restricted grants. No customer roles may modify memberships or private audit/idempotency records.

## Validation and boundaries

PASS native PGlite: 4/10,8/10,9/10,10/10;18/20,19/20,20/20; capacity/vaccine/ownership failures roll back both; duplicate/replay and stale quote; future allocations; one purchase; two actual visits; no-show/cancellation; projected and actual expiry; staff-only membership RLS; individual20 request remains compatible; bootstrap scope and owner-transfer guard. PASS actual picker DOM, full API handler with transport fixture, initial request retry/account switch, all admin inline scripts and shared indexing/manual plan, one/two-dog resume, existing vaccine/photo/PDF and update regressions. No physical iOS/Android, rendered desktop or two independent real PostgreSQL connections. No production test purchase, credit, booking, upload or push.

## Rollback

Before shared data exists, feature can be disabled and customer UI reverted. Once memberships/redemptions exist, do not restore single-dog-only planners or delete ledger/history. Emergency stop: UPDATE private.shared_release_v244 SET enabled=false WHERE singleton; preserve compatible API/schema/planner. Restore customer through a forward revert and pause shared admin management before reverting its snapshot. Individual business data remains intact. Deployment SQL is supabase/changes/deploy-shared-v260.sql; the prepared v257 migration is retained as source, applied here atomically with v260 amendments. Do not blindly run db push over prior execute_sql-only migrations.
