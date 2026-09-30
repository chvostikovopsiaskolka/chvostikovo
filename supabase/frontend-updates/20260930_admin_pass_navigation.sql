update public.frontend_snapshots set html=replace(replace(replace(replace(replace(replace(html,'</style></body>
','</style><script id="admin-back-swipe-20260930">
''use strict'';
/* Edge swipe reuses the existing close actions, including their save/onboarding guards. */
(function installBackSwipe(){
  const layerSelector=''[role="dialog"],.legal-modal,.overlay,.v41-dashboard-modal,.settings-modal-v36,.booking-picker-v37,.photo-modal,.notification-popup,.vacc-proof-viewer-v104'';
  const visible=el=>el&&!el.closest(''.hidden'')&&el.getClientRects().length&&getComputedStyle(el).visibility!==''hidden'';
  function backAction(){
    const layers=[...document.querySelectorAll(layerSelector)].filter(visible);
    layers.sort((a,b)=>(parseInt(getComputedStyle(a).zIndex)||0)-(parseInt(getComputedStyle(b).zIndex)||0));
    const top=layers.at(-1);
    if(top){
      const buttons=[...top.querySelectorAll(''button'')];
      const close=buttons.find(b=>visible(b)&&!b.disabled&&(/close|backBtn|ModalBack|CreateBack/i.test(b.id)||b.getAttribute(''aria-label'')===''Zavrieť''||b.getAttribute(''aria-label'')===''Zatvoriť''));
      return close?()=>close.click():null;
    }
    // Root screens do not navigate out of the installed application.
    if(document.getElementById(''dogDetail'')){
      const back=document.getElementById(''socialBackV1'');if(visible(back))return ()=>back.click();
      const stats=document.getElementById(''statsSection'');if(visible(stats))return ()=>switchTab(''menu'');
    }else if(document.getElementById(''appView'')&&!document.getElementById(''appView'').classList.contains(''hidden'')&&typeof state!==''undefined''&&state.activeTab===''menu'')return ()=>switchTab(''booking'');
    return null;
  }
  let start=null;
  document.addEventListener(''touchstart'',e=>{
    start=null;if(e.touches.length!==1)return;
    const t=e.touches[0];if(t.clientX>44||e.target.closest(''input,textarea,select,[contenteditable="true"],canvas,[data-swipe-ignore]''))return;
    const action=backAction();if(action)start={x:t.clientX,y:t.clientY,id:t.identifier,time:Date.now(),action};
  },{passive:true});
  document.addEventListener(''touchmove'',e=>{
    if(!start)return;if(e.touches.length!==1){start=null;return}
    const t=e.touches[0],dx=t.clientX-start.x,dy=Math.abs(t.clientY-start.y);
    if(dy>40||dx< -12){start=null;return}
    if(dx>25&&dx>dy*2.2&&e.cancelable)e.preventDefault();
  },{passive:false});
  document.addEventListener(''touchend'',e=>{
    const s=start;start=null;if(!s||Date.now()-s.time>1000)return;
    const t=[...e.changedTouches].find(t=>t.identifier===s.id);if(!t)return;
    const dx=t.clientX-s.x,dy=Math.abs(t.clientY-s.y);
    if(dx<80||dy>40||dx<dy*2.2)return;
    if(e.cancelable)e.preventDefault();s.action();
  },{passive:false});
  document.addEventListener(''touchcancel'',()=>{start=null},{passive:true});
})();

</script>
</body>
'),'    if(e.target.closest?.(''[data-dog-id]'')){
','    if(e.target.closest?.(''[data-dog-id]'')&&!e.target.closest?.(''#dogDetail'')){
'),'    body.querySelectorAll(''.v42-pass-purchased'').forEach(b=>b.addEventListener(''click'',async()=>{const request=(state.customerPassRequests||[]).find(r=>Number(r.id)===Number(b.dataset.requestId));if(!request||!confirm(''Potvrdiť nákup ''+request.total_entries+''-vstupovej permanentky dnes?''))return;b.disabled=true;try{await dashboardRpcV42(''portal_approve_pass_request'',{p_request_id:Number(b.dataset.requestId),p_decision_note:null});await refreshDashboardAfterActionV42(kind,title)}catch(e){alert(''Nákup sa nepodarilo potvrdiť: ''+(e?.message||e))}finally{b.disabled=false}}));body.querySelectorAll(''.v42-pass-handled'').forEach(b=>b.addEventListener(''click'',async()=>{b.disabled=true;try{await dashboardRpcV42(''portal_mark_pass_interest_handled'',{p_request_id:Number(b.dataset.requestId)});await refreshDashboardAfterActionV42(kind,title)}catch(e){alert(''Záujem sa nepodarilo označiť ako vybavený: ''+(e?.message||e))}finally{b.disabled=false}}));
','    body.querySelectorAll(''.v42-pass-purchased'').forEach(b=>b.addEventListener(''click'',async()=>{const request=(state.customerPassRequests||[]).find(r=>Number(r.id)===Number(b.dataset.requestId));if(!request||!confirm(''Potvrdiť nákup ''+request.total_entries+''-vstupovej permanentky dnes?''))return;b.disabled=true;try{await dashboardRpcV42(''portal_approve_pass_request'',{p_request_id:Number(b.dataset.requestId),p_decision_note:null});b.textContent=''Zakúpená'';await refreshDogPassOperation(Number(request.dog_id),''Permanentka zakúpená.'',''passMessage'',false);await refreshDashboard();openDashboardModalV42(kind,title)}catch(e){alert(''Nákup sa nepodarilo potvrdiť: ''+(e?.message||e))}finally{b.disabled=false}}));body.querySelectorAll(''.v42-pass-handled'').forEach(b=>b.addEventListener(''click'',async()=>{b.disabled=true;try{await dashboardRpcV42(''portal_mark_pass_interest_handled'',{p_request_id:Number(b.dataset.requestId)});await refreshDashboardAfterActionV42(kind,title)}catch(e){alert(''Záujem sa nepodarilo označiť ako vybavený: ''+(e?.message||e))}finally{b.disabled=false}}));
'),'  document.addEventListener(''click'',e=>{const card=e.target.closest(''[data-dog-id]'');if(!card)return;currentDogId=Number(card.dataset.dogId)||currentDogId;setTimeout(run,280);setTimeout(()=>renderLegalStatusV22(currentDogId),520)},true);
','  document.addEventListener(''click'',e=>{const card=e.target.closest(''[data-dog-id]'');if(!card||e.target.closest(''#dogDetail''))return;currentDogId=Number(card.dataset.dogId)||currentDogId;setTimeout(run,280);setTimeout(()=>renderLegalStatusV22(currentDogId),520)},true);
'),'async function purchasePassForDog(dogId,useTodaySingle){const total=Number($(''passTotal'').value),purchased=$(''passPurchasedOn'').value,noExpiry=$(''passNoExpiry'').checked,msg=$(''passMessage''),buttons=[$(''savePassBtn''),$(''useTodaySingleYes''),$(''useTodaySingleNo'')].filter(Boolean);msg.innerHTML='''';buttons.forEach(b=>b.disabled=true);const pending=(state.customerPassRequests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.status===''pending'');if(pending&&(purchased!==isoLocal(new Date())||noExpiry||Number(pending.total_entries)!==total||useTodaySingle)){msg.innerHTML=''<div class="error">Pri tomto psíkovi už evidujeme záujem. Nákup potvrď v karte záujmu; pri inom type alebo dátume najprv tento záujem vyrieš.</div>'';buttons.forEach(b=>b.disabled=false);return}const rpc=pending?''portal_approve_pass_request'':''purchase_pass'',args=pending?{p_request_id:Number(pending.id),p_decision_note:null}:{p_dog_id:dogId,p_total_entries:total,p_purchased_on:purchased,p_no_expiry:noExpiry,p_use_today_single:useTodaySingle};const {error}=await withJwtRetry(()=>supabase.rpc(rpc,args));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;buttons.forEach(b=>b.disabled=false);return}await loadData();await openDog(dogId)}
async function savePassUsed(passId,dogId){ const input=document.querySelector(`[data-pass-used="${passId}"]`),value=Number(input.value),msg=$(''passManageMessage'');const {error}=await withJwtRetry(()=>supabase.rpc(''set_pass_used_entries'',{p_pass_id:passId,p_used_entries:value}));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await loadData();await openDog(dogId) }
async function savePassValidity(passId,dogId,clear){ const input=document.querySelector(`[data-pass-valid="${passId}"]`),value=clear?null:input.value,msg=$(''passManageMessage'');if(!clear&&!value){msg.innerHTML=''<div class="error">Vyber dátum alebo použi Bez platnosti.</div>'';return}const {error}=await withJwtRetry(()=>supabase.from(''passes'').update(clear?{valid_until:null,no_expiry:true}:{valid_until:value,no_expiry:false}).eq(''id'',passId));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await loadData();await openDog(dogId) }
async function setPassRole(passId,dogId,role){ const {error}=await withJwtRetry(()=>supabase.rpc(''set_pass_role'',{p_pass_id:passId,p_role:role}));if(error){$(''passManageMessage'').innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await loadData();await openDog(dogId) }
async function setReservationPass(resId,dogId,passId){ const payload=passId?{pass_id:passId,pass_locked:true}:{pass_id:null,pass_locked:false};const {error}=await withJwtRetry(()=>supabase.from(''reservations'').update(payload).eq(''id'',resId));if(error){alert(''Permanentku rezervácie sa nepodarilo zmeniť: ''+error.message);return}await loadData();await openDog(dogId) }
async function convertSingleReservationToPass(resId,dogId,button){button.disabled=true;button.textContent=''Mením…'';try{const {data,error}=await withJwtRetry(()=>supabase.from(''reservations'').update({entry_type:''pass'',pass_id:null,pass_locked:false}).eq(''id'',resId).eq(''dog_id'',dogId).eq(''status'',''booked'').eq(''entry_type'',''single'').select(''id,entry_type,pass_id,planned_entry_number,planned_pass_total'').maybeSingle());if(error)throw error;if(!data)throw new Error(''Rezervácia sa medzitým zmenila. Obnovte detail psíka.'');await loadData();await openDog(dogId);if(data.entry_type!==''pass''||!data.pass_id){alert(''Na tento deň nie je voľný vstup z platnej permanentky. Rezervácia zostala jednorazová.'')} }catch(error){alert(''Vstup sa nepodarilo zmeniť: ''+(error?.message||error));button.disabled=false;button.textContent=''Použiť permanentku''}}
','async function purchasePassForDog(dogId,useTodaySingle){const total=Number($(''passTotal'').value),purchased=$(''passPurchasedOn'').value,noExpiry=$(''passNoExpiry'').checked,msg=$(''passMessage''),buttons=[$(''savePassBtn''),$(''useTodaySingleYes''),$(''useTodaySingleNo'')].filter(Boolean);msg.innerHTML='''';buttons.forEach(b=>b.disabled=true);const pending=(state.customerPassRequests||[]).find(r=>Number(r.dog_id)===Number(dogId)&&r.status===''pending'');if(pending&&(purchased!==isoLocal(new Date())||noExpiry||Number(pending.total_entries)!==total||useTodaySingle)){msg.innerHTML=''<div class="error">Pri tomto psíkovi už evidujeme záujem. Nákup potvrď v karte záujmu; pri inom type alebo dátume najprv tento záujem vyrieš.</div>'';buttons.forEach(b=>b.disabled=false);return}const rpc=pending?''portal_approve_pass_request'':''purchase_pass'',args=pending?{p_request_id:Number(pending.id),p_decision_note:null}:{p_dog_id:dogId,p_total_entries:total,p_purchased_on:purchased,p_no_expiry:noExpiry,p_use_today_single:useTodaySingle};msg.innerHTML=''<div class="muted small">Ukladám permanentku…</div>'';const {error}=await withJwtRetry(()=>supabase.rpc(rpc,args));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;buttons.forEach(b=>b.disabled=false);return}await refreshDogPassOperation(dogId,''Permanentka zakúpená.'',''passMessage'')}
async function savePassUsed(passId,dogId){ const input=document.querySelector(`[data-pass-used="${passId}"]`),value=Number(input.value),msg=$(''passManageMessage'');const {error}=await withJwtRetry(()=>supabase.rpc(''set_pass_used_entries'',{p_pass_id:passId,p_used_entries:value}));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await refreshDogPassOperation(dogId,''Permanentka uložená.'',''passManageMessage'') }
async function savePassValidity(passId,dogId,clear){ const input=document.querySelector(`[data-pass-valid="${passId}"]`),value=clear?null:input.value,msg=$(''passManageMessage'');if(!clear&&!value){msg.innerHTML=''<div class="error">Vyber dátum alebo použi Bez platnosti.</div>'';return}const {error}=await withJwtRetry(()=>supabase.from(''passes'').update(clear?{valid_until:null,no_expiry:true}:{valid_until:value,no_expiry:false}).eq(''id'',passId));if(error){msg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await refreshDogPassOperation(dogId,''Permanentka uložená.'',''passManageMessage'') }
async function setPassRole(passId,dogId,role){ const {error}=await withJwtRetry(()=>supabase.rpc(''set_pass_role'',{p_pass_id:passId,p_role:role}));if(error){$(''passManageMessage'').innerHTML=`<div class="error">${esc(error.message)}</div>`;return}await refreshDogPassOperation(dogId,''Permanentka uložená.'',''passManageMessage'') }

// Refresh only pass-related data after a confirmed write, keeping detail tab and scroll.
async function refreshDogPassOperation(dogId,message=''Zmena uložená.'',target=''passManageMessage'',showDetail=true){
  const detail=$(''dogDetail''),scroll=detail?.scrollTop||0;
  if(showDetail){await openDog(dogId);if(detail)detail.scrollTop=scroll;}
  const msg=$(target);if(msg)msg.innerHTML=''<div class="success">''+esc(message)+''</div>'';
  const results=await Promise.all([
    withJwtRetry(()=>supabase.from(''passes'').select(''id,dog_id,total_entries,used_entries,purchased_on,purchase_price,valid_from,valid_until,no_expiry,status,created_at'').in(''status'',[''active'',''queued'']).order(''created_at'')),
    withJwtRetry(()=>supabase.from(''passes'').select(''id,dog_id,total_entries,purchased_on,purchase_price,status'').not(''purchased_on'',''is'',null).order(''purchased_on'',{ascending:false})),
    withJwtRetry(()=>supabase.from(''customer_pass_requests'').select(''id,user_id,dog_id,total_entries,status,requested_at,decided_at,decision_note'').order(''requested_at'')),
    withJwtRetry(()=>supabase.from(''customer_booking_requests'').select(''id,user_id,dog_id,reservation_date,status,projected_entry_number,projected_pass_total,planned_pass_request_id,taxi_mode,taxi_amount,requested_taxi_mode,requested_taxi_amount,taxi_change_status,taxi_change_requested_at,taxi_change_note,cancellation_reason,created_at'').order(''reservation_date'').order(''id'')),
    loadReservations(),
    withJwtRetry(()=>supabase.from(''daily_financials'').select(''day,pass10_count,pass20_count,single_count,taxi_amount,source'').order(''day''))
  ]);
  const [active,purchases,requests,bookings,,daily]=results;
  if(!active.error){state.passes=new Map();for(const p of active.data||[]){if(!state.passes.has(p.dog_id))state.passes.set(p.dog_id,[]);state.passes.get(p.dog_id).push(p)}}
  if(!purchases.error)state.passPurchases=purchases.data||[];
  if(!requests.error)state.customerPassRequests=requests.data||[];
  if(!bookings.error)state.customerBookings=bookings.data||[];
  if(!daily.error)state.dailyFinancials=daily.data||[];
  renderDogs($(''dogSearch'')?.value||'''');renderToday();renderWeek();renderStats();renderRequestOverview();window.refreshAdminDashboardV63?.();
  if(results.some(r=>r===false||r?.error)&&msg?.isConnected)msg.innerHTML+=''<div class="warning-box">Zmena je uložená, časť prehľadu sa nepodarilo obnoviť.</div>'';
}
async function setReservationPass(resId,dogId,passId){
 const input=document.querySelector(''.reservation-pass-select[data-res-id="''+resId+''"]'');if(input)input.disabled=true;
 try{const payload=passId?{entry_type:''pass'',pass_id:passId,pass_locked:true}:{entry_type:''pass'',pass_id:null,pass_locked:false};
 const {data,error}=await withJwtRetry(()=>supabase.from(''reservations'').update(payload).eq(''id'',resId).eq(''dog_id'',dogId).eq(''status'',''booked'').select(''id'').maybeSingle());
 if(error||!data)throw error||new Error(''Rezervácia sa medzitým zmenila.'');
 await refreshDogPassOperation(dogId,''Permanentka rezervácie uložená.'');
 }catch(error){alert(''Permanentku rezervácie sa nepodarilo zmeniť: ''+(error?.message||error))}finally{if(input?.isConnected)input.disabled=false}
}
async function convertSingleReservationToPass(resId,dogId,button){
 button.disabled=true;button.textContent=''Mením…'';
 try{const {data,error}=await withJwtRetry(()=>supabase.from(''reservations'').update({entry_type:''pass'',pass_id:null,pass_locked:false}).eq(''id'',resId).eq(''dog_id'',dogId).eq(''status'',''booked'').eq(''entry_type'',''single'').select(''id'').maybeSingle());
 if(error||!data)throw error||new Error(''Rezervácia sa medzitým zmenila. Obnovte detail psíka.'');
 // Read again after the AFTER trigger has assigned the chronological entry.
 const final=await withJwtRetry(()=>supabase.from(''reservations'').select(''entry_type,pass_id,planned_entry_number'').eq(''id'',resId).eq(''dog_id'',dogId).single());
 if(final.error)throw final.error;
 const assigned=final.data.entry_type===''pass''&&final.data.pass_id;
 await refreshDogPassOperation(dogId,assigned?''Rezervácia zmenená na vstup z permanentky.'':''Na tento deň nie je voľný vstup z platnej permanentky. Rezervácia zostala jednorazová.'');
 }catch(error){alert(''Vstup sa nepodarilo zmeniť: ''+(error?.message||error))}finally{if(button?.isConnected){button.disabled=false;button.textContent=''Použiť permanentku''}}
}
'),'async function handleOverviewPassPurchased(button){const requestId=Number(button.dataset.requestId),request=(state.customerPassRequests||[]).find(r=>Number(r.id)===requestId);if(!request||!confirm(''Potvrdiť nákup ''+request.total_entries+''-vstupovej permanentky dnes? Predaj sa zapíše len raz.''))return;button.disabled=true;try{const {error}=await withJwtRetry(()=>supabase.rpc(''portal_approve_pass_request'',{p_request_id:requestId,p_decision_note:null}));if(error)throw error;await loadData()}catch(error){alert(''Nákup sa nepodarilo potvrdiť: ''+(error?.message||error))}finally{button.disabled=false}}
','async function handleOverviewPassPurchased(button){const requestId=Number(button.dataset.requestId),request=(state.customerPassRequests||[]).find(r=>Number(r.id)===requestId);if(!request||!confirm(''Potvrdiť nákup ''+request.total_entries+''-vstupovej permanentky dnes? Predaj sa zapíše len raz.''))return;button.disabled=true;try{const {error}=await withJwtRetry(()=>supabase.rpc(''portal_approve_pass_request'',{p_request_id:requestId,p_decision_note:null}));if(error)throw error;button.textContent=''Zakúpená'';await refreshDogPassOperation(Number(request.dog_id),''Permanentka zakúpená.'',''passMessage'',false)}catch(error){alert(''Nákup sa nepodarilo potvrdiť: ''+(error?.message||error))}finally{button.disabled=false}}
') where key='stable-v10-clean' and md5(html)='42f945f36b648e99253f399f02b60fd2' returning md5(html) as checksum,length(html) as chars;