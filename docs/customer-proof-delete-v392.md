# Customer v392 — vaccination photo management and short visit push

Requested 25 October 2026: shorter next-day push, explicit replacement guidance, owner deletion of vaccination photo and Storage object, one shared vaccination error rather than repeated per-day messages. Existing vaccination dates, review flow, booking restrictions and staff photo-delete behavior remain.

Baseline customer commit 1c3459c92544a6246b5412479f2fe917825c1824 (v391/2.0.66), customer API66. Rollback branch backup/customer-before-proof-delete-v392-20261025. Exact API66 sources retained in the baseline repository. Reminder definition is saved privately in chvostikovo_function_rollback_v218 before the guarded SQL update. Revert only this release if newer changes exist. Deleted photo bytes cannot be restored; no new archive is created.

Owner API authorizes effective linked dog scope before finding the proof, removes bytes through Storage API, then deletes public proof metadata. Failed Storage deletion keeps the visible record. Failed DB deletion retains the ID for an idempotent retry; the object can already be absent. Replacement stores the new image first, then removes only the selected old proof; cleanup failure returns both visible proofs and an actionable warning. Historical hidden files are not mass-cleaned. Legacy staff deletion remains unchanged.

Private AFTER DELETE trigger revokes a deleted accepted proof: an older retained image cannot replace a fresh vaccination document; a newer current proof can. No client EXECUTE grants. No bookings, vaccination dates, contacts, messages or push are changed merely by deletion. Review events remain independent of deleted image bytes.

UI retains the existing editor and stable other thumbnails. Pencil exposes Replace/Delete/Cancel, replacement uses a native file-input label. Confirmed deletion removes the selected item, resets the local fresh-proof flag, and accepts an empty list. Account/dog/epoch guards reject late responses. Failed deletion preserves the list. Duplicate vaccination booking errors show once with a link to the existing editor; other errors retain dates.

Tests: dedicated actual API transport, assembled UI, PostgreSQL deletion gate fixtures; existing vaccination 1/2 dogs, stable photos, native photo input, security handler and version-contract regressions. Full verify + Chromium/WebKit CI required before merge. Local browser download is unavailable (truncated CDN archive); CI browser evidence is required. Physical signed-in iOS/Android, real customer Storage deletion and push delivery remain unverified until observed. Tests send no customer notifications.

Initial local test failures: existing API mock did not implement DELETE (fixed to model permanent removal); UI refresh referred to nonexistent render (fixed to existing renderDog/renderUpcoming/renderDays); no production changes occurred during these failures.
