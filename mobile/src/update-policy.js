// Native Google Play availability is the only update signal; never compare to the PWA's live version.
export const PLAY_CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const PLAY_REMIND_LATER_MS = 24 * 60 * 60 * 1000;

export function isEligiblePlayUpdate(available, offeredCode, installedCode) {
  return available === true &&
    Number.isSafeInteger(offeredCode) &&
    Number.isSafeInteger(installedCode) &&
    offeredCode > installedCode;
}

export function isSnoozedPlayUpdate(offeredCode, stored, now = Date.now()) {
  return Number(stored?.versionCode) === offeredCode &&
    Number.isFinite(Number(stored?.until)) &&
    Number(stored.until) > now;
}

export function shouldCheckPlayUpdate({ now = Date.now(), lastCheckAt = 0, visible = true, online = true, busy = false } = {}) {
  return visible && online && !busy && (!lastCheckAt || now - lastCheckAt >= PLAY_CHECK_INTERVAL_MS);
}
