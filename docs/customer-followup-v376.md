# Customer glass follow-up v376 — review candidate

Base production: c35b9bd3b6b52a527c1c4c415b943307afcd0853 (v375 / 2.0.50). Local immutable backup `backup/local-v375-before-followup`. No production alias changed by this candidate.

The pass renderer used `innerHTML` and deleted the material child while the optics state retained its detached reference. Preserve the material, skip unchanged pass markup and reconnect externally replaced materials. Menu groups and notice cards/sheets now share the existing bounded optical renderer.

Five actions inside the original fixed dock: Overview, Messages, Reserve, Notices, Menu. Unchanged outer dimensions and viewport placement. Reserve remains widest. Existing message/unread, notice sheet/history/receipts, booking and menu handlers are reused. Empty historical inbox is retained as a hidden layout anchor.

Selected current notices appear below reservations. Zero selections: no section; one: single card; multiple: manual scroll-snap carousel, arrow-key navigation and reduced-motion support. The exact same card function and CSS serve the history sheet and carousel. Browsing never marks a notice read. Existing detail, receipt, photo and CTA behavior stays intact. Selection is a staff setting `show_in_overview`, default false; requires the separately verified additive backend/admin release. No invented fallback notices.

Chromium automated widths 320/360/390/430/844, one/two dogs: pass-layer identity through twelve refreshes + usage update and external replacement recovery, 0/1/2 selected notices, expired/archive filtering, menu materials, notice sheet and fixed dock geometry, five >=44px controls and widest reserve action. Existing optics pixel proof passes. Physical iPhone standalone and Android hardware remain unverified.
