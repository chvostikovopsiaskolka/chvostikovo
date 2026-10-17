# Mandatory stability contract — Marek, 16 October 2026

The priority is a working public website, customer portal and admin. Complete and verify the current change before expanding its scope.

1. **Read first.** Read current document 00 and the affected functional module, inspect the live source and dependencies, then identify the exact failing boundary. Distinguish reproduced defects from hypotheses.
2. **Backup and rollback.** Retain the exact source/version/checksum before writing. Apply minimal patches with baseline guards. Never overwrite a newer live change or an unrelated draft. Keep rollback instructions with the release.
3. **Public forms must keep working.** Cover enquiries on main/lead/puppy/English and applications for one/two dogs; manual input, silent autofill, validation, server success/failure, recovery and phone correction. Verify INSERT and staff UPDATE/archive under their real database roles. Check all trigger/index helper permissions when changing CRM.
4. **Data recovery is separate.** Diagnostics do not prove saved contact data. Claim recovery only after the contact is persisted and staff can read it. Offline draft storage has explicit limits. Failed attempts do not create successful leads, clients, SMS or Meta conversions.
5. **A stable navigation bar.** The admin's one bottom navigation belongs to the visible viewport across overview, traffic, tab switches, scrolling, foreground, rotation and keyboard dismissal. It must not be attached to a scrolling/transformed content card. Test viewport transitions and preserve existing modal hiding/accessibility rules. DOM tests do not substitute for physical iPhone verification.
6. **Stable photos.** Do not clear or remount an unchanged decoded photo on unrelated refresh, foreground or signing-token renewal. A real new photo version must invalidate it. Check one/two dogs, owner/account changes and real photo replacement. Do not claim persistence against operating-system cache eviction.
7. **Actual admin runtime.** Execute the fully assembled HTML/scripts with actual lexical scopes and delegated handlers, including late plugins. Reproduce the old defect and verify the corrected served artifact. Do not inject fake global helpers that hide scope errors.
8. **Visible analytics.** Web overview: total/ad traffic cards, dated line chart, four page groups, source donut, CTA clicks and form progress visible together. Only optional technical details may be collapsed. Campaigns: spend/click/impression/reach trends; visuals inside the chosen campaign. Do not call events unique people or summed daily/ad reach unique interval reach. Missing data stays missing.
9. **Safe tests.** Use clearly synthetic fixtures and rollback database transactions for writes. Do not send customer SMS, push, emails or Meta conversions merely to test layout/formatters. Confirm no synthetic operational data was left behind.
10. **Evidence and documentation.** Verify the live checksum/source and relevant data/response/UI boundary, then update the existing functional paragraphs and the current identifier in 00; add one historical entry to 07. Report exactly what passed and what remains unverified. 'Deployed', 'automatically tested' and 'observed on the user's phone' are different states.

Existing invariants: owner scope, shared-pass atomicity, per-dog attendance counts, individual/bulk approval validation, vaccination gates, CRM attribution/root identity, consent, idempotency and SMS delay/correction remain authoritative. Do not change them as collateral work.

## Layout and reporting contract (v287)

- One document scroll owner for main sections. `.app` uses `100svh` as a minimum, never a forced content height or accumulated viewport offsets.
- `#bottomNav` is a direct child of `body`, fixed to the safe bottom with a horizontal centering transform only. Never measure its transformed bounds to accumulate another transform. No scroll listener may change navigation translation or document height.
- Main content reserves the measured navigation height plus safe bottom/gap once. Individual sections must not add another navigation-sized footer. Modal/detail scrollers remain isolated; preserve existing chat/detail hiding rules.
- The safe top has a fixed background mask. Inputs and modal grids must have zero minimum inline size; warnings wrap inside the form. Keep styles for a system after the predecessor styles, rather than installing competing JS patches.
- Reapply the active statistics view synchronously after every stats render and on resume. The active label and visible content must always agree.
- Vaccine drafts, new-proof flags and retry files belong to account+dog. Never accept unchanged photos as a new proof; dates (including optional L4) use one server transaction. Upload failure must retain the draft. Do not clear existing decoded photographs on unrelated refresh.
- Chart gaps mean unavailable data, never zero; future days have no actual values. Daily visits use real visit records including free entries and exclude synthetic/cancelled/no-show reservations. Earlier monthly totals must not be expanded into invented daily values.
- Revenue charts reuse `revenueMonth`: daily single count × existing price, purchases on `purchased_on`, taxi and hotel in annual totals. Do not count pass consumption as a sale.
- Meta status in daily metric rows is observed at import, not historical daily activity. Label this uncertainty. Status is independent of spend; do not hide zero-spend active ads. Report summaries include all campaigns for the period.
