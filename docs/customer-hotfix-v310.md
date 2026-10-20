# Customer Beta 2.0.1 — v310

Base: customer-portal-production 282d7ba3d36580b439c4617ecf47107d26e50020 (Beta 2.0.0/v309).
Rollback frontend: backup/customer-before-hotfix-v310; previous production deployment dpl_8sEeLrAa2tGjJN9K14WCoGhDerug.
Rollback push: supabase/backups/admin-push-before-v310.ts, deployed function v33, verify_jwt=false preserved (existing authenticated webhook checks unchanged).

Fixes: no-dog login render no longer dereferences a missing designTicket; assignment resync clears waiting layout and arms a 15s visible waiting-account fallback. Pointer state resets on capture loss, blur, hidden tab, editor reopen/close and new primary touch; single pointer only pans. Approval notifications participate in server/client unread badge counts and can be read through the existing notification popup.

UI: vaccine-proof wording, phone-prefix skip in sequential focus, larger confirmation instruction with home-screen icon, compact dog photos, consistent calendar/Rezervácie heading and pink empty card, larger visit/date and missing-friends/rejected text, centred repeat-days card, nonduplicated empty CTA, larger week labels and reminder below own reservations.

Validation: full app runtime tests with zero/one/two dogs, actual assignment resync, stable friend-photo nodes, empty friends, original vaccine editor, booking/taxi cutoff/chat retention, crop pinch/interruption/reopen and unread approval badge; backend runtime test sends no push. Existing vaccine/photo/push regression suites are run before release. No production operational fixture writes or real test sends.

Physical iPhone/Android pinch smoothness, badge display and viewport sizing require observation on the device; automated runtime coverage does not establish that observation.
