function passAllowsDogV244(pass,dogId){return Number(pass.dog_id)===Number(dogId)||(pass.dog_ids||[]).map(Number).includes(Number(dogId))}
function sharedDialogV244(title){
 const modal=document.createElement('div');modal.className='legal-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.innerHTML='<div class="legal-card shared-card-v244"><h2></h2><div class="shared-content-v244"></div><p class="shared-error-v244" role="alert"></p><button type="button" class="btn secondary full shared-close-v244">Späť</button></div>';
 modal.querySelector('h2').textContent=title;document.body.append(modal);
 return {modal,body:modal.querySelector('.shared-content-v244'),error:modal.querySelector('.shared-error-v244'),close:()=>modal.remove()};
}
async function sharedRpcV244(name,body){
 const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await r.json().catch(()=>null);if(!r.ok)throw new Error(data?.message||'Požiadavku sa nepodarilo dokončiť. Skúste znova.');return data;
}
window.requestPassDialogV244=function(dogId){return new Promise(resolve=>{
 const dogs=state.data?.dogs||[],d=sharedDialogV244('Záujem o permanentku');let busy=false;const operation=crypto.randomUUID();
 const finish=row=>{d.close();resolve(row)};d.modal.querySelector('.shared-close-v244').onclick=()=>{if(!busy)finish(null)};
 d.body.innerHTML='<label>Pre koho je permanentka?</label><select class="input" data-scope><option value="">Vyberte psíka alebo spoločnú permanentku</option>'+dogs.map(dog=>'<option value="'+dog.id+'">'+esc(dog.name)+' – individuálna</option>').join('')+(dogs.length===2?'<option value="both">'+dogs.map(dog=>esc(dog.name)).join(' a ')+' – spoločná</option>':'')+'</select><label>Počet vstupov</label><select class="input" data-total><option value="10">10 vstupov · 200 €</option><option value="20">20 vstupov · 320 €</option></select><p class="hint">Záujem spracuje personál. Odoslaním sa permanentka automaticky nekupuje. Platnosť začne prvým využitím.</p><button type="button" class="btn full" data-send>Odoslať záujem</button>';
 if(dogs.length===1)d.body.querySelector('[data-scope]').value=String(dogId);
 d.body.querySelector('[data-send]').onclick=async()=>{
  const scope=d.body.querySelector('[data-scope]').value;if(!scope){d.error.textContent='Vyberte, pre koho je permanentka.';return}
  const ids=scope==='both'?dogs.map(dog=>Number(dog.id)):[Number(scope)];busy=true;d.body.querySelector('[data-send]').disabled=true;d.error.textContent='';
  try{const result=await sharedRpcV244('portal_request_pass_v244',{p_dog_ids:ids,p_total_entries:Number(d.body.querySelector('[data-total]').value),p_operation_id:operation});
   const row=Array.isArray(result)?result[0]:result;
   state.data.pass_requests=state.data.pass_requests||[];if(!state.data.pass_requests.some(r=>Number(r.id)===Number(row.id)))state.data.pass_requests.unshift(row);
   queueCustomerSync('all',80);toast('Záujem o permanentku sme prijali. Spracuje ho personál.');finish(row);
  }catch(e){d.error.textContent=e.message}finally{busy=false;d.body.querySelector('[data-send]')?.removeAttribute('disabled')}
 };
})};
window.submitSharedBookingV244=function(ids,dates,taxiByDate){return new Promise(resolve=>{
 const dogs=(state.data?.dogs||[]).filter(dog=>ids.includes(Number(dog.id))),d=sharedDialogV244('Skontrolujte rezerváciu');let busy=false,quote=null;
 const operation=crypto.randomUUID(),items=[];
 const finish=result=>{d.close();resolve(result)};d.modal.querySelector('.shared-close-v244').onclick=()=>{if(!busy)finish(null)};
 for(const date of dates)for(const dog of dogs)items.push({dog_id:Number(dog.id),date,taxi_mode:dogs.length===1?(taxiByDate.get(date)||'none'):'none',billing_choice:'auto'});
 d.body.innerHTML=items.map((item,i)=>{const dog=dogs.find(dog=>Number(dog.id)===item.dog_id);return '<div class="shared-booking-row-v244"><strong>'+esc(dog.name)+' · '+esc(skDate(item.date))+'</strong><label>Taxi<select class="input" data-taxi="'+i+'"><option value="none">Bez taxi</option><option value="pickup">Jeden smer · 5 €</option><option value="pickup_dropoff">Oba smery · 10 €</option></select></label><label>Úhrada<select class="input" data-billing="'+i+'"><option value="auto">Dostupná permanentka, inak jednorazovo</option><option value="single">Jednorazový vstup · 25 €</option></select></label><p data-allocation="'+i+'"></p></div>'}).join('')+'<button type="button" class="btn full" data-review>Skontrolovať dostupné vstupy</button><button type="button" class="btn full hidden" data-confirm>Potvrdiť rezerváciu</button>';
 items.forEach((item,i)=>{d.body.querySelector('[data-taxi="'+i+'"]').value=item.taxi_mode});
 const reset=()=>{quote=null;d.body.querySelector('[data-confirm]').classList.add('hidden');d.body.querySelector('[data-review]').classList.remove('hidden')};
 d.body.querySelectorAll('select').forEach(el=>el.onchange=reset);
 d.body.querySelector('[data-review]').onclick=async()=>{
  if(busy)return;busy=true;d.error.textContent='';d.body.querySelector('[data-review]').disabled=true;
  items.forEach((item,i)=>{item.taxi_mode=d.body.querySelector('[data-taxi="'+i+'"]').value;item.billing_choice=d.body.querySelector('[data-billing="'+i+'"]').value});
  try{const response=await api({action:'shared_booking_v244',items,operation_id:null});quote=response.data.quote;
   items.forEach((item,i)=>{const row=quote.find(r=>Number(r.dog_id)===item.dog_id&&r.date===item.date);if(!row)throw Error('Niektorý psík chýba v rozdelení vstupov.');
    d.body.querySelector('[data-allocation="'+i+'"]').textContent=row.mode==='pass'?'Permanentka: vstup '+row.entry_number+'/'+row.total:row.mode==='planned'?'Plánovaná permanentka: '+row.entry_number+'/'+row.total+' – čaká na schválenie kúpy':row.mode==='free'?'Voľný vstup':'Jednorazový vstup · 25 €';});
   d.body.querySelector('[data-confirm]').classList.remove('hidden');d.body.querySelector('[data-review]').classList.add('hidden');
  }catch(e){d.error.textContent=e.message;quote=null}finally{busy=false;d.body.querySelector('[data-review]').disabled=false}
 };
 d.body.querySelector('[data-confirm]').onclick=async()=>{
  if(busy||!quote)return;busy=true;d.body.querySelector('[data-confirm]').disabled=true;d.error.textContent='';
  try{const response=await api({action:'shared_booking_v244',items,operation_id:operation,expected:quote});
   if(!response.data.committed||response.data.bookings.length!==items.length)throw Error('Výsledok rezervácie je neúplný. Obnovte údaje.');
   for(const row of response.data.bookings)applyLocalBooking({data:row},{...row,can_manage:true});
   queueCustomerSync('all',80);finish(response.data);
  }catch(e){d.error.textContent=e.message;/* Keep operation + quote after a network error so retry is idempotent. */
   if(/zmenili/.test(e.message))reset();
  }finally{busy=false;d.body.querySelector('[data-confirm]')?.removeAttribute('disabled')}
 };
})};
function renderSharedBalanceV244(){
 const dog=selectedDog();if(!dog)return;const pass=activePassFor(dog.id);
 if(!pass||pass.dog_ids?.length!==2)return;
 const ids=pass.dog_ids.map(Number),names=(state.data?.dogs||[]).filter(d=>ids.includes(Number(d.id))).map(d=>d.name).join(' a ');
 const used=Number(pass.used_entries)||0,total=Number(pass.total_entries),today=bratislavaToday();
 const entries=new Map();
 for(const r of state.data.reservations||[])if(Number(r.pass_id)===Number(pass.id)&&r.status==='booked'&&r.reservation_date>=today)entries.set('r'+r.id,r);
 for(const q of state.data.requests||[])if(Number(q.projected_pass_id)===Number(pass.id)&&q.status==='pending'&&q.reservation_date>=today)entries.set('q'+q.id,q);
 const planned=entries.size,available=Math.max(0,total-used-planned);
 const pending=(state.data.pass_requests||[]).find(q=>q.status==='pending'&&(q.dog_ids||[]).some(id=>ids.includes(Number(id))));
 $('passSummary').innerHTML='<span>Spoločná permanentka</span><small>'+esc(names)+'</small><strong>'+used+'/'+total+'</strong><small>Zostáva '+Math.max(0,total-used)+' vstupov · voľných na rezerváciu '+available+'</small>'+(planned?'<small>Naplánované: '+planned+'</small>':'')+(pass.valid_until?'<small>Platí do '+esc(skDate(pass.valid_until))+'</small>':'<small>Platnosť začne prvým využitím</small>')+(pending?'<small>Ďalšia '+Number(pending.total_entries)+'-vstupová: čaká na schválenie</small>':'');
}
document.addEventListener('DOMContentLoaded',()=>{addCustomerHook('afterRenderPassSummary',renderSharedBalanceV244);addCustomerHook('afterRenderDog',renderSharedBalanceV244)});

document.addEventListener('DOMContentLoaded',()=>{
 window.sharedEnabledV244=false;
 window.sharedCapabilityReadyV244=fetch(SUPABASE_URL+'/rest/v1/rpc/portal_shared_capabilities_v244',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:'{}'}).then(r=>r.ok?r.json():null).then(data=>{
  window.sharedEnabledV244=data?.shared_passes_v244===true;
  const hint=document.getElementById('signupDogNamesHintV244');if(hint)hint.textContent=window.sharedEnabledV244?'Ak máte dvoch psíkov, zadajte ich mená oddelené čiarkou. Napríklad Bella, Aria.':'Po úvodnej návšteve vám personál priradí správneho psíka.';
  if(state.data)renderAll();
  return window.sharedEnabledV244;
 }).catch(()=>false);
});
