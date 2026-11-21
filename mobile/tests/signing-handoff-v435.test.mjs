import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../Prepare-Play-v435.ps1', import.meta.url), 'utf8');

test('Windows PowerShell 5.1 signing handoff stays strictly ASCII-safe', () => {
  assert.doesNotMatch(script, /[^\\x00-\\x7f]/, 'Windows PowerShell 5.1 may interpret UTF-8 without BOM as CP1250 and break parser quotes');
  assert.match(script, /v435/);
  assert.match(script, /2\\.0\\.108/);
  assert.match(script, /Documents\\\\Chvostikovo-Keys\\\\chvostikovo-upload\\.jks/);
  assert.match(script, /Key alias: chvostikovo-upload/);
  assert.match(script, /google-services\\.json/);
  assert.match(script, /sk\\.chvostikovo\\.app/);
  assert.match(script, /npm\\.cmd ci/);
  assert.match(script, /npm\\.cmd run sync/);
  assert.match(script, /npm\\.cmd test/);
  assert.match(script, /npx\\.cmd cap open android/);
  assert.doesNotMatch(script, /Create New.*&/);
});
