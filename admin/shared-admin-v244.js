/* Injected only into the verified stable-v10-clean snapshot. */
function registrationLabelV244(profile,submission){
 const names=profile.registration_dog_names;
 return Array.isArray(names)&&names.length===2?'Majiteľ pri registrácii uviedol 2 psíkov: '+names.join(' a '):(names?.[0]||submission?.dog_name||'neuvedený');
}
(function adminSharedV244(){
 function dialog(title){const el=document.createElement('div');el.className='modal';el.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.4);display:grid;place-items:center;padding:calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px)';el.innerHTML='<div class="card stack" style="width:min(100%,520px);max-height:100%;overflow-y:auto"><h3></h3><div data-body></div><p class="error" role="alert" data-error></p><button type="button" class="btn secondary full" data-close>Späť</button></div>';el.querySelector('h3').textContent=title;document.body.append(el);return {el,body:el.querySelector('[data-body]'),error:el.querySelector('[data-error]'),close:()=>el.remove()}}
 async function rpc(name,args){const {data,error}=await withJwtRetry(()=>supabase.rpc(name,args));if(error)throw Error(error.message);return data}
 async function verifyDog(userId,dogId){
  const profile=state.customerProfiles.find(p=>p.user_id===userId),dog=state.dogs.find(d=>Number(d.id)===dogId);
  if(!profile||!dog?.owner_id){alert('Psík alebo jeho overený majiteľ chýba. Doplňte údaje existujúceho psa.');return false}
  return new Promise(resolve=>{const d=dialog('Overiť priradenie psíka');let busy=false;
   d.body.innerHTML='<div class="stack"><strong>'+esc(dog.name)+'</strong><p>'+esc(dog.owners?.name||'Majiteľ v evidencii')+' · '+esc(dog.owners?.phone||'')+'</p><p>Účet: '+esc(profile.full_name||profile.email)+'</p><label><input type="checkbox" data-intro> Úvodná návšteva prebehla a prístup možno schváliť.</label><label>Overenie vlastníctva<textarea class="input" data-note placeholder="Napr. osobne overené s majiteľom"></textarea></label><button type="button" class="btn full" data-save>Potvrdiť priradenie</button></div>';
   d.el.querySelector('[data-close]').onclick=()=>{if(!busy){d.close();resolve(false)}};
   d.body.querySelector('[data-save]').onclick=async()=>{if(busy)return;busy=true;d.body.querySelector('[data-save]').disabled=true;
    try{await rpc('portal_link_dog_verified_v244',{p_user_id:userId,p_dog_id:dogId,p_owner_id:Number(dog.owner_id),p_intro_confirmed:d.body.querySelector('[data-intro]').checked,p_ownership_note:d.body.querySelector('[data-note]').value});d.close();resolve(true)}catch(e){d.error.textContent=e.message}finally{busy=false;d.body.querySelector('[data-save]')?.removeAttribute('disabled')}
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
  const button=event.target.closest('.link-customer-dog,.v42-owner-approve,[data-manual-dog-v244]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();if(button.disabled)return;
  const userId=button.dataset.customerUser,profile=state.customerProfiles.find(p=>p.user_id===userId);if(!profile)return;
  const manual=button.hasAttribute('data-manual-dog-v244');let dogId;
  if(manual){
   const allowedOwners=state.customerOwnerLinks.filter(l=>l.user_id===userId).map(l=>Number(l.owner_id));
   const candidates=state.dogs.filter(d=>d.active&&allowedOwners.includes(Number(d.owner_id)));
   dogId=await new Promise(resolve=>{const d=dialog('Priradiť existujúceho psíka');d.body.innerHTML='<select class="input" data-dog><option value="">Vyberte psíka</option>'+candidates.map(dog=>'<option value="'+dog.id+'">'+esc(dog.name)+'</option>').join('')+'</select><button class="btn full" type="button" data-pick>Pokračovať</button>';d.el.querySelector('[data-close]').onclick=()=>{d.close();resolve(0)};d.body.querySelector('[data-pick]').onclick=()=>{const id=Number(d.body.querySelector('[data-dog]').value);if(id){d.close();resolve(id)}}});
  }else{
   const root=button.closest('.note')||document;dogId=Number(root.querySelector('.customer-dog-select,.v42-owner-dog')?.value);
  }
  if(!dogId)return;button.disabled=true;
  try{const ok=await verifyDog(userId,dogId);if(ok&&!manual&&profile.registration_dog_names?.length===2)await secondDog(userId,dogId);await loadData();}finally{button.disabled=false}
 },true);
 const original=window.registeredOwnerCompactHtml;
 if(original){window.registeredOwnerCompactHtml=registeredOwnerCompactHtml=function(profile,dogs,cls){return original(profile,dogs,cls).replace('</details>','<button type="button" class="btn secondary compact" data-manual-dog-v244 data-customer-user="'+esc(profile.user_id)+'">Priradiť ďalšieho psíka</button></details>')}}
 function memberships(pass){return [...new Set([Number(pass.dog_id),...(pass.pass_dogs||[]).map(m=>Number(m.dog_id))])]}
 function names(pass){return memberships(pass).map(id=>state.dogs.find(d=>Number(d.id)===id)?.name||'Psík').join(' a ')}
 window.indexSharedPassesV244=function(rows){const map=new Map();for(const pass of rows||[])for(const id of memberships(pass)){if(!map.has(id))map.set(id,[]);map.get(id).push(pass)}return map};
 window.sharedPassNamesV244=names;
 // Pass-wide history remains one ledger, with dog IDs on each visit and reservation.
 window.openSharedPassLedgerV244=async function(passId){const d=dialog('História spoločnej permanentky');d.el.querySelector('[data-close]').onclick=d.close;
  try{const [pass,used,planned,requests]=await Promise.all([
   withJwtRetry(()=>supabase.from('passes').select('id,dog_id,total_entries,used_entries,purchased_on,purchase_price,valid_from,valid_until,status,pass_dogs(dog_id)').eq('id',passId).single()),
   withJwtRetry(()=>supabase.from('visits').select('id,dog_id,visit_date,reservation_id,pass_entry_number').eq('pass_id',passId).order('visit_date').order('pass_entry_number')),
   withJwtRetry(()=>supabase.from('reservations').select('id,dog_id,reservation_date,planned_entry_number,status').eq('pass_id',passId).eq('status','booked').order('reservation_date')),
   withJwtRetry(()=>supabase.from('customer_booking_requests').select('id,dog_id,reservation_date,projected_entry_number').eq('projected_pass_id',passId).eq('status','pending').order('reservation_date'))]);
   for(const r of [pass,used,planned,requests])if(r.error)throw Error(r.error.message);const p=pass.data;
   d.body.innerHTML='<strong>'+esc(names(p))+' · '+p.used_entries+'/'+p.total_entries+'</strong><p>Kúpa '+esc(skDate(p.purchased_on))+' · '+Number(p.purchase_price)+' € · '+esc(p.status)+'</p><p>'+(p.valid_from?'Platnosť '+esc(skDate(p.valid_from))+' – '+esc(skDate(p.valid_until)):'Platnosť začne prvým využitím')+'</p><div class="stack">'+[...used.data.map(r=>({...r,date:r.visit_date,n:r.pass_entry_number,label:'Využitý · návšteva '+r.id+' · rezervácia '+r.reservation_id})),...planned.data.map(r=>({...r,date:r.reservation_date,n:r.planned_entry_number,label:'Naplánovaný · rezervácia '+r.id})),...requests.data.map(r=>({...r,date:r.reservation_date,n:r.projected_entry_number,label:'Čaká · žiadosť '+r.id}))].map(r=>'<div class="note"><strong>'+esc(state.dogs.find(dog=>Number(dog.id)===Number(r.dog_id))?.name)+' · '+esc(skDate(r.date))+' · '+r.n+'/'+p.total_entries+'</strong><small>'+esc(r.label)+'</small></div>').join('')+'</div>';
  }catch(e){d.error.textContent=e.message}
 };
 document.addEventListener('click',event=>{const b=event.target.closest('[data-shared-pass-v244]');if(b){event.preventDefault();event.stopPropagation();void window.openSharedPassLedgerV244(Number(b.dataset.sharedPassV244))}});
})();
// Grouped approval is explicit; the server approves both dogs for this day atomically.
document.addEventListener('click',async event=>{
 const b=event.target.closest('.approve-customer-booking,.v42-booking-action');if(!b||b.dataset.decision==='reject'||b.dataset.kind==='taxi')return;
 const request=state.customerBookings.find(q=>Number(q.id)===Number(b.dataset.requestId));if(!request?.booking_group_id)return;
 event.preventDefault();event.stopImmediatePropagation();
 const group=state.customerBookings.filter(q=>q.booking_group_id===request.booking_group_id&&['pending','approved'].includes(q.status));
 if(!confirm('Schváliť spoločnú rezerváciu pre '+group.map(q=>dogById(q.dog_id)?.name||'Psík').join(' a ')+' na '+skDate(request.reservation_date)+'?'))return;
 b.disabled=true;try{const {error}=await withJwtRetry(()=>supabase.rpc('portal_approve_booking_group_v244',{p_group_id:request.booking_group_id}));if(error)throw error;await loadData()}catch(e){alert(e.message||'Spoločné schválenie sa nepodarilo.')}finally{b.disabled=false}
},true);
