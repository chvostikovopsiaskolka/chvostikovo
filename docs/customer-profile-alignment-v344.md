# Profile text alignment — v344, 22 October 2026

Customer Beta 2.0.24 / `20261022-profile-alignment-v344` aligns the single-dog overview name, vaccination text and school-visit text on one left edge. A dedicated 27px gutter holds the status icons, with 29px content padding beside the existing divider. The original 44px vaccination button, green 13/12/11px valid label, photo nodes, warning wrapping, navigation and all handlers remain intact. Two-dog cards retain their existing layout.

Baseline: customer-portal-production commit 04c730173d194b62eb31e7fac8110263332a4aaf, Vercel dpl_2G694d9gwv8TUd16M2UkNtqHcHin. Backup branch backup/customer-before-profile-alignment-v344-20261022. No backend or admin changes.

Verification: actual customer Chromium rendering at 320/360/390/430 and 844x390 measures identical left coordinates for all three texts. Existing green/larger/single-line checks pass for one and two dogs without page overflow. Full customer runtime checks pass for one and two dogs. Physical iOS/Android layout remains unobserved. No production test records, messages or pushes.

Rollback: selectively revert the four v344 layout rules against the current live version and advance cache/build coherently, or restore the retained customer baseline if no newer changes exist. Do not restore an admin snapshot or redeploy backend functions for this CSS change.
