import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../Prepare-Play-v436.ps1', import.meta.url), 'utf8');

test('Windows PowerShell 5.1 signing handoff stays strictly ASCII-safe', () => {
  assert.doesNotMatch(script, /[^\x00-\x7f]/, 'Windows PowerShell 5.1 may interpret UTF-8 without BOM as CP1250 and break parser quotes');
  assert.match(script, /v436/);
  assert.match(script, /2\.0\.109/);
  assert.match(script, /Documents\\Chvostikovo-Keys\\chvostikovo-upload\.jks/);
  assert.match(script, /Key alias: chvostikovo-upload/);
  assert.match(script, /google-services\.json/);
  assert.match(script, /sk\.chvostikovo\.app/);
  assert.match(script, /npm\.cmd ci/);
  assert.match(script, /npm\.cmd run sync/);
  assert.match(script, /npm\.cmd test/);
  assert.match(script, /npx\.cmd cap open android/);
  assert.doesNotMatch(script, /Create New.*&/);
});

test('Firebase handoff automatically reuses verified older Android configuration', () => {
  assert.match(script, /Test-ExistingFirebase/);
  assert.match(script, /"v435"/,'reuse previous signed Android v435 Firebase first');
  assert.match(script, /"v435", "v431", "v412", "v418", "v407"/);
  assert.match(script, /chvostikovo-android-v403/);
  assert.match(script, /package_name -eq "sk\.chvostikovo\.app"/);
  assert.match(script, /Copy-Item -LiteralPath \$firebaseSource -Destination \$firebaseTarget/);
  assert.match(script, /PreflightOnly/);
  assert.doesNotMatch(script, /OpenFileDialog|Read-Host/);
});

test('ignore generated Android Studio metadata rather than prompting Add File to Git', async () => {
  const ignore = await readFile(new URL('../android/.gitignore', import.meta.url), 'utf8');
  assert.match(ignore, /^\.idea\/$/m, 'generated mobile/android/.idea/migrations.xml must not be added to Git');
});
