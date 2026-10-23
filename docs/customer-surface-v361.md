# Customer v361 — light raised surfaces without reservation logic changes
Date: 2026-10-23. Baseline: production v360 commit af169c978538c5c00ebc01dc44253bc562138337, Vercel dpl_83RGpCJLHxKfDEsKLRj7fqSCkoKk.
Rollback branch: backup/customer-before-surface-v361-20261023 at exact baseline. Revert only this release if newer customer changes exist.

- Single-dog Žiacka knižka: original button/accessible focus/functional click, without orange outlined pill; original SVG aligned visually with visits icon.
- Overview one-time/pass card and my reservations: white elevated surface, subdued soft shadow and raised title typography. Empty booking text centered; dynamic Sunday notice bold green without green box. Existing card swipe, photos, status and actions unchanged.
- Reservations page: white elevated my-reservations and two-week calendar sections (instead of orange framed backgrounds), no outlined green Sunday reminder. Same next-week heading location, conditional hiding, dates and capacity colors.
- Dynamic deadline text: 'Prosíme o rezerváciu miesta do nedele DD. MM. do 20:00.' It wraps naturally at narrow widths, no repeated phrase.
- No account data, booking, approvals, permanentka, taxi, notifications, database, RLS, backend or admin modifications. Build v361 / semver 2.0.36; PWA version and cache invalidated.
- Expected tests: full customer-design and customer guide/session suites plus new v361 invariants; 320/360/390/430 portrait and landscape; 1/2 dogs, empty/filled booking carousel, deadline Sunday rollover and focus/touch. Physical iOS and Android APK not verified by CI. There is no Capacitor source/configuration in this repo; shipping a new APK requires separate native build and distribution.
Rollback by reverting v361 commit/serving previous Vercel deployment only when compatible with subsequent releases. Preserve all customer/DB state.
