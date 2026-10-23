import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackPath } from '../src/policy.js';
test('App Links only accepts our exact HTTPS origin and authentication callback paths', () => {
  assert.equal(callbackPath('https://app.chvostikovo.sk/#access_token=synthetic&refresh_token=synthetic&type=recovery'), '/#access_token=synthetic&refresh_token=synthetic&type=recovery');
  assert.equal(callbackPath('https://app.chvostikovo.sk/email-confirmed.html#access_token=synthetic'), '/email-confirmed.html#access_token=synthetic');
  for (const url of ['javascript:alert(1)', 'https://evil.example/#access_token=x', 'https://app.chvostikovo.sk.evil.example/#access_token=x', 'http://app.chvostikovo.sk/#access_token=x', 'https://app.chvostikovo.sk/other#access_token=x', 'https://app.chvostikovo.sk/', 'not-a-url']) assert.equal(callbackPath(url), null);
});
