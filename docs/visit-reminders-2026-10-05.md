# Visit reminders — customer v148 / admin production

- Staff-only dog setting: SMS (default), both for testing, or push instead of SMS.
- Pilot: Bella (77, Marek account) and Bella Jr. (58, Richard account), push mode.
  All other dogs retain SMS. Mobile contacts remain unchanged for emergencies.
- Scheduled at 19:15 Europe/Bratislava on the day before a booked reservation.
  Pending, cancelled and cancellation-requested bookings do not receive the push.
  Linked active accounts with active push subscriptions receive the reminder.
- Names use existing dogs.sms_name with dogs.name fallback. No gender-based guessing.
  Taxi is included when booked. Pass reminders direct owners to entries/validity in app.
- Existing portal notification webhook delivers pushes. Unique user/event key prevents
  repeated enqueueing for the same dog/day. Private scheduler/preview functions cannot
  be executed by anon or authenticated users.
- Existing sms-reservations feed removes only push-mode dogs with an active linked
  profile and subscription. Missing active push falls back to the unchanged SMS feed.
  sms-intro-visits is untouched. Both mode intentionally retains SMS and adds push.
  An active subscription is not a physical-device delivery guarantee; no automatic
  SMS retry is promised after an individual push-provider failure.
- Customer booking picker now displays planned entry numbers for each successful
  pass booking, across multiple days, before any last-entry renewal prompt.
  Booking/cancellation deadlines and pass accounting are unchanged.

Backups: admin snapshot backup-stable-v10-clean-before-visit-reminders-20261005,
MD5 687e9e5f89e064a27b71a255e000f926; original sms-reservations v9 source in backups.
Database migration visit_reminders_1915_pilot_channel recorded as 20261005062157.

Tests: SMS default/both/push modes, inactive profile and absent-subscription fallback,
unauthorized SMS feed, multi-day entry summary, one-time renewal handoff; admin
selector persistence/error restore; all admin scripts parsed; SQL insertion and
duplicate suppression tested inside rolled-back transaction (no test pushes sent).
Read-only preview selects Richard's Thursday 2026-10-08 reservation for Wednesday
2026-10-07 at 19:15. Marek's Bella has no future booked visit until he adds one.

The SMS Apps Script formatter itself was not retrieved. Its existing Edge feed
response shape is preserved, so the exception works without changing its caller.
Current plan quota/billing was not verified; no claim of unlimited/free operation.
