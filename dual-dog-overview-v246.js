/* v254: two square photographs and each dog's own compact information. */
(function dualDogOverviewV254(){
 const rootId='bookingMultiDogsV241';
 function openDog(id,action){
  if(!state.data?.dogs?.some(d=>Number(d.id)===id))return;
  if(Number(state.selectedDogId)!==id){clearVaccinationProofStageV104();state.selectedDogId=id;renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays()}
  if(action==='vaccinations')openDogDetails('vaccinations',false);
  else if(action==='visits')window.openDogVisitsV99?.();
  else if(action==='grades')openCustomerGradebook();
  else openDogDetails('details',false);
 }
 function render(){
  const root=document.getElementById('bookingDogProfile'),identity=root?.querySelector('.dog-overview-identity');if(!identity)return;
  const dogs=state.data?.dogs||[];let holder=document.getElementById(rootId);
  if(dogs.length!==2){root.classList.remove('dual-dog-v241');holder?.remove();return}
  root.classList.add('dual-dog-v241');
  if(!holder){holder=document.createElement('div');holder.id=rootId;holder.className='dual-dog-choices-v241';holder.setAttribute('aria-label','Moji psíkovia');identity.prepend(holder);holder.addEventListener('click',e=>{const b=e.target.closest('[data-dog-open-v254]');if(b)openDog(Number(b.dataset.dogOpenV254),b.dataset.action||'details')})}
  for(const dog of dogs){
   let panel=holder.querySelector('[data-dog-panel="'+Number(dog.id)+'"]');
   if(!panel){panel=document.createElement('article');panel.className='dual-dog-panel-v254';panel.dataset.dogPanel=String(dog.id);panel.innerHTML='<button type="button" class="dual-dog-photo-v254" data-action="details"><span class="dual-dog-picture-v241"></span><strong class="dual-dog-name-v241"></strong></button><div class="dual-dog-info-v254"><div class="dual-dog-pass-v254"></div><button type="button" data-action="vaccinations" class="dual-dog-status-v254"></button><button type="button" data-action="visits" class="dual-dog-visits-v254"></button><button type="button" data-action="grades" class="dual-dog-grades-v254"><svg aria-hidden="true"><use href="#ci-book"/></svg>Žiacka knižka</button></div>';holder.append(panel)}
   panel.querySelectorAll('button').forEach(b=>{b.dataset.dogOpenV254=String(dog.id)});
   panel.classList.toggle('male-v241',dog.sex==='male');
   const photo=panel.querySelector('.dual-dog-picture-v241');
   if(typeof updateDogPhotoV260==='function')updateDogPhotoV260(photo,dog,dog.name||'Psík');
   else {const key=[dog.id,dog.photo_path||String(dog.photo_url||'').split('?')[0],dog.photo_updated_at].join('|');if(photo.dataset.key!==key){photo.replaceChildren();photo.dataset.key=key;if(dog.photo_url){const img=document.createElement('img');img.alt=dog.name||'Psík';img.src=dog.photo_url;photo.append(img)}else photo.textContent='🐾'}}
   panel.querySelector('.dual-dog-name-v241').textContent=dog.name||'Psík';panel.querySelector('.dual-dog-photo-v254').setAttribute('aria-label','Údaje psíka '+dog.name);
   const today=typeof bratislavaToday==='function'?bratislavaToday():new Date().toISOString().slice(0,10);
   const completedToday=(state.data.passes||[]).find(p=>(typeof passAllowsDogV244==='function'?passAllowsDogV244(p,dog.id):Number(p.dog_id)===Number(dog.id))&&Number(p.used_entries)===Number(p.total_entries)&&(state.data.reservations||[]).some(r=>Number(r.dog_id)===Number(dog.id)&&Number(r.pass_id)===Number(p.id)&&r.status==='attended'&&r.reservation_date===today));
   const pass=completedToday||activePassFor(dog.id),planned=typeof plannedPassSummaryV162==='function'?plannedPassSummaryV162(dog.id):null;
   panel.querySelector('.dual-dog-pass-v254').innerHTML=pass?'<small>'+(pass.is_shared?'Spoločná · ':'')+(pass.status==='queued'?'Plánovaná permanentka':'Permanentka')+'</small><strong>'+Number(pass.used_entries||0)+' z '+Number(pass.total_entries)+'</strong>'+(pass.valid_until?'<small>Platí do '+skDate(pass.valid_until)+'</small>':''):planned?'<small>Plánovaná permanentka</small><strong>0 z '+Number(planned.total)+'</strong>':'<small>Vstup</small><strong>'+(dog.default_entry_type==='free'?'Bezplatný':'Jednorazový')+'</strong>';
   const valid=customerVaccinationsCompleteV96(dog),soon=(state.data.vaccinations||[]).filter(v=>Number(v.dog_id)===Number(dog.id)).some(v=>vaccinationValidityV96(v.valid_until).kind==='warning');
   const status=panel.querySelector('.dual-dog-status-v254');status.className='dual-dog-status-v254 dog-overview-status '+(!valid?'invalid':soon?'warning':'valid');status.innerHTML='<span class="overview-icon vacc-icon"><svg aria-hidden="true"><use href="#ci-'+(valid&&!soon?'check':'alert')+'"/></svg></span><span>'+(!valid?'Očkovania nie sú platné':soon?'Končí platnosť očkovania':'Platné očkovania')+'</span>';
   panel.querySelector('.dual-dog-visits-v254').textContent='Návštevy: '+totalVisits(dog);
  }
 }
 customerHooks.afterRenderDog.push(render);customerHooks.afterRenderPassSummary.push(render);
 if(state.data)render();
})();

