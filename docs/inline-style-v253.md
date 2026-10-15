# Inline owner attachment style v253 — LIVE 2026-10-15

User requested removal of visible first/second dog labels and the introductory-visit confirmation sentence. Those texts are removed; selectors retain accessible aria labels. The existing secondary button now has a visible white background, gray border, existing 14px rounded corners, 44px touch target, orange plus and matching font. Expanded state keeps the same button design with minus and Ponechať iba jedného. A single-name request never shows this second-dog action; manual attachment remains explicit.

Only admin HTML/CSS/markup changed; staff authorization, scoped links, atomic pair RPC, vaccination, financials, PWA/API are unchanged. Existing rule remains that staff approves access after the introductory visit; no extra checkbox, note, confirmation sentence or modal is introduced. Design rule reaffirmed in project documents: reuse established controls, spacing, colors and icons; keep existing flow.

LIVE stable-v10-clean MD5 e8fc02fdd98e98accf81a01f9ea38422. Customer API v56, PWA Beta1.0.87/v246 SHA9a4e41625b2aa5908ddb8694a27096a6c5079c36. PASS JS parsing, DOM 1/2 select controls and new copy/plus/minus/aria/style tests, native-schema transactional regression tests and intake regression. Physical iPhone/Android visual E2E not run. Exact LIVE snapshot hash readback verified.

Rollback: guarded supabase/changes/rollback-inline-style-v253.sql restores backup-admin-before-inline-style-v253-20261015 (7bf12b84b5e64ef628cb4a62d4c3ac59). No schema, API or data rollback necessary. Reproduce with node tools/style-inline-links-v253.cjs using exact local staged-admin-v252.html from backup, and node tests/inline-links-v253.mjs.
