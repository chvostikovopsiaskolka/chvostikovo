# Compact reservation header v339 — 21 October 2026

Customer Beta 2.0.21 / build `20261021-compact-header-v339`.

The redundant top heading/chat/X row is visually removed so the green My reservations section starts at the existing safe top. The original hidden title and close handlers remain for accessibility naming and existing Menu/Overview/swipe behavior. The inner green section heading remains. The repeat-days prompt now occupies 100% of the carousel width instead of an 88% flex basis; original question, two side-by-side actions and selection-only submission behavior are unchanged.

CSS layout patch plus coherent build/cache bump. The customer picker swipe resolver permits its specific hidden close control and reuses the original guarded close handler; other modal close visibility/dirty guards remain unchanged. Current-week notice audience, security access guards, booking, taxi, pass, photo, consent and admin/backend behavior are unchanged. Existing actual customer runtime one/two-dog tests and Chromium 320/360/390/430px plus landscape cover the removed row/no blank space, actual previous-week prompt width, original actions, modals, swipe and navigation. Physical signed-in iOS/Android remains unverified. No production test writes/messages/push.

Rollback: backup/customer-before-compact-header-v339-20261021 at 7ce3819de781a1c1f31fdef6f654bcf88c7ad8bf; previous deployment dpl_BAiXLTu2x2fdmrjxRfUuEACGc7wG. Restore only this customer layout while preserving newer independent changes and bump the cache/build coherently.
