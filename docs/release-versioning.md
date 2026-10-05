# Customer app release numbering

Current baseline: Beta 1, release version 1.0.0.

- Small fixes and updates: 1.0.1, 1.0.2, and subsequent patch versions.
- Larger additions within the same major release: 1.1.0, 1.2.0.
- Next major release: 2.0.0, followed by 2.x.y updates.
- Update APP_VERSION, version.json version, and customer-facing release labels together.
- Internal APP_BUILD and service-worker cache identifiers remain distinct and must change on every deployment so installed clients update reliably.
- Legal document versions and historical acceptances are independent; never change them for an app release.
