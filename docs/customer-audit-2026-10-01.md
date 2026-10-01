# Customer PWA audit — 2026-10-01, v143

Scope: production customer source, registration/password callbacks, vaccination proof selection/upload, session cleanup, shell cache, Realtime refresh structure, ownership checks and legal history integration. Production base: ea868da20fabe90c4fea84e122128565a374eb79; Edge API base: version 37, read from live and identical to repository.

## Changes
- Neutral registration message names the exact recipient; email remains prefilled on login. Duplicate signup/login submission guarded.
- Dedicated email-confirmed.html verifies email_confirmed_at through Auth /user, clears URL tokens immediately, stores no session, supports expired/error/no-token/network states. Legacy root signup callback redirects to this page; existing root redirect URL stays in signup while dashboard access is blocked.
- Password reset destination is fixed to app.chvostikovo.sk.
- Vaccination limit raised to five on client and server, including append totals. JPEG compression/private bucket remain unchanged.
- Stale asynchronous photo selection cannot become attached to another dog; concurrent uploads share one request; failed upload stays retryable; click errors are handled.
- Logout clears selected dog, staged images and legal/detail modals.
- Startup no longer includes the oversized logo; static alternating orange/pink SVG paws on white; in-app loader remains compact; reduced-motion respected.
- Service worker no longer replaces app-shell cache with other pages or failed HTTP responses; confirmation page never cached.
- Initial network failure shows login instead of an empty shell.

## Evidence and checks
- Focused Node/JSDOM tests: callback verified success, no-token/expired/error/unconfirmed states, exact email and neutral message, duplicate signup, five image selection, stale dog switch, upload deduplication; server accepts five and rejects sixth/append overflow/foreign dog.
- Production API checks Auth server-side and computes staff status from staff table; ownsDog requires linked dog.
- vaccination-proof-photos private, JPEG only, 1.5 MB bucket limit; individual API image limit unchanged (1.2 MB).
- Customer table read policies scoped by auth.uid; staff policies require active staff; legal history verified RPC and immutable document IDs untouched.
- Existing coalesced refresh/session refresh and scoped Realtime updates preserved; no polling added.
- Advisors reviewed: no-policy notices for service-only tables, generic definer warnings, unrelated system_notes RPC warnings and disabled leaked-password protection are not evidence of customer access bypass. No unrelated permission changes.

## Remaining verification
Supabase dashboard login timed out and fresh page still requires sign-in. SITE_URL, redirect allowlist and email template could not be read or changed. To eliminate localhost fallback, set Site URL to https://app.chvostikovo.sk/ and retain existing required redirect URLs while adding https://app.chvostikovo.sk/email-confirmed.html. Verify confirmation template uses ConfirmationURL (or reviewed RedirectTo variant). Existing root signup redirect remains for compatibility and forwards verified callbacks to the new page.
Real email delivery + tap-through and complete signed-in onboarding on physical iOS/Android are not verified. Tests do not guarantee every device or all app workflows.
