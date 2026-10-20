# Customer Beta 2.0.8 / v317

Android-only day tiles use 74px minimum height rather than 89px, with 7px vertical padding rather than10. Existing labels, font sizes, width, booking states and touch area remain. The design script tags Android from its user agent; no mobile iOS height change.

Loader paw is now a fixed HTML span centered by absolute inset/margin auto. Its explicit64×64 SVG viewport and translated symbol move the actual glyph's bounds centre (33,29.5) to(32,32). The existing2.2s breathing scale1→1.055→1 runs in the same bounded frame loop as the arc rather than animating the SVG transform independently. Ring and paw are separate; hidden loader stops frames, visibility/class changes resume them. Reduced-motion keeps paw scale1 and retains the previous slower ring. Actual physical iOS root cause was not established; this unifies the implementation without claiming observed device results.

Validation: loader frame lifecycle test for Android/iOS user agents (entire breathing cycle, arc, reduced motion, hidden/resume) and full customer1/2dog runtime/picker/photo/vaccine/taxi/chat regressions PASS. JS parser/diff checks PASS. Physical iOS/Android rendering remains for user confirmation. No production test writes/sends.

Baseline production3ca383cd3db49697e17e6ec5bde29a7a209676a3 / Beta2.0.7/v316, deployment dpl_J8c4Zb8zQDpGmkh4D4QA3oDX16Co. Backup backup/customer-before-motion-v317; rollback redeploy baseline only after checking newer releases. No admin/API/DB/nav/branding changes.
