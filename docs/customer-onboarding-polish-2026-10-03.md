# Customer v144

Build: `20261003-customer-onboarding-polish-v144`.

- Email confirmation retains server verification and only renders the result and a request to return to the installed app. Removed the browser return link, repeated installation advice and email display.
- Vaccination proofs use one empty upload tile or one replace button. The native image picker supports photos/camera; selection, processing, retry and five-photo validation are retained. Cancelling a replacement picker leaves replacement available.
- Removed the redundant shared-booking sentence. Approved reservations can be cancelled by another linked owner through the existing ownership-checked reservation RPC. The RPC synchronises approved request rows to cancelled; the cancelling client immediately synchronises its local rows too. Pending requests retain their existing management restriction. Cancellation deadline unchanged.
- Increased reminder text size while allowing wrapping on narrow screens.
- New immutable terms revision `2026-10-03`, customer display `1.0`, hash `d484212c87891e1ff69d206238f79fa3b021fbeb4afec043d82dafda37aa442d`. Only sections 2/4 differ. Historical documents, acceptances and PDF bodies remain untouched. Staged inactive until the matching client is live.
- Weekly reminder retains the Sunday 18:05 Bratislava schedule, enabled-subscription and next-week booking exclusions. Eligibility now also includes booked/completed reservations in the two preceding weeks, in addition to current-week visits. No notification was sent during verification.

Validation: registration/photo audit regression suite and v144 UI tests; JS syntax and git whitespace checks; DB rollback test for linked-owner cancellation and request synchronisation. Historical terms and acceptances compared against a pre-change snapshot. Test-profile reset checked against hashes of every visit, financial row and acceptance; none changed. Physical iOS/Android photo-picker and next Sunday push delivery still require device testing.

Test fixture: historical reservation only, with an explicit test note and no visit or money. Profile identity, account links, future reservations and legal history preserved; onboarding/vaccination details reset for retesting. Private snapshot backed up separately; no private account information committed here.
