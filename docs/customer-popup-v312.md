# Beta 2.0.3 / v312 — dog approval stays push only

Base customer-portal-production 6fec80a1740f4ea9af928ef0500c61e210c9f8be (2.0.2/v311).
Rollback backup/customer-before-popup-v312 or Vercel dpl_3bY13ATG5msKYjg2HQWqxxgJXc6b.

Restore dog_approved exclusion from the in-app notification popup. v310 had unintentionally exposed it while fixing unread badge counts. Keep background push/badge delivery; after onboarding is complete and an assigned dog is present, acknowledge only unread dog_approved IDs through the existing owner-scoped mark_notifications_read action. Coalesce concurrent requests, leave failures unread for later ordinary refresh, and never mutate a different account after an awaited response.

Other notices are unchanged. The current popup is generic for unread/current recipient notices, excluding staff chat, pass-interest acknowledgement, weekly reminders and dog approval. Current producers/records include vaccination expiry/milestones, pass expiry, booking rejection/staff cancellation/day closure, pass request decisions, taxi decisions, announcements, birthdays and visit reminders. Historical stored booking_approved records may still qualify; current production booking approval RPCs create no portal_notifications record and use push only.

Full app runtime 1/2 dogs passed: approval stays out of popup, one scoped read request, badge clears only on success, failures remain unread, other notices remain visible; existing zero-dog onboarding, stable photos, vaccine, taxi and calendar regression scenarios retained. No real notifications or operational test writes. Backend, DB and push source unchanged. Production asset readback required; physical device behavior unobserved.
