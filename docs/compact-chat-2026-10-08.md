# Beta 1.0.21 — compact messaging

Both existing chat modals use a compact, approximately half-screen card. Visual viewport resizing anchors the composer above the keyboard and removes legacy safe-area padding from keyboard space. Customer chat no longer inherits the page-scroll-unlock rule. The one-line composer grows to three lines and uses a circular arrow submit button; duplicate sends are guarded. History position is preserved across refreshes.

The customer floating paper-plane is visible only for unread staff messages and is hidden while chat is open. A legacy CSS rule forcibly hiding the icon was removed. Staff-message popup notifications are excluded; push and other notifications retain their existing paths.

Admin dog profiles display two owner-photo slots even without linked accounts/photos, with full names, placeholders and sex-specific borders. The simulated Bella-only gallery was removed. The visible photo-upload button was removed. A styled message row above the pass expands recipient choices for multiple linked accounts, then opens the existing conversation.

Validation: full customer/admin JavaScript syntax; Chromium rendering and functional tests using mocked network responses at mobile widths 390 and 412 with iPhone/Android user agents; compact size, simulated visual viewport keyboard shrink/restore, composer sizing, send/refocus, unread icon lifecycle, popup exclusion, existing booking notification preservation, two photo slots, recipient selection, duplicate-submit guard and returned message rendering. No browser page errors. These are browser simulations, not physical iOS/Android keyboard or push-delivery tests. No customer test messages were sent to production.

Backups: customer branch backup/customer-before-compact-chat-20261008; admin snapshot backup-20261008-before-compact-chat. Admin update has an MD5 concurrency guard and reuses existing database, permissions and push triggers.
