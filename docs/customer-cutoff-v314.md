# Beta 2.0.5 / v314 — customer management cutoff 19:00

Base customer-portal-production cbbcf0bdf1fcb7b4ab8ebf37901092a4efb3e454 (2.0.4/v313).
Frontend rollback backup/customer-before-cutoff-v314 or Vercel dpl_29feoAoaLuCRdsZWMYjGHAYrEUZ5. Backend rollback supabase/backups/customer-cutoff-before-v314.sql (three exact live function bodies with SQL statement terminators).

Customer request cancellation, linked/legacy reservation cancellation and taxi change use Europe/Bratislava D-1 19:00, exclusive: 18:59:59 allowed; >=19:00 denied. Database definitions differ only in cutoff/message 21→19 and >→>=. Owner scope, locks, pass replanning, statuses and taxi approval remain unchanged. CREATE OR REPLACE preserves existing ACLs/search_path/definer identity. Deploy with baseline guards against all three captured pg_get_functiondef values in one transaction.

Client cancellation and taxi edit route to prefilled message-only chat from 19:00, without cancelling or creating a booking. Earlier cancellation retains original confirm/API and taxi retains approval form. Sunday booking deadline stays 20:00. General messaging is never time-blocked.

Notice has wider inner area and smaller nonbold text. Actual selected-days heading moves immediately under the calendar before the capacity legend, reads Vybraté dni ↓, hides when empty; selected cards and submit remain in their original section. No automatic scroll on date selection and no navigation geometry changes.

Validation: full actual customer runtime one/two dogs, 18:59 taxi form, 19:00 taxi/cancel message and unchanged booking, original vaccines/photos/chat/popup/calendar tests passed. Full PostgreSQL bodies compiled/executed in isolated PGlite with complete existing schema/helpers and only deterministic clock injection; all three RPCs allowed 18:59:59, denied 19:00/19:01 and foreign owner, test transactions rolled back. No production test writes/sends. Live function/source readback and security-advisor comparison required; physical phone layout unobserved.
