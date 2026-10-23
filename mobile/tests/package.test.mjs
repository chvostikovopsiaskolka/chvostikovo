import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');
test('mobile bundle uses local shared assets, excludes server material and service worker', async () => {
  const files = await readdir(new URL('../www', import.meta.url));
  assert(!files.includes('sw.js'));
  assert(!files.some(file => /admin|backup|\.ts$|\.sql$|google-services/.test(file)));
  const config = JSON.parse(await read('capacitor.config.json'));
  assert.equal(config.server?.url, undefined);
  assert.equal(config.appId, 'sk.chvostikovo.app');
  const html = await read('www/index.html');
  assert(html.indexOf('/native-runtime.js') < html.indexOf('/app.js'));
  assert(!html.includes('android-install-choice'));
  const manifest = JSON.parse(await read('www/mobile-build.json'));
  assert.equal(manifest.build, 'v361');
  assert.equal(manifest.files['app.js'].length, 64);
});
test('release requires Firebase, signing credentials and verified push/App Links', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [new URL('../scripts/check-release.mjs', import.meta.url).pathname], { env: { PATH: process.env.PATH } });
  assert.equal(result.status, 1);
  assert.match(result.stderr.toString(), /Firebase google-services.json/);
  assert.match(result.stderr.toString(), /CHVO_KEYSTORE_PATH/);
  assert.match(result.stderr.toString(), /CHVO_NATIVE_PUSH_VERIFIED/);
});
