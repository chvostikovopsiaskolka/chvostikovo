# One customer push per bulk approval — v284,17 October2026

When staff approves more than one distinct date in a single action, the existing admin review uses portal_approve_booking_batch_v284. Individual approval, rejection and taxi decisions retain their existing paths. The server calls the existing approval function for every selected day and preserves capacity, vaccination, permanent-pass, owner and pair validation. Per-day exceptions are returned to the admin. Successful approvals generate one private event; the exact per-day approval trigger is suppressed only within that transaction. A retry has no newly approved IDs and emits no further event.

admin-push v30 reads the exact event IDs and verifies actual approved status and account before formatting names and distinct dates. Five days/two dogs remain five days. No rolling time grouping, old approval replay or status inference. One successful date falls back to the current single-date wording.

Text: “Rezervácie boli schválené 🐾 / Hannah má schválených5 dní v škôlke. Už sa tešíme!” Two dogs: “Bella a Iris majú schválených5 dní v škôlke. Tešíme sa na nich!” Native push provider/device delivery still requires a real customer event to observe; no synthetic customer push was sent.

Verification: rolled-back production-data test5 approvals =>1 private event,0 per-day push enqueues; retry =>0 new events. Partial failure =>4 success IDs only. Staff/nonstaff permissions verified. Full assembled main scope tests bulk/single/partial paths; formatter tests grammar, distinct dates, isolation and empty ignored. History v283 remains working.

Rollback: audit102 stores exact dispatch function and Edge29 source; restore after checking newer versions. Admin backup-admin-before-approval-push-v284-20261017 MD5 518bd0d463dd103cf49e9832fe943983. New admin MD5 29d8a430e6390cdba3d245acb76eaadd. Do not replay existing event rows. Customer PWA/booking requests/reservations/pass balances are not changed by deployment.
