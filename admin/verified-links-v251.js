/* Injected only into the verified stable-v10-clean snapshot. */
function requestedDogNamesV251(profile,submission){const raw=profile.registration_dog_names||String(submission?.dog_name||'').split(',');const names=raw.map(x=>String(x).trim().replace(/\s+/g,' '));return names.length<=2&&names.every(x=>x.length>0&&x.length<=50)&&new Set(names.map(x=>x.toLocaleLowerCase('sk'))).size===names.length?names:[]}
function registrationLabelV251(profile,submission){const names=requestedDogNamesV251(profile,submission);return names.length===2?'Majiteľ pri registrácii uviedol 2 psíkov: '+names.join(' a '):names[0]||submission?.dog_name||'neuvedený'}
function assignedDogsV251(userId){return state.dogs.filter(d=>state.customerOwnerLinks.some(l=>l.user_id===userId&&Number(l.owner_id)===Number(d.owner_id)&&(l.allowed_dog_ids==null||l.allowed_dog_ids.map(Number).includes(Number(d.id)))))}
window.assignedDogsV251=assignedDogsV251;window.registrationLabelV251=registrationLabelV251;
(function adminSharedV251(){
 function dialog(title){const el=document.createElement('div');el.className='modal';el.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.4);display:grid;place-items:center;padding:calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px)';el.innerHTML='<div class="card stack" style="width:min(100%,520px);max-height:100%;overflow-y:auto"><h3></h3><div data-body></div><p class="error" role="alert" data-error></p><button type="button" class="btn secondary full" data-close>Späť</button></div>';el.querySelector('h3').textContent=title;document.body.append(el);return {el,body:el.querySelector('[data-body]'),error:el.querySelector('[data-error]'),close:()=>el.remove()}}
 async function rpc(name,args){const {data,error}=await withJwtRetry(()=>supabase.rpc(name,args));if(error)throw Error(error.message);return data}
 async function verifyDog(userId,dogId){
  const profile=state.customerProfiles.find(p=>p.user_id===userId),dog=state.dogs.find(d=>Number(d.id)===dogId);
  if(!profile||!dog?.owner_id){alert('Psík alebo jeho overený majiteľ chýba. Doplňte údaje existujúceho psa.');return false}
  return new Promise(resolve=>{const d=dialog('Overiť priradenie psíka');let busy=false;
   d.body.innerHTML='<div class="stack"><strong>'+esc(dog.name)+'</strong><p>'+esc(dog.owners?.name||'Majiteľ v evidencii')+' · '+esc(dog.owners?.phone||'')+'</p><p>Účet: '+esc(profile.full_name||profile.email)+'</p><label><input type="checkbox" data-intro> Úvodná návšteva prebehla a prístup možno schváliť.</label><label>Overenie vlastníctva<textarea class="input" data-note placeholder="Napr. osobne overené s majiteľom"></textarea></label><button type="button" class="btn full" data-save>Potvrdiť priradenie</button></div>';
   d.el.querySelector('[data-close]').onclick=()=>{if(!busy){d.close();resolve(false)}};
   d.body.querySelector('[data-save]').onclick=async()=>{if(busy)return;busy=true;d.body.querySelector('[data-save]').disabled=true;
    try{await rpc('portal_link_dog_verified_v251',{p_user_id:userId,p_dog_id:dogId,p_owner_id:Number(dog.owner_id),p_intro_confirmed:d.body.querySelector('[data-intro]').checked,p_ownership_note:d.body.querySelector('[data-note]').value});d.close();resolve(true)}catch(e){d.error.textContent=e.message}finally{busy=false;d.body.querySelector('[data-save]')?.removeAttribute('disabled')}
   };
  });
 }
 async function secondDog(userId,firstDogId){
  const first=state.dogs.find(d=>Number(d.id)===firstDogId),candidates=state.dogs.filter(d=>d.active&&Number(d.owner_id)===Number(first?.owner_id)&&Number(d.id)!==firstDogId);
  return new Promise(resolve=>{const d=dialog('Chcete tomuto majiteľovi priradiť aj druhého psíka?');
   d.body.innerHTML='<div class="stack"><button type="button" class="btn full" data-yes>Áno, priradiť druhého</button><button type="button" class="btn secondary full" data-no>Nie, iba jedného</button></div>';
   const finish=()=>{d.close();resolve()};d.el.querySelector('[data-close]').onclick=finish;d.body.querySelector('[data-no]').onclick=finish;
   d.body.querySelector('[data-yes]').onclick=()=>{
    d.body.innerHTML='<div class="stack">'+(candidates.length?'<label>Druhý existujúci psík<select class="input" data-dog><option value="">Vyberte psíka</option>'+candidates.map(dog=>'<option value="'+dog.id+'">'+esc(dog.name)+'</option>').join('')+'</select></label><button type="button" class="btn full" data-assign>Overiť a priradiť</button>':'<p>Druhého psa nemožno bezpečne identifikovať. Prvý zostáva priradený. Overte jeho záznam a dokončite priradenie manuálne.</p>')+'</div>';
    d.body.querySelector('[data-assign]')?.addEventListener('click',async()=>{const id=Number(d.body.querySelector('[data-dog]').value);if(!id){d.error.textContent='Vyberte existujúceho psíka.';return}d.el.style.display='none';if(await verifyDog(userId,id))finish();else d.el.style.display='grid'});
   };
  });
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('.link-customer-dog,.v42-owner-approve,[data-manual-dog-v251]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();if(button.disabled)return;
  const userId=button.dataset.customerUser,profile=state.customerProfiles.find(p=>p.user_id===userId);if(!profile)return;
  const manual=button.hasAttribute('data-manual-dog-v251');let dogId;
  if(manual){
   const allowedOwners=state.customerOwnerLinks.filter(l=>l.user_id===userId).map(l=>Number(l.owner_id));
   const assigned=assignedDogsV251(userId);const candidates=assigned.length>=2?[]:state.dogs.filter(d=>d.active&&allowedOwners.includes(Number(d.owner_id))&&!assigned.some(a=>Number(a.id)===Number(d.id)));
   dogId=await new Promise(resolve=>{const d=dialog('Priradiť existujúceho psíka');d.body.innerHTML='<select class="input" data-dog><option value="">Vyberte psíka</option>'+candidates.map(dog=>'<option value="'+dog.id+'">'+esc(dog.name)+'</option>').join('')+'</select><button class="btn full" type="button" data-pick>Pokračovať</button>';d.el.querySelector('[data-close]').onclick=()=>{d.close();resolve(0)};d.body.querySelector('[data-pick]').onclick=()=>{const id=Number(d.body.querySelector('[data-dog]').value);if(id){d.close();resolve(id)}}});
  }else{
   const root=button.closest('.note')||document;dogId=Number(root.querySelector('.customer-dog-select,.v42-owner-dog')?.value);if(!dogId){alert('Najprv vyberte existujúceho psíka.');return}
  }
  if(!dogId)return;button.disabled=true;
  try{const ok=await verifyDog(userId,dogId);if(ok&&!manual&&requestedDogNamesV251(profile,state.customerDogSubmissions.find(s=>s.user_id===userId)).length===2)await secondDog(userId,dogId);await loadData();if(ok&&button.classList.contains('v42-owner-approve'))document.getElementById('adminDashboardModalCloseV41')?.click();window.refreshAdminDashboardV63?.();queueAdminLive('accounts',40);}catch(e){alert(e.message||'Priradenie sa nepodarilo.')}finally{button.disabled=false}
 },true);
 const original=window.registeredOwnerCompactHtml;
 if(original){window.registeredOwnerCompactHtml=registeredOwnerCompactHtml=function(profile,dogs,cls){if(dogs.length>=2)return original(profile,dogs,cls);return original(profile,dogs,cls).replace('</details>','<button type="button" class="btn secondary compact" data-manual-dog-v251 data-customer-user="'+esc(profile.user_id)+'">Priradiť ďalšieho psíka</button></details>')}}

})();