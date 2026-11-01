import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {stabilizeAdminHtml} from './admin-lifecycle-patch.mjs';
const path='supabase/admin-snapshots/admin-before-stability-20261101.html.gz';
test('actual stable admin financial/lifecycle transform retains honest missing values', {skip:!path},()=>{
 const before=gunzipSync(readFileSync(path)).toString('utf8'),after=stabilizeAdminHtml(before);
 assert.match(after,/const monthKey=active.week_start.slice\(0,7\)/);
 assert.match(after,/Bezplatné návštevy/);assert.match(after,/Evidencia potvrdených úhrad je neúplná/);
 assert.doesNotMatch(after,/month.hasData\?schoolMoneyV307\(month.total\)/);
 assert.match(after,/function leaveApp\(\)\{ closeAdminSettings\(\); hideAppBoot/);
 assert.equal((after.match(/id="adminSwitchWorkspace"/g)||[]).length,1);
 assert.equal((before.match(/<script/g)||[]).length+1,(after.match(/<script/g)||[]).length);
});
