import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Always supply a freshly fetched LIVE admin-push entrypoint, never a historical backup.
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node prepare-push-dispatch.mjs LIVE-index.ts OUTPUT-index.ts');
const source = await readFile(input, 'utf8');
const needle = '  return { sent, removed, ignored: false };\n}\n\nDeno.serve';
if (source.includes('dispatchNative') || source.split(needle).length !== 2) throw new Error('Unexpected baseline; review current dispatch before applying.');
const result = 'import { dispatchNative } from "./native-dispatch.ts";\n' + source.replace(needle,
  '  let nativeSent = 0;\n  try { nativeSent = (await dispatchNative(message, SUPABASE_URL, SERVICE_KEY)).sent; }\n  catch { console.error("Native push dispatch unavailable"); }\n  return { sent, removed, nativeSent, ignored: false };\n}\n\nDeno.serve');
await writeFile(output, result);
console.log('Prepared only; LIVE baseline SHA256 ' + createHash('sha256').update(source).digest('hex'));
