/* All attachment choices stay in the existing owner card; no additional modal. */
function requestedDogNamesV251(profile,submission){const raw=profile.registration_dog_names||String(submission?.dog_name||'').split(',');const names=raw.map(x=>String(x).trim().replace(/\s+/g,' '));return names.length<=2&&names.every(x=>x.length>0&&x.length<=50)&&new Set(names.map(x=>x.toLocaleLowerCase('sk'))).size===names.length?names:[]}
function registrationLabelV251(profile,submission){const names=requestedDogNamesV251(profile,submission);return names.length===2?'Majiteľ pri registrácii uviedol 2 psíkov: '+names.join(' a '):names[0]||submission?.dog_name||'neuvedený'}
function assignedDogsV251(userId){return state.dogs.filter(d=>state.customerOwnerLinks.some(l=>l.user_id===userId&&Number(l.owner_id)===Number(d.owner_id)&&(l.allowed_dog_ids==null||l.allowed_dog_ids.map(Number).includes(Number(d.id)))))}
window.assignedDogsV251=assignedDogsV251;window.registrationLabelV251=registrationLabelV251;
function ownerDogFieldsV252(profile,manual=false){
 const assigned=assignedDogsV251(profile.user_id),sub=state.customerDogSubmissions.find(s=>s.user_id===profile.user_id),pair=!manual&&requestedDogNamesV251(profile,sub).length===2;
 const candidates=state.dogs.filter(d=>d.active&&d.owner_id&&(!manual||assigned.length<2&&assigned.some(a=>Number(a.owner_id)===Number(d.owner_id))&&!assigned.some(a=>Number(a.id)===Number(d.id))));
 const options=candidates.map(d=>'<option value="'+Number(d.id)+'">'+esc(d.name)+' · '+esc(d.owners?.name||'Majiteľ v evidencii')+'</option>').join('');
 return '<div class="stack owner-link-inline-v252" data-link-user="'+esc(profile.user_id)+'"><label><select class="input" aria-label="Vybrať psíka" data-first-v252><option value="">Vyberte existujúceho psíka</option>'+options+'</select></label>'+(pair?'<button class="btn secondary compact" type="button" data-add-second-v252 aria-expanded="false"><span class="owner-link-add-icon" aria-hidden="true">+</span><span>Pridať druhého psíka</span></button><label hidden data-second-wrap-v252><select class="input" aria-label="Vybrať druhého psíka" data-second-v252><option value="">Najprv vyberte prvého psíka</option></select></label>':'')+'<p class="error small" data-link-error-v252 role="alert" hidden></p><button class="btn compact" type="button" data-approve-v252>Schváliť</button></div>';
}
window.ownerDogFieldsV252=ownerDogFieldsV252;
(function inlineOwnerLinksV252(){
 const original=window.registeredOwnerCompactHtml;
 if(original)window.registeredOwnerCompactHtml=registeredOwnerCompactHtml=function(profile,dogs,cls){const html=original(profile,dogs,cls);if(dogs.length!==1)return html;return html.replace('</details>','<button type="button" class="btn secondary compact" data-manual-v252 data-customer-user="'+esc(profile.user_id)+'">Priradiť ďalšieho psíka</button><div data-manual-fields-v252 hidden></div></details>')};
 function secondOptions(root){const first=state.dogs.find(d=>Number(d.id)===Number(root.querySelector('[data-first-v252]').value)),select=root.querySelector('[data-second-v252]');if(!select)return;select.innerHTML='<option value="">Vyberte druhého psíka</option>'+state.dogs.filter(d=>d.active&&first?.owner_id&&Number(d.owner_id)===Number(first.owner_id)&&Number(d.id)!==Number(first.id)).map(d=>'<option value="'+Number(d.id)+'">'+esc(d.name)+' · '+esc(d.owners?.name||'Majiteľ v evidencii')+'</option>').join('');}
 document.addEventListener('change',e=>{if(e.target.matches('[data-first-v252]')){const root=e.target.closest('[data-link-user]');secondOptions(root);root.querySelector('[data-link-error-v252]').hidden=true}});
 const busyUsers=new Set();
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-add-second-v252],[data-approve-v252],[data-manual-v252]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.disabled)return;
  if(b.hasAttribute('data-manual-v252')){const profile=state.customerProfiles.find(p=>p.user_id===b.dataset.customerUser),box=b.parentElement.querySelector('[data-manual-fields-v252]');if(!profile||!box)return;box.innerHTML=ownerDogFieldsV252(profile,true);box.hidden=false;b.hidden=true;return}
  const root=b.closest('[data-link-user]');if(!root)return;
  if(b.hasAttribute('data-add-second-v252')){const box=root.querySelector('[data-second-wrap-v252]');box.hidden=!box.hidden;b.innerHTML=box.hidden?'<span class="owner-link-add-icon" aria-hidden="true">+</span><span>Pridať druhého psíka</span>':'<span class="owner-link-add-icon" aria-hidden="true">−</span><span>Ponechať iba jedného</span>';b.setAttribute('aria-expanded',String(!box.hidden));secondOptions(root);return}
  const error=root.querySelector('[data-link-error-v252]'),first=Number(root.querySelector('[data-first-v252]').value),secondWrap=root.querySelector('[data-second-wrap-v252]'),two=secondWrap&&!secondWrap.hidden,second=Number(root.querySelector('[data-second-v252]')?.value||0),userId=root.dataset.linkUser;
  error.hidden=true;if(!first||two&&!second){error.textContent=two?'Vyberte oboch psíkov alebo ponechajte iba jedného.':'Vyberte existujúceho psíka.';error.hidden=false;return}if(busyUsers.has(userId))return;
  busyUsers.add(userId);const controls=[...root.querySelectorAll('button,select')];controls.forEach(c=>c.disabled=true);
  let saved=false;try{const {error:rpcError}=await withJwtRetry(()=>supabase.rpc('portal_link_dogs_inline_v252',{p_user_id:userId,p_dog_ids:two?[first,second]:[first],p_intro_confirmed:true}));if(rpcError)throw rpcError;saved=true;await loadData();window.refreshAdminDashboardV63?.();queueAdminLive('accounts',40);if(document.getElementById('adminDashboardModalV41')?.contains(root))document.getElementById('adminDashboardModalCloseV41')?.click();}
  catch(err){error.textContent=saved?'Priradenie je uložené. Prehľad sa nepodarilo obnoviť; otvorte ho znova.':err.message||'Priradenie sa nepodarilo. Skúste znova.';error.hidden=false}
  finally{busyUsers.delete(userId);if(!saved)controls.forEach(c=>c.disabled=false)}
 },true);
})();
