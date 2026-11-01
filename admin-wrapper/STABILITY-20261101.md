# Admin stability investigation — 2026-11-01 (unreleased)

Baseline admin-wrapper-production: f86b30d (PR272). Chvostikovo Edge frontend fetched HTTP200; actual stable snapshot key stable-v10-clean, v402, DB md5 4ec38036d564e3f32102c5b2ca6b9822. Original downloaded UTF-8 SHA256 ff9255d91b4e5da2f4266121902a18c660110796fcd4993d7d4058fb0cd994fa. Original and candidate retained locally outside repository in web-tools. Never deploy a candidate without checking current production checksum.

Confirmed boundaries:
- Wrapper replaces the document with the Chvostikovo HTML; original picker/controller does not survive. SW has push/notification handlers, no fetch cache handler.
- leaveApp omits closeAdminSettings, leaving the settings dialog and html scroll lock.
- Both loading phases contain competing fixed inset and explicit vh/dvh sizing. Bellaris viewport has accumulated declarations with fixed inset then height:100dvh/bottom:auto. Candidate consolidates one inset-owned grid with sibling dock; render repeated scroll/resize tests pass, physical iOS not yet verified.
- Bellaris wrapper overview contains three unwanted KPI cards; candidate removes them and moves projects first. This wrapper has no inquiry deletion action: delayed deletion must be investigated in the standalone portal, not attributed to this module without evidence.
- Archived school week 26–30 October has 38 visits = 8 single + 28 pass + 2 free. Confirmed revenue is null. 2 recorded pass sales have prices totalling EUR400; this is NOT proof of received payment. No crm_payment_receipts_v324 rows in that period. daily_financials has 4 count-based rows and taxi amount EUR15. Do not treat these as a complete payment ledger.
- Weekly report month uses device current month, not selected archived week. Legacy revenueMonth single visits × EUR25 is an estimate and cannot be labelled confirmed revenue. Candidate explicitly displays missing confirmed payments; no historical DB edits.

Candidate tests: wrapper picker tests pass after replacing old structural CSS expectations; layout Chromium 320/390/430/844 repeated scroll + viewport resize pass; guarded pure source transformer tests pass; assembled candidate 32 inline scripts parse. Runtime/auth/account regressions and actual iPhone remain required. Calendar pure contract tests cover 28/29/30/31 days, year boundary, Bratislava date, measured zero vs missing vs future; not yet integrated or released.

Open scope: full loading and logout/relogin render/auth flows, cross-workspace repeated session retention, revenue accordion keyboard/arrows/scroll, actual payment linkage, canonical engine calendar integration and isolated consumers (portal/Wetpet), mutation race/invalidation, analytics event inventory, deployment/CI/LIVE/wiki. NO production change has been made.

Rollback: source patches remain candidates. For wrapper revert final release commit via PR to admin-wrapper-production and existing chvostikovo-app deployment only (root admin-wrapper). For snapshot retain original stable HTML under a new backup key atomically before conditional update of stable-v10-clean, restore only against candidate checksum to avoid overwriting concurrent releases. Never roll back operational payments/passes or customer portal.
