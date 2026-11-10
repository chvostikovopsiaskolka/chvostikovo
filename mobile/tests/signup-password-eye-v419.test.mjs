import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=(p)=>readFile(new URL(p,root),'utf8');

test('Android v419 bundles one signup visibility control per password field',async()=>{
  const app=await read('app.js');
  const json=JSON.parse(await read('version.json'));
  const manifest=JSON.parse(await read('mobile/package.json'));
  const lock=JSON.parse(await read('mobile/package-lock.json'));
  assert.equal(json.build,'v419');
  assert.equal(json.version,'2.0.92');
  assert.equal(manifest.version,json.version);
  assert.equal(lock.version,json.version);
  assert.equal(lock.packages[''].version,json.version);
  assert.match(app,/function mount\(\)\{\['loginPassword','signupPassword','signupPasswordAgain','newPassword','newPasswordAgain'\]/);
  assert.match(app,/const isSignup=inputId==='signupPassword'\|\|inputId==='signupPasswordAgain'/);
  assert.match(app,/eye\.addEventListener\('click',\(\)=>\{/);
  assert.doesNotMatch(app,/password-eye-v19/,'legacy emoji signup eye must not be rendered');
  assert.match(app,/firstGroup\?\.insertAdjacentElement\('afterend',group\)/,'password confirmation remains');
});
