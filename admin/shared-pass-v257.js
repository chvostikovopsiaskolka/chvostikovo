/* Pass-only extension. Existing owner linking and modal workflows are untouched. */
function sharedPassNamesV257(p){return [...new Set([Number(p.dog_id),...(p.pass_dogs||[]).map(m=>Number(m.dog_id))])].map(id=>state.dogs.find(d=>Number(d.id)===id)?.name||'Psík').join(' a ')}
function indexSharedPassesV257(rows){const map=new Map();for(const p of rows||[])for(const id of new Set([Number(p.dog_id),...(p.pass_dogs||[]).map(m=>Number(m.dog_id))])){if(!map.has(id))map.set(id,[]);map.get(id).push(p)}return map}
function sharedGroupPendingV257(r){return r.booking_group_id&&(state.customerBookings||[]).filter(q=>q.booking_group_id===r.booking_group_id&&q.status==='pending').length>1}
const completeBookingBeforeSharedV257=window.completeAdminBookingDecision;
if(completeBookingBeforeSharedV257)window.completeAdminBookingDecision=function(id,...args){const group=(state.customerBookings||[]).find(r=>Number(r.id)===Number(id))?.booking_group_id;const result=completeBookingBeforeSharedV257(id,...args);if(group)void loadData();return result};
async function loadDogPassHistoryV257(id){
 const members=await withJwtRetry(()=>supabase.from('pass_dogs').select('pass_id').eq('dog_id',id));if(members.error)return members;
 const ids=[...new Set((members.data||[]).map(m=>Number(m.pass_id)))];
 return withJwtRetry(()=>{let q=supabase.from('passes').select('id,dog_id,total_entries,used_entries,purchased_on,purchase_price,valid_from,valid_until,no_expiry,status,source,created_at,pass_dogs(dog_id)');q=ids.length?q.or('dog_id.eq.'+Number(id)+',id.in.('+ids.join(',')+')'):q.eq('dog_id',id);return q.neq('status','cancelled').order('created_at')});
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-shared-ledger-v257]');if(!button)return;event.preventDefault();event.stopPropagation();
 const passId=Number(button.dataset.sharedLedgerV257),root=button.closest('[data-pass-card]')?.querySelector('[data-shared-ledger-body-v257]');if(!root||button.disabled)return;
 button.disabled=true;root.textContent='Načítavam čerpanie…';
 try{
  const rows=await Promise.all([
   withJwtRetry(()=>supabase.from('visits').select('id,dog_id,visit_date,reservation_id,pass_entry_number').eq('pass_id',passId).order('visit_date')),
   withJwtRetry(()=>supabase.from('reservations').select('id,dog_id,reservation_date,planned_entry_number').eq('pass_id',passId).eq('status','booked').order('reservation_date')),
   withJwtRetry(()=>supabase.from('customer_booking_requests').select('id,dog_id,reservation_date,projected_entry_number').eq('projected_pass_id',passId).eq('status','pending').order('reservation_date'))
  ]);for(const r of rows)if(r.error)throw r.error;
  const entries=[...rows[0].data.map(r=>({...r,day:r.visit_date,n:r.pass_entry_number,label:'Využitý · návšteva '+r.id+' · rezervácia '+r.reservation_id})),...rows[1].data.map(r=>({...r,day:r.reservation_date,n:r.planned_entry_number,label:'Plánovaný · rezervácia '+r.id})),...rows[2].data.map(r=>({...r,day:r.reservation_date,n:r.projected_entry_number,label:'Čaká na schválenie · žiadosť '+r.id}))].sort((a,b)=>a.day.localeCompare(b.day)||a.n-b.n);
  root.innerHTML=entries.length?entries.map(r=>'<div class="note"><strong>'+esc(dogById(r.dog_id)?.name||'Psík')+' · '+esc(skDate(r.day))+' · vstup '+Number(r.n)+'</strong><div class="muted small">'+esc(r.label)+'</div></div>').join(''):'<div class="muted small">Zatiaľ bez čerpaní a plánovaných vstupov.</div>';
 }catch(e){root.textContent=e.message||'Históriu sa nepodarilo načítať.'}finally{button.disabled=false}
});
