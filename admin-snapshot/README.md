# Chvostíkovo Admin – production backup

This branch contains a Git backup of the **current production admin frontend**.

## Production source

- Supabase project: `tlhcqwsluyqpywymjoxn`
- Snapshot table: `public.frontend_snapshots`
- Production key: `stable-v10-clean`
- Serving Edge Function: `chvostikovo-frontend`
- Edge Function version at capture: **46**

## Files

- `admin-snapshot/stable-v10-clean.html` – exact production admin HTML snapshot exported from Supabase.
- `admin-snapshot/chvostikovo-frontend/index.ts` – current Edge Function that serves `stable-v10-clean`.
- `admin-snapshot/manifest.json` – snapshot metadata/checksum.

## Important

This branch is a **versioned backup/source snapshot**, not the current production hosting path.

The live admin app continues to be served by Supabase. Updating this Git branch alone does not change production.

Do not point the public website or customer portal deployment at this branch.

## Restore concept

If production admin ever needs to be restored, use the HTML snapshot here to restore the `stable-v10-clean` record in Supabase, then verify the required markers expected by `chvostikovo-frontend` before serving it.

Captured: **3 October 2026**
