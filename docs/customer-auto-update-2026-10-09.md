# Customer release updates

The customer portal checks the existing static `/version.json` after startup and on visible focus/online/resume events. There is no interval, background polling, cron, Supabase call, or Vercel Function for this check. The marker is served as a static asset with no-store headers and bypasses the service-worker asset cache.

Checks are coalesced and limited to one per five minutes, including failed checks. The last-check timestamp survives reload within the same session. Offline and hidden clients do not check. Requests abort after four seconds. Matching builds do not reload. A different valid build can trigger a normal navigation reload, including when a release is rolled back.

Reload waits for a visible, online, idle app: no open modal, focused editor, visible edited form, unsent chat draft, photo processing, loader, bootstrap, synchronization, or API mutation. Deferred updates retry only on user actions, resume, or completion of existing API/loading work; they do not poll. The target build is persisted before reload and gets at most one automatic reload attempt per target in the session, preventing stale HTML from creating a reload loop. Unavailable session storage disables automatic reload rather than risking a loop.

This is first available in 1.0.40. An already-running older page cannot acquire the new JavaScript without one normal fresh navigation/restart first. Once that happens, later small and large deployments use this mechanism. No admin update menu was added.

Tests: `node tests/customer-auto-update-v193.cjs`. Browser fixtures additionally exercised a real navigation from one release to another, draft deferral, request counts, and persistence across reload at 360/390 px. Notice, reservation, and pass-summary regressions also passed. Physical iOS/Android installation/resume has not been tested.
