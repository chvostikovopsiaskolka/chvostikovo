# Customer design staging — V-039

Base: customer production v307, commit 216a658cc0a8d0642b81b16cd313870dc77a3714.
Working branch: staging/customer-design-v305. Production is not released from this branch.

The runtime preserves v307's vaccine gate, menu/social links, editors, booking/cancellation, per-dog taxi and shared-pass calls. customer-design.js/css add the overview, ticket/paws, approved nearest visit, consent-aware roster dialog and vaccine summary. The original board component is retained. The existing picker renders as a reservations page with ten weekday tiles, own bookings carousel and taxi disclosures in selected-date rows.

Staging Supabase: jgzabminzgbfhsrgqedt. App API is copied from the actual production API v60. No customer data export was used. Synthetic Auth users and owners/dogs/passes/booking examples are separately seeded in staging. Login offers Bella (one dog) or Falco/Spirit (two dogs). Demo credentials are intentionally limited synthetic customer accounts, never staff/admin.

stage-config.js supplies staging URL/publishable key, a separate session namespace, test login buttons and a production-Supabase fetch guard. vercel.json allows only the staging Supabase origin. Push subscription synchronization and Realtime are disabled for this isolated design preview; admin-push is a silent staging response and database calendar/admin-push dispatchers return without outbound delivery. Cron scheduler management was denied by the provider; no attempt was made to bypass that permission. Test writes use only synthetic staging accounts.

For production, port the reviewed design and picker changes onto the latest production branch, omit stage-config.js and its script/SW entry, restore the production CSP, choose a fresh version/build and run the acceptance flows. Do not merge staging environment wiring into production. Backups exist at backup/customer-before-design-v304-20261019 and the baseline v307 commit. Rollback staging by redeploying its preceding verified deployment/commit. Production is unchanged by staging deployment.

Initial verification: JS parser passes; existing full-runtime vaccine tests for one and two dogs pass, including old/new proofs, drafts, account/dog switching and save recovery; stable-photo upload tests pass. The older v254 sliced picker test lacks the v307 gate fixture and fails before design code; it is being updated with the new baseline dependency. Further UI/E2E findings will be recorded after the deployed preview is inspected. Physical iOS/Android behavior is not verified by desktop tests.

Synthetic photographs: Unsplash, Atanas Teodosiev (IA0M6Xqda-M), Stephan Hinni (yljkjsy12zo), Shantanu Goyal (CE8q1CL76Pg); stored only in staging Storage for layout tests.
