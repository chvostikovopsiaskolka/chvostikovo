async function decide(button){if(busy||button.disabled)return;const ids=[...new Set(String(button.dataset.reviewIds||'').split(',').map(Number))].filter(id=>Number.isSafeInteger(id)&&id>0),decision=button.dataset.review267,kind=button.dataset.reviewKind;if(!ids.length||!['approve','reject'].includes(decision)||!['taxi','booking'].includes(kind))return;
 if(decision==='reject'&&!confirm(ids.length>1?'Naozaj zamietnuť všetky vybrané požiadavky?':'Naozaj zamietnuť túto požiadavku?'))return;
 busy=true;document.querySelectorAll('[data-review267]').forEach(b=>b.disabled=true);let done=0;const processed=new Set();
 try{
  const selected=(state.customerBookings||[]).filter(q=>ids.includes(Number(q.id)));
  const multiDay=kind==='booking'&&decision==='approve'&&new Set(selected.map(q=>q.reservation_date)).size>1;
  if(multiDay){
   try{
    const result=await withJwtRetry(()=>supabase.rpc('portal_approve_booking_batch_v284',{p_request_ids:ids}));
    if(result.error)throw result.error;
    const approved=(result.data?.approved_ids||[]).map(Number);
    mark(approved,kind,decision);approved.forEach(n=>{processed.add(n);errors.delete(n)});done=approved.filter(n=>ids.includes(n)).length;
    const failed=new Map((result.data?.errors||[]).map(x=>[Number(x.id),x.message]));
    ids.filter(n=>!approved.includes(n)).forEach(n=>errors.set(n,failed.get(n)||'Deň zostal čakajúci. Skontrolujte rezerváciu.'));
   }catch(error){ids.forEach(n=>errors.set(n,error?.message||'Hromadné schválenie sa nepodarilo.'))}
  }else for(const id of ids){if(processed.has(id))continue;const r=(state.customerBookings||[]).find(q=>Number(q.id)===id);if(!r||(kind==='taxi'?r.taxi_change_status!=='pending':r.status!=='pending'))continue;
   const affected=kind==='booking'&&decision==='approve'&&r.booking_group_id?(state.customerBookings||[]).filter(q=>q.booking_group_id===r.booking_group_id&&q.user_id===r.user_id&&q.reservation_date===r.reservation_date&&q.status==='pending').map(q=>Number(q.id)):[id];
   const rpc=kind==='taxi'?(decision==='approve'?'portal_approve_taxi_change':'portal_reject_taxi_change'):(decision==='approve'?'portal_approve_booking':'portal_reject_booking');
   try{const result=await withJwtRetry(()=>supabase.rpc(rpc,{p_request_id:id,p_decision_note:null}));if(result.error)throw result.error;mark(affected,kind,decision);affected.forEach(n=>{processed.add(n);errors.delete(n)});done+=affected.filter(n=>ids.includes(n)).length}
   catch(error){const message=error?.message||'Požiadavku sa nepodarilo spracovať.';affected.forEach(n=>{processed.add(n);errors.set(n,message)})}
  }
 }finally{
  try{await refreshAdminBookingState()}catch(error){alert('Spracované požiadavky sú uložené, ale prehľad sa nepodarilo obnoviť. Otvorte ho znova.');console.warn(error)}
  busy=false;redraw();document.querySelectorAll('[data-review267]').forEach(b=>b.disabled=false);
  const failed=ids.filter(id=>errors.has(id));if(failed.length)alert('Spracované: '+done+' z '+ids.length+'. Niektoré dni zostali čakajúce; dôvod je uvedený pri dni.');
 }
}
