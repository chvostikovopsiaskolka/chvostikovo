# Reservation page header and neutral cards

Customer Beta 2.0.26, build `20261022-booking-surface-v350`. Baseline production `d1f1cb7316bd44f66f54aaa6ac129e90d910a651`, Vercel `dpl_CqZdDkWnoADnpViFV6RThbbSHGYe` on app.chvostikovo.sk. Production customer-design.css read back byte-identical to the baseline checkout.

Restore the original reservation page header and X close action; title is “Rezervácie”. Remove the chat button from this header. Keep “Moje rezervácie” over the original horizontally scrolling reservations, but remove its green container and border. White reservation cards have a thin neutral edge and subtle shadow; carousel padding leaves room for shadows. Overview visit cards use the established soft orange #fff5e9 with #efcfa9 edge instead of pink. The green Sunday reminder keeps its readable background/text, with a lighter #d6e9d9 edge and subtle raised shadow. Calendar availability colors and all booking/taxi/shared-pass/consent behavior stay unchanged.

Validation: complete `tests/customer-design.cjs` passes for 1/2 dogs, including restored title, no header chat, original X close, stable photos, roster consent, shared plans, cancellation, taxi, vaccine editor, swipe and dirty/mandatory guards. Actual rendered DOM inspected in Chromium 320/360/390/430/844×390/1280 for 1/2 dogs: heading and 44px X visible, transparent outer section, white cards with shadow, no horizontal overflow. 390px screenshot visually inspected. Physical iOS/Android not observed. No production booking, message, push or payment test writes.

Rollback: restore the baseline customer commit through a forward revert/release or the prior deployment above, keeping newer unrelated changes. Admin snapshot, backend and database are not changed by this release.
