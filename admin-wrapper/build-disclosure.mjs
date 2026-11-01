import {readFileSync,writeFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {stabilizeAdminHtml,checksum} from './admin-lifecycle-patch.mjs';import {enhanceRevenueDisclosures} from './revenue-disclosure-patch.mjs';
const before=gunzipSync(readFileSync('supabase/admin-snapshots/admin-before-stability-20261101.html.gz')).toString('utf8');
if(checksum(before)!=='ff9255d91b4e5da2f4266121902a18c660110796fcd4993d7d4058fb0cd994fa')throw Error('Unexpected stable backup');
const candidate=enhanceRevenueDisclosures(stabilizeAdminHtml(before));writeFileSync(process.env.ADMIN_SOURCE||'admin-disclosure-candidate.html',candidate);console.log('Disclosure candidate '+checksum(candidate));
