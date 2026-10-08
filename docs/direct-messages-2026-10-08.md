# Direct messages — Beta 1.0.20

Admin dog profiles now expose the existing chat below the phone number. Multiple linked customer accounts have an explicit recipient selector; suspended accounts are excluded. Conversations are created using the existing unique customer key and staff RLS, without overwriting an existing conversation.

Customer chat is accessible above the bottom navigation on every authenticated tab, with the unread staff-message count. The existing modal fills the visual viewport and accommodates keyboard resize, smaller message text, and a composer growing from one to four lines before scrolling. The internal seven-day retention note is removed from the modal; retention is unchanged. Incoming messages in an open chat are marked read with concurrent requests deduplicated. The send handler now reads the nested message returned by the existing API.

Admin chat uses the same compact composer and visual viewport sizing. Existing portal_messages notification and push triggers, private account conversations, booking flows, and realtime are reused.

Validation: app.js and sw.js syntax, all 11 admin inline script blocks, focused behavior checks for composer sizing, unread/read state, scroll, recipient filtering, two-account selection and conversation creation. Existing LIVE customer code matched the production branch; admin snapshot backup saved as backup-20261008-before-admin-direct-messages. SQL update uses the prior snapshot MD5 as a concurrency guard. Real-device push delivery and iOS/Android keyboard appearance require device verification; browser automation was unavailable in the runtime.
