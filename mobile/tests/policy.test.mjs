import test from 'node:test';
import assert from 'node:assert/strict';
import { callbackPath, notificationQuery } from '../src/policy.js';
test('App Links only accepts our exact HTTPS origin and authentication callback paths', () => {
  assert.equal(callbackPath('https://app.chvostikovo.sk/#access_token=synthetic&refresh_token=synthetic&type=recovery'), '/#access_token=synthetic&refresh_token=synthetic&type=recovery');
  assert.equal(callbackPath('https://app.chvostikovo.sk/email-confirmed.html#access_token=synthetic'), '/email-confirmed.html#access_token=synthetic');
  for (const url of ['javascript:alert(1)', 'https://evil.example/#access_token=x', 'https://app.chvostikovo.sk.evil.example/#access_token=x', 'http://app.chvostikovo.sk/#access_token=x', 'https://app.chvostikovo.sk/other#access_token=x', 'https://app.chvostikovo.sk/', 'not-a-url']) assert.equal(callbackPath(url), null);
});

test('native notification accepts only the existing scoped message/article routes', () => {
 const recipient='12345678-1234-1234-1234-123456789012';
 assert.equal(notificationQuery('/?open=messages&conversation=7&recipient='+recipient), 'open=messages&conversation=7&recipient='+recipient);
 assert(notificationQuery('https://app.chvostikovo.sk/?open=announcement&announcement=9&recipient='+recipient));
 for(const value of ['https://evil.example/?open=messages&conversation=7&recipient='+recipient,'javascript:alert(1)','/?open=messages&conversation=7','/?open=messages&conversation=-1&recipient='+recipient,'/other?open=messages&conversation=7&recipient='+recipient])assert.equal(notificationQuery(value),null);
});
