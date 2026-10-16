# Stable vaccination thumbnails — 16 October 2026

Baseline: customer-portal-production c97f253d3d7269a91ca3b6bbc7f9396ab1b77d97, Beta 1.0.91 / v258. Backup branch backup-customer-before-stable-photos-v259-20261016 points to that exact commit.

Release 1.0.92 / 20261016-stable-vaccine-photos-v259. Frontend only; v258 notices/PDF controls and v254 text wrapping retained.

Root cause: both renderVaccProofEditorV244 and renderVaccinationProofsV104 replaced their entire grids with innerHTML. The editor ran this before and after every single-photo upload. Additionally each response refreshed signed URLs for unchanged photos. This recreated all image elements despite sending only one new photo.

Fix: reconcile both grids by proof ID within account/dog scope. Preserve unchanged image nodes and their src for the same storage path, including when URL signatures refresh. Viewer clicks resolve the latest URL from current state. A replaced ID updates only its existing slot; other photos retain their order. Existing add control is retained. Busy controls update in place. Account/dog changes remove prior-scope nodes. Authoritative server proof list and existing upload action remain unchanged.

PASS: actual async single upload with one payload image; unchanged image node identity and zero src mutations in editor and overview; replaced slot; fresh URL used by viewer; failed upload and busy recovery; append; account isolation; full app boot; v258 notice/PDF regression; update checker; JS/SW syntax and diff checks.

Limits: simulated network/image upload in JSDOM, no production test upload, no physical iOS/Android or rendered browser QA. Chromium remains unavailable after earlier truncated download. No DB/Edge/admin changes.

Rollback: revert this release PR, or restore baseline through the normal customer production deployment route; preserve newer unrelated commits. No data rollback needed.
