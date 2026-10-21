# Booking spacing v340 — 21 October 2026

Customer Beta 2.0.22 / build `20261021-booking-spacing-v340`.

Remove the redundant “Rezervovať miesto v škôlke” CTA from the empty overview reservation card, retaining its heading and Sunday reminder. Preserve the “Moje rezervácie” action when actual reservations exist beyond the displayed range. Add 10px to the reservation page's existing top padding (20px + device safe-area top), keeping the compact hidden header and full-width repeat-days prompt.

Existing customer one/two-dog runtime and Chromium 320/360/390/430px plus landscape verify the empty overview, small top inset, existing repeat-day/modal/taxi/swipe/navigation behavior. No changes to booking, pass, security, audience rules, photos or admin/backend. No production test writes/messages. Physical signed-in devices remain unverified.

Rollback: backup/customer-before-booking-spacing-v340-20261021 at 41bd0395b4cf63d2bb6cc7b038cf1ae8d778c688; previous deployment dpl_C94g26itoP2Mawa85TzRFtj1sSjb. Restore only this customer change while preserving newer independent changes and bump cache/build coherently.
