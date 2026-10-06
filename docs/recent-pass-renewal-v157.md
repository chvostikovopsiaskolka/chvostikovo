# Beta 1 / 1.0.4: recent pass renewal

The first normally bookable day selected in the picker checks the authenticated, dog-owned renewal RPC. Full/closed-day contact handling remains unchanged. A pending interest bypasses the question; a queued pass suppresses renewal. Free-entry dogs are excluded.

An active pass qualifies once all its remaining entries are reserved. Without an active pass, a non-cancelled pass must have expired since the start of the previous calendar week, or its final recorded pass visit must have occurred within the previous/current calendar week. Historical imports alone do not establish a recent final visit. The server also enforces this guard when creating interest.

Yes uses the existing pending interest and chronological reservation planner, without purchasing a pass. The summary labels planned entries from the new pass explicitly. Single-entry and Back do not create interest. Request failures leave the question open for retry, duplicate clicks are blocked, and a closed/reopened picker cannot apply an old selection.

Verification: modal interaction tests; database transaction with recent/old pass fixtures, ownership rejection, duplicate rejection and planned 1/10; existing registration, confirmation, reminder and cleanup checks. Transaction fixtures and webhook queue entries rolled back. Bella's requested live fixture is a used-up 10/10 pass ending 2026-10-02, source portal_beta_renewal_test_v157, price 0, no purchase date. Existing reservations and daily financial records matched the pre-change backup.

Backup: frontend_snapshots key backup-pass-renewal-before-v157-20261006; previous production Git commit be7f37720b9fb086dfc1dbec3156757ee87b7b5a. Terms are unchanged.
