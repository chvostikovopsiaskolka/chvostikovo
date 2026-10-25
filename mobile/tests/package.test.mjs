import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
  const release = JSON.parse(await read('../version.json'));
  assert.equal(manifest.build, release.build);
  assert.equal(manifest.version, release.version);
  assert.equal(manifest.files['app.js'].length, 64);
});
test('packaged v392 runtime and optical dependencies match the shared source byte for byte', async () => {
  const manifest = JSON.parse(await read('www/mobile-build.json'));
  for (const [file, hash] of Object.entries(manifest.files)) {
    const source = await readFile(new URL('../../' + file, import.meta.url));
    const packed = await readFile(new URL('../www/' + file, import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'), hash, file + ' source');
    if (file !== 'index.html') assert.deepEqual(packed, source, file + ' packaged');
  }
  for (const [file, hash] of Object.entries(manifest.packagedFiles)) {
    const packed = await readFile(new URL('../www/' + file, import.meta.url));
    assert.equal(createHash('sha256').update(packed).digest('hex'), hash, file + ' artifact');
    if (/\.(js|css|html)$/.test(file)) {
      const content = packed.toString();
      for (const match of content.matchAll(/(?:\/|\.\/)(vendor\/[a-zA-Z0-9_./-]+\.(?:js|png|svg))/g)) {
        assert(manifest.packagedFiles[match[1]], file + ' missing runtime asset ' + match[1]);
      }
    }
  }
  const gradle = await read('android/app/build.gradle');
  assert(gradle.includes("'../../version.json'"));
  assert(gradle.includes('versionCode customerVersionCode'));
  assert(gradle.includes('versionName customerRelease.version.toString()'));
  assert(!Object.keys(manifest.packagedFiles).some(file => /\/src\/|\.ts$|\.sql$/.test(file)));
});
test('release requires Firebase, signing credentials and verified push/App Links', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [new URL('../scripts/check-release.mjs', import.meta.url).pathname], { env: { PATH: process.env.PATH } });
  assert.equal(result.status, 1);
  assert.match(result.stderr.toString(), /Firebase google-services.json/);
  assert.match(result.stderr.toString(), /CHVO_KEYSTORE_PATH/);
  assert.match(result.stderr.toString(), /CHVO_NATIVE_PUSH_VERIFIED/);
});
