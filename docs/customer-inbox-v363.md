# Customer inbox — phase 1

Candidate `v363`, semver read from `version.json`. Baseline production commit
`836bbdb4dcd9a693d0edb486364e25bd7b6820f5` (v362 / 2.0.37), Vercel
`dpl_AL1Y37XqjkqKf2AT2YEq9jngeDBH`, alias `app.chvostikovo.sk`.
Before editing, all seven inspected served assets matched the baseline Git bytes.

The visual notice board is replaced by two equal, compact 44 px actions between
the existing one-/two-dog profile and entry/pass card. Notice history uses the
existing archive/detail: a white 75svh bottom sheet, thumbnail or existing pink paw,
title, excerpt, New label, full detail, bounded photo decode, zoom, and safe CTA.
Published history includes expired notices; inactive/future notices and staff drafts
remain unavailable. Explicit active/start filters supplement unchanged customer RLS.
Per-user read receipts are written only after actual detail rendering; list entry
never writes them. Failed writes retain unread. Chat uses the existing account-bound
conversation, API, messages, and single Realtime connection; no new tables, polling,
connections or publication paths. Resume refreshes per-user receipts, with existing
singleflight coalescing. Unchanged bootstrap data no longer swallows notice events.

Existing admin-push v39 source and companion were read live and compared with Git
(the only entrypoint difference was a trailing newline). An isolated change adds
an account-bound URL from existing notification metadata: staff_message_customer +
conversation -> messages; announcement_push + announcement -> specific notice.
The same dispatcher/device loop/tag remains, with no second send. SW rejects foreign
origins and routes its existing warm-window navigation/cold openWindow. The explicit
query survives session restoration/login/onboarding and is consumed before modal
history is pushed, preventing replay after Back/resume. Ordinary icon launch only
shows counts. Wrong account/conversation never opens private content. Native Android
is still a separate draft (`feat/capacitor-android-v361`): FCM/backend/Play delivery
are not active and existing APKs must be rebuilt/integrated/tested separately.
PWA version checks/session-refresh/security controls remain.

Guide step 2 now highlights the real Oznamy/Správy actions, pass and reservations;
all six steps, eligibility, skip/replay and inert demo behavior remain. Edge-swipe
closes only the top bulletin layer, preserving notice -> list -> overview history.

## Validation

- Release contract, full workflow commands, actual one-/two-dog UI, reservations,
  shared pass, per-dog taxi, photos, vaccines, auth/recovery, optional six-step guide,
  and assembled admin/push regressions run in isolation.
- New assembled customer tests: empty/ten/expired/future/inactive notices, pink paw,
  receipt only on detail, failed receipt, cross-device-style receipt refresh, direct
  chat, incoming/read/unread state, account/logout isolation; pending push through
  login, wrong-account/conversation denial, ordinary icon, consume-once/back/resume.
- Full Edge dispatcher uses mocked subscriptions and sends: one send per device,
  correct trusted URL, unchanged admin/non-inbox routing. SW warm/cold/foreign URL.
- Chromium: 320/360/390/430, 844x390, 1280 for one/two dogs; 44 px equal actions,
  75svh panel, ten cards and photo/paw, long text, internal scroll/background lock,
  actual clicks/detail/read/history/X/chat, unchanged nav, no horizontal overflow.
- Production DB read-only transaction with actual authenticated customer role:
  no inactive/future rows; own receipts only; direct private-message table denied.
  No synthetic operational rows or customer notifications sent.
- The broader historical guide browser check finds the SAME pre-existing 12 px
  internal calendar-preview overflow at 360 px on baseline v362 and this candidate
  with this container's fonts (634 px client / 646 px scroll). No calendar styles
  are changed in phase 1. Six-step functional checks pass; this is not a newly
  introduced regression. Initial local browser crashes were caused by an incomplete
  temporary font directory; a valid test fontconfig resolved rendering.
- Physical iPhone/Android, OS lock-screen delivery, native FCM/Play are unverified.
  A successful deploy or synthetic notificationclick is not physical delivery proof.

CI, production SHA/deployment/alias and byte readback are verified separately before
claiming release. Docs 00/02/07 are updated after those checks, with readback.

## Rollback

Immutable Git branch `backup/customer-before-inbox-v363-20261023` points to baseline
`836bbdb4dcd9a693d0edb486364e25bd7b6820f5`; previous production deployment is
`dpl_AL1Y37XqjkqKf2AT2YEq9jngeDBH`. Use the customer production branch + Vercel
release path. Revert only this release when later changes exist; never reset shared
state/data. Rebuild with a fresh release number when forward-fixing so PWA clients
fetch the rollback assets. The previous dispatcher is
`supabase/functions/admin-push/index.ts` and `security-v336.ts` from the baseline
branch (live Edge version 39; verify_jwt=false, explicit webhook/auth checks retained).
Restore only the isolated URL change if a newer dispatcher has landed. A PWA rollback
still opens safely at overview if an already queued push contains the new URL.
No database/schema/read-receipt rollback or deletion is needed.
