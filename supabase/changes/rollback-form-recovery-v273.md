# Rollback order

1. Revert the web PR to remove application receipt/recovery callers.
2. Redeploy exact supabase/backups/web-form-submit-before-v273.ts as the next Edge version, retaining verify_jwt=false and existing environment.
3. Restore admin backup-admin-before-form-recovery-v273-20261016 only if current hash is66f5ff1b4ae2ac53c850200376f85a23 and backup hash is7060e5acc2a672a4a061bbe3aac8a158.
4. Restore phone functions from form-phone-before-v273.sql, adding statement terminators if executing concatenated definitions. Existing function grants must remain service_role only for correction.
5. Retain web_form_recoveries_v273 and captured contacts, its staff RLS and retention job. Do not drop real recovery data as a rollback step. Resolution trigger may remain: it has no SMS/CRM/Meta effects and closes matching recovered contacts after real submissions.

A rollback to old receipt-less UI removes application phone editing. Do not claim data recovery continues if old Edge is restored.
