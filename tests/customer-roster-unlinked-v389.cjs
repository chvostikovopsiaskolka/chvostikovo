'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/customer-portal-api/index.ts'), 'utf8');
const marker = '  const rosterAutoNameV389 = (dog: Json | undefined) =>';
const start = source.indexOf(marker);
const end = source.indexOf('  const publicPhotoPaths', start);
assert(start >= 0 && end > start, 'LIVE roster name-only rule must exist');
const declaration = source.slice(start, end).replace('(dog: Json | undefined)', '(dog)');
const getRule = Function('rosterOwnerLinks', declaration + '\nreturn rosterAutoNameV389;');
const unlinked = {id: 10, owner_id: 100, active: true, share_name_photo: false, share_name_photo_at: null};
const preview = (dog, ownerLinks = []) => getRule(ownerLinks)(dog);
const clone = (changes) => ({...unlinked, ...changes});

assert.equal(preview(unlinked), true, 'unlinked undecided dog must show name');
assert.equal(preview(unlinked, [{owner_id: 100, allowed_dog_ids: [11]}]), true, 'sibling dog link does not link this dog');
assert.equal(preview(unlinked, [{owner_id: 100, allowed_dog_ids: [10]}]), false, 'new linked owner ends temporary visibility');
assert.equal(preview(unlinked, [{owner_id: 100, allowed_dog_ids: null}]), false, 'owner-wide link also ends visibility');
assert.equal(preview(unlinked, [{owner_id: 101, allowed_dog_ids: [10]}]), true, 'other owner does not block visibility');
assert.equal(preview(clone({share_name_photo_at: '2026-10-10T09:00:00Z'})), false, 'previous refusal stays hidden');
assert.equal(preview(clone({share_name_photo: true, share_name_photo_at: '2026-10-10T09:00:00Z'})), false, 'existing affirmative consent follows original branch');
assert.equal(preview(clone({active: false})), false, 'inactive dogs not temporarily shared');
assert.equal(preview(undefined), false, 'missing dogs not shared');
assert(source.includes(".filter((dog) => dog?.share_name_photo === true || rosterAutoNameV389(dog))"), 'original explicit opt-in stays intact');
assert(source.includes("photo_url: dog.share_name_photo === true ? await rosterPhotoUrl(Number(dog.id)) : null"), 'temporary roster mode may not expose photo');
assert(source.includes("const consentedDogs = viewerApproved"), 'viewer still needs approved booking');
console.log('customer roster unlinked v389: 12 checks passed');
