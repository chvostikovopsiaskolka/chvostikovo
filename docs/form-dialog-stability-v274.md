# Web form viewport stability — v274 (16 October 2026)

Reported on iPhone: choosing a dog's sex/neuter status after dismissing the keyboard, or autofilling the owner's name, displaced the visible form. Screenshots show native iOS pickers separated from their controls. Exact OS-level geometry cannot be reproduced in the available DOM runtime; do not describe it as a confirmed WebKit root cause or claim physical-device verification.

The actual shared FormDialog used a fixed 50%/50% position with translation on both axes, animated zoom, and the entire dialog as its scroll container. Radix default opening focus also targeted the first input. These concrete layout/focus mechanisms are changed locally:

- Mobile (<640px): top anchored, centered using left/right margins, no transform/translate/scale/zoom animation on the native-select ancestor.
- One inner scroll container; heading and close control stay outside it. Desktop retains its centered placement.
- VisualViewport resize/scroll updates only CSS properties for available height and offset. RAF batches changes, listeners are removed on close, pinch zoom is not counteracted. No field recentering, scrollIntoView, scroll reset, or React render on each viewport event.
- Opening focuses the title with preventScroll, retaining Radix focus trapping and Escape/close behavior, without opening the keyboard automatically.
- Owner name/phone autocomplete remains available. Both dog name fields explicitly opt out of human-contact autocomplete.
- Same shared dialog covers application, short Slovak enquiry, puppy/lead landing and English enquiry. Inline forms retain their layout; the dog-name autocomplete change also applies inline.

`scripts/form-dialog-stability-checks.tsx` mounts the actual Radix FormDialog and verifies single/two-dog content, initial heading focus, viewport shrink/restore/offset, native select focus, silent-autofill value and DOM identity, scroll preservation, zoom and listener cleanup. It is part of check:critical-forms. This is DOM verification, not an iOS keyboard/picker geometry emulator. Existing critical submit/autofill checks and TypeScript validation must also pass. No live form submission or customer SMS is necessary for this layout change.

Rollback baseline: main 2d26ce1ed406bbfe6772b4db2d2100ca7035bc0a, remote backup-web-before-form-stability-v274-20261016. Revert only this feature's commit after checking later edits; do not deploy an old whole-tree snapshot over newer changes. Supabase, admin, customer portal, CRM, recovery, SMS and conversion code are unchanged.
