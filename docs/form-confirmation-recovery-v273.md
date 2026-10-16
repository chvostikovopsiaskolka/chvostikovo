# Form confirmation and recovery v273 — 16 October 2026

## Previous gap

Only leads displayed LeadPhoneReceipt and received a one-use phone-edit token. Applications had neither UI/token nor correction eligibility, and SMS was immediately available. Error alerts stored diagnostics only; they did not preserve contact identity or submitted fields. Earlier blanket assurances were incorrect. The lost19:46attempt cannot be reconstructed.

## Phone confirmation

Both lead and application share LeadPhoneReceipt, including the explicit correct-number question and existing edit workflow. LongForm keeps submitted phone/token and displays the shared component after success. Its enclosing Header/Info/Story modals no longer auto-close before editing. Both SMS types become available at original creation+2minutes. Existing15-minute, one-use token correction accepts lead/application, changes the same submission and pending/failed SMS destination without shortening the deadline. Sent/processing SMS history stays unchanged and no duplicate is sent. Generic correction email wording now covers both form types. Existing past outbox jobs are not rescheduled.

## Recovery

After server validation and before the primary insert, the Edge saves an independent operational copy to public.web_form_recoveries_v273 using service_role. It keeps name/contact/interest, source and a validated business payload, excluding raw tracking metadata and the phone-edit hash. On a failed main insert, response truthfully reports recovery_saved and the saved record is marked server_error. Failure produces no conversion/SMS. Primary insert trigger resolves matching contact+type recoveries in the last24hours and clears the duplicate payload.

The client separately preserves failed contact submissions, including client validation/backend/network failures when a valid contact and consent are available. This uses the same allowlisted Edge endpoint with recover_contact action, not analytics or Meta. Contact-only fallback cannot create a normal lead/client or SMS. While sending, a minimal contact draft is staged in sessionStorage; if both requests fail, it stays in that tab for up to24hours and retries on page load/online. A successful form or acknowledged backup clears it. A recovery request checks for an already-saved exact attempt to avoid a ghost failure after a lost response.

Offline limits: the server cannot receive a contact when no request reaches it. In that case only the tab's local minimal draft exists; closing/clearing browser session data can lose it. No claim of universal recovery during total DB/network/browser failure. Full application fields are preserved in server backup only after valid server receipt; local fallback stores minimal contact/interest, not health data. Earlier lost attempts are not recoverable.

Table RLS permits only active staff SELECT/handled_at UPDATE, service_role insert/update and no anon/customer access. Staff cannot rewrite contact/payload fields. Successful duplicates clear payload; all recovery rows expire after30days via daily job web-form-recovery-retention-v273. No new CRM/Meta events from backups.

## Admin

Neúspešné odoslania is available within Záujem o škôlku and above the existing application/lead cards, with count, name, phone, email, date, type, saved fields, refresh and explicit Označiť ako vybavené. Initial load, modal open and foreground refresh it. Received-only in-flight rows wait60seconds; explicit failures show immediately. Read errors display visibly. It is separate from actual leads/clients and conversion statistics.

## Verification/deploy

Edge full-handler mocks: tokens for both types, recovery-before-insert, failed insert retains data, no false conversion/SMS, honest failed backup, contact-only action and dry_run with no side effects. Client tests: staged/offline draft, online acknowledgement, consent and clear-on-success. Canonical form tests via local Jiti/React/VM adapter:260React submissions and application question in success DOM,8foreign prefixes, attribution/alerts and conversion-detail regressions. TypeScript passes. SQL synthetic fixtures in ROLLBACK prove2minute application delay, one-use edits, updated pending SMS destination, retained deadline, staff visibility and customer denial. Actual assembled admin main scope proves initialization, rendering and recovery contact visibility. No real SMS or personal contact POST used for tests.

Web-form-submit28 ACTIVE with prior27 backup. Admin expected MD5 66f5ff1b4ae2ac53c850200376f85a23/771534PGchars; prior backup-admin-before-form-recovery-v273-20261016 MD5 7060e5acc2a672a4a061bbe3aac8a158. Verify Pages workflow and public JS after main merge; physical mobile/operator click and actual SMS delivery remain unverified. No customer PWA/pass changes.
