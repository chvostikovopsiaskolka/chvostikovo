import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
const mobile = fileURLToPath(new URL('..', import.meta.url));
const root = path.dirname(mobile), out = path.join(mobile, 'www');
await mkdir(out, { recursive: true });
// Strict allowlist: no admin, server code, backups, credentials or customer data.
const files = (await readdir(root)).filter(name => /\.(js|css|png)$/.test(name) && name !== 'sw.js');
files.push('index.html', 'email-confirmed.html', 'manifest.webmanifest', 'version.json');
const hashes = {};
for (const name of files) {
  await copyFile(path.join(root, name), path.join(out, name));
  hashes[name] = createHash('sha256').update(await readFile(path.join(root, name))).digest('hex');
}
let html = await readFile(path.join(out, 'index.html'), 'utf8');
html = html.replace(/<script src="\/app\.js/, '<script src="/native-runtime.js"></script>\n<script src="/app.js');
// Use the existing guarded back actions with Android's system back button.
html = html.replace(/<script src="\/android-install-choice[^>]+><\/script>/, '');
await writeFile(path.join(out, 'index.html'), html);
await build({ entryPoints: [path.join(mobile, 'src/runtime.js')], outfile: path.join(out, 'native-runtime.js'), bundle: true, format: 'iife', target: 'es2022', minify: true, legalComments: 'eof' });
const version = JSON.parse(await readFile(path.join(root, 'version.json'), 'utf8'));
await writeFile(path.join(out, 'mobile-build.json'), JSON.stringify({ ...version, packageId: 'sk.chvostikovo.app', files: hashes }, null, 2));
console.log(`Android assets built from ${version.build}; ${files.length} allowlisted shared files.`);
