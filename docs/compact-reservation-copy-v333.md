# Compact friends action and shorter booking notice · v333 / Beta 2.0.17

The Overview friends action keeps its one-line8px/7.5px label but uses a22px visible frame centered beside the planned-entry text. This explicitly overrides the older44px minimum. An invisible pseudo-element extends11px above/below the frame, retaining44px touch coverage without increasing the visual row. Original friends handler, keyboard focus and tap-highlight reset remain unchanged.

Monday notice: “Nestihli ste rezervovať miesto do nedele? Kliknite na deň, odošlite žiadosť a počkajte na schválenie. Pri plnej kapacite nám napíšte správu.” The Sunday planning reminder, Monday-only appearance rule and all v332b booking/capacity/day-before19:00 behavior remain unchanged. No DB/API/admin/taxi/pass changes.

Validate full customer runtime for1/2dogs and actual Chromium at320/360/390/430/landscape844×390:22px frame, shared vertical center, one-line fit,44px expanded hit region actually opening the original friends dialog, visible shortened Monday notice, existing taxi/modals/navigation/dirty guards. No production test messages/requests/push. Physical signed-in iOS/Android unverified.

Rollback: backup/customer-before-compact-friends-v333-20261021 at1cd308100645b35c38b09df51ce5128e6e9b1a56; prior Vercel dpl_9SngDs31vC3FinK5UYgpQLGwL2KF. Customer assets only; preserve operational data and inspect newer changes before reverting.
