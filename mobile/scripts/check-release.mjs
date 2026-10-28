import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const missing = [];
try {
  const config = JSON.parse(await readFile(root + '/android/app/google-services.json', 'utf8'));
  if (!config.client?.some(c => c.client_info?.android_client_info?.package_name === 'sk.chvostikovo.app')) missing.push('Firebase Android package sk.chvostikovo.app');
} catch { missing.push('Firebase google-services.json'); }
for (const name of ['CHVO_KEYSTORE_PATH', 'CHVO_KEYSTORE_PASSWORD', 'CHVO_KEY_ALIAS', 'CHVO_KEY_PASSWORD']) if (!process.env[name]) missing.push(name);
if (process.env.CHVO_KEYSTORE_PATH) try { await access(process.env.CHVO_KEYSTORE_PATH); } catch { missing.push('Readable upload keystore'); }
// Explicit acknowledgements prevent accidentally calling an unconnected build release-ready.
for (const name of ['CHVO_NATIVE_PUSH_VERIFIED', 'CHVO_APP_LINKS_VERIFIED']) if (process.env[name] !== '1') missing.push(name);
if (missing.length) { console.error('Release blocked; configure: ' + missing.join(', ')); process.exitCode = 1; }
else console.log('Release prerequisites present. Physical flow checks still required.');
