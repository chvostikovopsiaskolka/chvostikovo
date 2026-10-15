/* Preview-only V241: two dogs under one approved customer account.
 * This feature is display-only; shared pass accounting is intentionally NOT enabled.
 * Existing single-dog DOM and booking semantics stay unchanged.
 */
(function initDualDogOverviewV241(){
  'use strict';
  const rootId='bookingMultiDogsV241';
  const dogColor=(dog)=>String(dog?.sex||'').toLowerCase()==='male'?'male':String(dog?.sex||'').toLowerCase()==='female'?'female':'neutral';
  function selectDualDog(id){
    if(!state?.data?.dogs?.some(d=>Number(d.id)===id)||Number(state.selectedDogId)===id)return;
    if(typeof clearVaccinationProofStageV104==='function')clearVaccinationProofStageV104();
    state.selectedDogId=id;
    renderDogSelector();renderPassSummary();renderDog();renderUpcoming();renderDays();
  }
  function renderDualDogOverview(){
    const root=document.getElementById('bookingDogProfile');
    const identity=root?.querySelector('.dog-overview-identity');
    if(!root||!identity)return;
    const dogs=state?.data?.dogs||[];
    let holder=document.getElementById(rootId);
    if(dogs.length!==2){
      root.classList.remove('dual-dog-v241');
      holder?.remove();
      return;
    }
    root.classList.add('dual-dog-v241');
    if(!holder){
      holder=document.createElement('div');
      holder.id=rootId;
      holder.className='dual-dog-choices-v241';
      holder.setAttribute('role','group');
      holder.setAttribute('aria-label','Moji psíkovia');
      identity.insertBefore(holder,identity.firstChild);
      holder.addEventListener('click',event=>{
        const button=event.target.closest('button[data-dual-dog-id]');
        if(!button||!holder.contains(button))return;
        selectDualDog(Number(button.dataset.dualDogId));
      });
    }
    const selected=Number(state.selectedDogId);
    const liveIds=new Set(dogs.map(d=>String(d.id)));
    for(const old of holder.querySelectorAll('button[data-dual-dog-id]')){
      if(!liveIds.has(old.dataset.dualDogId))old.remove();
    }
    for(const dog of dogs){
      const id=String(dog.id);
      let button=Array.from(holder.children).find(el=>el.dataset.dualDogId===id);
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='dual-dog-choice-v241';
        button.dataset.dualDogId=id;
        const photo=document.createElement('span');
        photo.className='dual-dog-picture-v241';
        const label=document.createElement('span');
        label.className='dual-dog-name-v241';
        button.append(photo,label);
      }
      button.classList.toggle('selected-v241',Number(dog.id)===selected);
      button.classList.toggle('female-v241',dogColor(dog)==='female');
      button.classList.toggle('male-v241',dogColor(dog)==='male');
      button.setAttribute('aria-pressed',Number(dog.id)===selected?'true':'false');
      button.setAttribute('aria-label','Zobraziť psíka '+String(dog.name||''));
      const photo=button.querySelector('.dual-dog-picture-v241');
      const label=button.querySelector('.dual-dog-name-v241');
      const photoUrl=typeof dog.photo_url==='string'?dog.photo_url:'';
      if(photo.dataset.url!==photoUrl){
        photo.replaceChildren();
        photo.dataset.url=photoUrl;
        if(photoUrl){
          const img=document.createElement('img');
          img.alt='';
          img.loading='eager';
          img.decoding='async';
          img.src=photoUrl;
          img.addEventListener('error',()=>{if(img.isConnected)photo.textContent='🐾'},{once:true});
          photo.appendChild(img);
        }else photo.textContent='🐾';
      }
      label.textContent=String(dog.name||'Psík');
      holder.appendChild(button);
    }
  }
  if(typeof customerHooks!=='undefined'&&Array.isArray(customerHooks.afterRenderDog)){
    customerHooks.afterRenderDog.push(renderDualDogOverview);
    if(typeof state!=='undefined'&&state.data)renderDualDogOverview();
  }
})();
