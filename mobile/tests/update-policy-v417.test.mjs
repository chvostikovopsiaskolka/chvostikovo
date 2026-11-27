import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligiblePlayUpdate, isSnoozedPlayUpdate, shouldCheckPlayUpdate, PLAY_CHECK_INTERVAL_MS, PLAY_REMIND_LATER_MS } from '../src/update-policy.js';

test('only Google Play offering a strictly higher native version is eligible', () => {
  assert(isEligiblePlayUpdate(true, 418, 417));
  for (const value of [417,416,0,NaN,undefined,418.5]) assert(!isEligiblePlayUpdate(true, value, 417));
  assert(!isEligiblePlayUpdate(false, 418, 417));
  assert(!isEligiblePlayUpdate(undefined, 418, 417));
  assert(!isEligiblePlayUpdate(true, 418, NaN));
});

test('remind later expires after 24 hours, does not suppress newer versions', () => {
  const now = 1700000000000;
  const snooze = {versionCode:418,until:now+PLAY_REMIND_LATER_MS};
  assert(isSnoozedPlayUpdate(418,snooze,now+1000));
  assert(!isSnoozedPlayUpdate(418,snooze,now+PLAY_REMIND_LATER_MS));
  assert(!isSnoozedPlayUpdate(419,snooze,now+1000));
  assert(!isSnoozedPlayUpdate(418,null,now));
  assert(!isSnoozedPlayUpdate(418,{versionCode:418,until:'invalid'},now));
});

test('Play checks are throttled and require foreground and network', () => {
  const now = 1700000000000;
  assert(shouldCheckPlayUpdate({now,lastCheckAt:0}));
  assert(!shouldCheckPlayUpdate({now,lastCheckAt:now-1000}));
  assert(shouldCheckPlayUpdate({now,lastCheckAt:now-PLAY_CHECK_INTERVAL_MS}));
  assert(!shouldCheckPlayUpdate({now,visible:false}));
  assert(!shouldCheckPlayUpdate({now,online:false}));
  assert(!shouldCheckPlayUpdate({now,busy:true}));
});
