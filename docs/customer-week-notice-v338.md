# Current-week reminder audience v338 — 21 October 2026

Customer Beta 2.0.20 / build `20261021-week-notice-v338`.

The orange missed-Sunday notice is shown only when the signed-in account has no pending/approved request or booked/attended reservation in the displayed current Monday–Sunday week for any assigned dog. An attended visit earlier in the week counts, so punctual clients are not shown a late-registration prompt later in the week. Cancelled/rejected requests and inactive linked reservations do not count. Previous/next weeks and unassigned dogs do not suppress it. Selecting either dog or both uses the same account-wide decision.

The calendar sets initial hidden state and the design refresh recalculates it from already loaded data after booking updates/cancellation. No extra API queries, stored flags or changes to booking, capacity, cutoff, taxi, pass, admin or notification rules. The separate next-week Sunday 20:00 reminder stays visible.

Validation: actual one/two-dog customer runtime covers pending/approved, staff-created, attended, cancelled+stale request, rejected, prior/next week, dog scope and selection changes, and reappearance after removing registration. Actual Chromium checks registered-owner hidden/unregistered-owner visible and existing layout, taxi, swipe and navigation at 320/360/390/430px and landscape. Physical signed-in iOS/Android remains unverified. No production test writes/messages/push.

Rollback: `backup/customer-before-week-notice-v338-20261021` at `dc5428da3efad209ce1a29cea3c6f7e33322da38`; previous deployment `dpl_74ukMJ9vnuhhJEzWUBj2shP27DQG`. Restore only this customer change while preserving newer independent releases and bump the cache/build coherently.
