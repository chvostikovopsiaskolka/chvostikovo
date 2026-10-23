# Customer app release numbering

Do not pin an obsolete "current" customer version in this document. Read the LIVE Git/Vercel HEAD and the current `version.json` for every release; the actual version is not inferred from a dated note.

- Small fixes and updates: 1.0.1, 1.0.2, and subsequent patch versions.
- Larger additions within the same major release: 1.1.0, 1.2.0.
- Next major release: 2.0.0, followed by 2.x.y updates.
- Update APP_VERSION, version.json version, and customer-facing release labels together.
- Internal APP_BUILD and service-worker cache identifiers remain distinct and must change on every deployment so installed clients update reliably.
- Legal document versions and historical acceptances are independent; never change them for an app release.

## Mandatory release gate (23 October 2026, customer v362 incident)

- The source of truth for the release identifier is `version.json` (`build`, `version`). Extract those values at runtime in tests; do not pin a previous version inside feature regression assertions.
- For the same build, keep `APP_BUILD`/`APP_VERSION` in `app.js`, cache name + app-shell asset query suffixes in `sw.js` and HTML version parameters synchronized. A historical label in a CSS class/file name is fine; a test assuming the current build is permanently v361 is not.
- Run `node tests/customer-release-contract.cjs` before the slower CI suite. It checks build, semver, HTML, SW and feature-test release assumptions without production access or side effects.
- Review every changed test with the same care as production code. After any failed check: identify the exact assertion, fix the smallest cause and rerun all checks against the NEW head SHA before merge. Never treat a passing prior SHA as passing the new one.
- For Capacitor, rebuild the locally bundled assets from the matching root source and align native versionName/versionCode with distribution requirements; an existing debug APK is not automatically updated by PWA deploy.
- Before documenting success, verify CI green, Vercel READY and Git SHA/production alias separately. Physical iOS/Android remain unverified until real device checks. Release/changelog writes are verified by readback.

**Incident evidence:** v362 PR164 failed twice (runs 39976525566 and 39976853474) only in the carry-forward `tests/customer-surface-v361.cjs`: an obsolete `v361` equality and then a malformed `/^v\\d+$/` assertion. The real one-/two-dog runtime had passed. Correct `/^v[0-9]+$/` run 39977614136 was SUCCESS. This gate is intended to prevent the same class of avoidable mismatch; it cannot replace full functional or physical tests.
