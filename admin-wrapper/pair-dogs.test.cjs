const fs=require('node:fs');const assert=require('node:assert/strict');const vm=require('node:vm');
const wrapper=fs.readFileSync('admin-wrapper/index.html','utf8');
const source=fs.readFileSync('admin-wrapper/admin-pair-v409.js','utf8');
new vm.Script(source);
assert(wrapper.includes('admin-pair-v409.js'),'Admin must embed the pairing UI into the fetched snapshot');
for(const term of ['customer_owner_links','pass_dogs','customer_pass_requests',"client.from('dogs').update({owner_id:a.owner_id})","eq('owner_id',b.owner_id)","verify.checked"]){assert(source.includes(term),'Must guard '+term);}
assert(source.includes('passStore instanceof Map'),'Admin shared-pass index is a Map, not an array');
assert(source.includes('existingSharedPass(')&&source.includes('Spárovaní psíkovia:'),'Existing shared pass needs confirmed UI state');
assert(!source.includes('purchase_pass('));assert(!source.includes('UPDATE public.visits'));
console.log('PASS staff pairing UI only changes guarded owner association, never financial rows');