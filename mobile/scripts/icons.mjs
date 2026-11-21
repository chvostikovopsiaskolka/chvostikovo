import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const mobile = fileURLToPath(new URL('..', import.meta.url));
const png = await readFile(mobile + '/../icon-maskable-512.png');
// Reuse the existing valid maskable PWA icon without changing its artwork.
const res = mobile + '/android/app/src/main/res/';
await writeFile(res + 'drawable/chvo_app_icon.png', png);
for (const dir of await readdir(res)) if (/^mipmap-/.test(dir) && !dir.includes('anydpi')) {
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) await writeFile(res + dir + '/' + name, png);
}
console.log('Existing approved icon copied without redesign.');
