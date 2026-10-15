const fs=require('fs'),crypto=require('crypto');let html=fs.readFileSync('../staged-admin-v250.html','utf8');if(crypto.createHash('md5').update(html).digest('hex')!=='664b6216a4abad04112f7bd0d50c5b3b')throw Error('baseline');const changes=[];function rep(a,b){if(!html.includes(a))throw Error('missing '+a.slice(0,80));changes.push([a,b]);html=html.replaceAll(a,b)}
let source=fs.readFileSync('admin/shared-admin-v244.js','utf8').split(' function memberships(pass)')[0]+ '\n})();';
source=source.replace(/V244/g,'V251').replace(/v244/g,'v251');
source=source.replace(/function registrationLabelV251[\s\S]*?\n}\n/,`function requestedDogNamesV251(profile,submission){const raw=profile.registration_dog_names||String(submission?.dog_name||'').split(',');const names=raw.map(x=>String(x).trim().replace(/\\s+/g,' '));return names.length<=2&&names.every(x=>x.length>0&&x.length<=50)&&new Set(names.map(x=>x.toLocaleLowerCase('sk'))).size===names.length?names:[]}
function registrationLabelV251(profile,submission){const names=requestedDogNamesV251(profile,submission);return names.length===2?'Majiteľ pri registrácii uviedol 2 psíkov: '+names.join(' a '):names[0]||submission?.dog_name||'neuvedený'}
function assignedDogsV251(userId){return state.dogs.filter(d=>state.customerOwnerLinks.some(l=>l.user_id===userId&&Number(l.owner_id)===Number(d.owner_id)&&(l.allowed_dog_ids==null||l.allowed_dog_ids.map(Number).includes(Number(d.id)))))}
window.assignedDogsV251=assignedDogsV251;window.registrationLabelV251=registrationLabelV251;
`);
source=source.replace("profile.registration_dog_names?.length===2","requestedDogNamesV251(profile,state.customerDogSubmissions.find(s=>s.user_id===userId)).length===2");
source=source.replace("const candidates=state.dogs.filter(d=>d.active&&allowedOwners.includes(Number(d.owner_id)));","const assigned=assignedDogsV251(userId);const candidates=assigned.length>=2?[]:state.dogs.filter(d=>d.active&&allowedOwners.includes(Number(d.owner_id))&&!assigned.some(a=>Number(a.id)===Number(d.id)));");
source=source.replace("return original(profile,dogs,cls).replace('</details>'", "return original(profile,dogs,cls).replace('</details>'");
// Keep manual attachment available after choosing only one, but never advertise a third.
source=source.replace("return original(profile,dogs,cls).replace", "if(dogs.length>=2)return original(profile,dogs,cls);return original(profile,dogs,cls).replace");
source=source.replace("await loadData();}finally", "await loadData();window.refreshAdminDashboardV63?.();queueAdminLive('accounts',40);}catch(e){alert(e.message||'Priradenie sa nepodarilo.')}finally");
source=source.replace("const root=button.closest('.note')||document;dogId=Number(root.querySelector('.customer-dog-select,.v42-owner-dog')?.value);", "const root=button.closest('.note')||document;dogId=Number(root.querySelector('.customer-dog-select,.v42-owner-dog')?.value);if(!dogId){alert('Najprv vyberte existujúceho psíka.');return}");
rep('async function linkRegisteredOwner(userId){',source+'\nasync function linkRegisteredOwner(userId){');
rep("'user_id,owner_id,created_at'","'user_id,owner_id,allowed_dog_ids,created_at'");
rep('status,privacy_notice_version,privacy_notice_acknowledged_at,created_at','status,registration_dog_names,privacy_notice_version,privacy_notice_acknowledged_at,created_at');
rep("${esc(submission?.dog_name||'neuvedený')}","${esc(registrationLabelV251(p,submission))}");
rep("esc(sub?.dog_name||'neuvedený')","esc(window.registrationLabelV251(p,sub))");
rep('assigned=state.dogs.filter(d=>ownerIds.includes(Number(d.owner_id)))','assigned=assignedDogsV251(p.user_id)');
rep('const dogs=(state.dogs||[]).filter(d=>ownerIds.includes(Number(d.owner_id)));','const dogs=window.assignedDogsV251(p.user_id);');
fs.writeFileSync('admin/verified-links-v251.js',source);fs.writeFileSync('../staged-admin-v251.html',html);fs.writeFileSync('../staged-admin-v251.html.replacements.json',JSON.stringify(changes));console.log(crypto.createHash('md5').update(html).digest('hex'));
// Patch exact LIVE API; financial and shared-pass draft code never enters deployment.
let api=fs.readFileSync('../api-before-v251.ts','utf8'),draft=fs.readFileSync('supabase/functions/customer-portal-api/index.ts','utf8');
for(const [start,end] of [['async function linkedDogs(', 'async function signedPhotoUrl('],['async function rosterPhotoPaths(', 'async function getAvailability(']]){api=api.slice(0,api.indexOf(start))+draft.slice(draft.indexOf(start),draft.indexOf(end))+api.slice(api.indexOf(end))}
api=api.replace("'&select=user_id,owner_id') as Array<Json> : [];", "'&select=user_id,owner_id,allowed_dog_ids') as Array<Json> : [];");
api=api.replace('Number(link.owner_id)===Number(dog.owner_id)))','Number(link.owner_id)===Number(dog.owner_id) && (link.allowed_dog_ids==null || (link.allowed_dog_ids as number[]||[]).map(Number).includes(Number(dog.id)))))');
fs.writeFileSync('../api-v251.ts',api);
