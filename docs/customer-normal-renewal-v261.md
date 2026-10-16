# Normal pass renewal — 16 October 2026

Customer-only correction to v260 (production d0cf1d05795353b33aaaeda58ab239bda7332502). Version 1.0.94 / build 20261016-normal-pass-renewal-v261.

The last-entry question and Later remain in the existing modal. Yes directly requests the normal next 10-entry pass: the current dog for individual passes, both existing members for a shared pass. No additional scope/product chooser on renewal, including individual renewal in a two-dog account. Shared last-entry detection includes the sibling dog; retry reuses the operation UUID and stale account responses are discarded. Initial purchase keeps its explicit existing chooser. Removed the additional renewal button from the price review. Backend/API/admin and billing rules unchanged.

PASS actual app DOM regression: one dog, two individual dogs, shared pool with sibling last entry, Later/no request, direct Yes, one shared pending request, lost-response retry, pending suppression, no early question, account switch. Existing shared picker/request, one/two-dog foreground photos, vaccine photo editor and notice/PDF regressions PASS; app/SW syntax PASS. No physical iPhone/Android check or production test transaction.

Rollback: revert this customer-only release to v260 or deploy a forward revert; retain API58/admin/shared schema and ledger. Backup branch backup-customer-before-normal-renewal-v261-20261016 points to d0cf1d0.
