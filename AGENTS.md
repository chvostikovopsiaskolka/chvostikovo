# Chvostíkovo: stability before additional features

Before changing the admin, customer portal, backend or CRM, read `STABILITY.md`, the current Google Docs document 00 and the affected functional document linked there. Determine the live version; do not assume this checkout is live.

Documentation 00: https://docs.google.com/document/d/1w7hfcFXGEmWaPm3QL8o0UokZ0h8mMIV-XppEkJmmIsw/edit

Keep unrelated changes isolated and preserve drafts. Do not rewrite published Git history. Follow the existing icon rule in `system/PWA_ICON.md` before any icon work.

The admin is served from the Supabase `frontend_snapshots` key `stable-v10-clean`, not from the customer portal deployment. A successful customer Vercel deployment does not prove that admin code runs. Test the assembled admin's actual script scopes and initialization; isolated helpers with fabricated global dependencies are insufficient.

Never say a feature is live or verified solely because code exists, a parser passes, or deployment returns success. Verify the served artifact and the relevant flow. Mark physical iOS/Android behavior as unverified unless it was actually observed.
