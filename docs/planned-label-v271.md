# Planned entry wording v271 — 16 October 2026

Admin pending renewal entry label is “Naplánované · 1/10”. Customer already renders “Plánovaný vstup 1 z 10” when planned_pass_request_id is present. Hannah request87 read back pending, projected1/10, planned renewal11. No pass purchase or approval changed.

Live admin MD5 10cb4a2eae30c79a4c14ddd4e5090664,767202PGcharacters. Prior immutable backup backup-admin-before-planned-label-v271-20261016 MD5 669359151b8bb61584b2b1d6355280d0. Minimal text-only patch. To roll back, guard current hash, verify backup hash, then restore backup HTML. No customer source change.
