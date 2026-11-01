import {readFileSync,writeFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {checksum,stabilizeAdminHtml} from './admin-lifecycle-patch.mjs';
const source=gunzipSync(readFileSync('supabase/admin-snapshots/admin-before-stability-20261101.html.gz')).toString('utf8');
if(checksum(source)!=='ff9255d91b4e5da2f4266121902a18c660110796fcd4993d7d4058fb0cd994fa')throw Error('Unexpected baseline');
const candidate=stabilizeAdminHtml(source);writeFileSync(process.env.ADMIN_SOURCE||'admin-stability-candidate.html',candidate);console.log('Reproducible admin candidate '+checksum(candidate));
