# Current-week reminder audience v337 — 21 October 2026

Customer Beta 2.0.19 / build `20261021-week-notice-v337`.

The orange missed-Sunday notice is shown only when the signed-in account has no pending/approved request or booked/attended reservation in the displayed current Monday–Sunday week for any assigned dog. An attended visit earlier in the week counts, so punctual clients are not shown a late-registration prompt later in the week. Cancelled/rejected requests and inactive linked reservations do not count. Previous/next weeks and unassigned dogs do not suppress it. Selecting either dog or both uses the same account-wide decision.

The calendar sets initial hidden state and the design refresh recalculates it from already loaded data after booking updates/cancellation. No extra API queries, stored flags or changes to booking, capacity, cutoff, taxi, pass, admin or notification rules. The separate next-week Sunday 20:00 reminder stays visible.

Validation: actual one/two-dog customer runtime covers pending/approved, staff-created, attended, cancelled+stale request, rejected, prior/next week, dog scope and selection changes, and reappearance after removing registration. Actual Chromium checks registered-owner hidden/unregistered-owner visible and existing layout, taxi, swipe and navigation at 320/360/390/430px and landscape. Physical signed-in iOS/Android remains unverified. No production test writes/messages/push.

Rollback: `backup/customer-before-week-notice-v337-20261021` at `e0db2a19c35695eba006d053079e5c20a272905a`; previous deployment `dpl_74ukMJ9vnuhhJEzWUBj2shP27DQG`. Restore only this customer change while preserving newer independent releases and bump the cache/build coherently.
