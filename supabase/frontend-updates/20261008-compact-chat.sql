update public.frontend_snapshots set html=replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(html,$compact_old$/* Full-height messages, compact bubbles, growing composer. */
#adminChatModalV48{top:var(--chat-top,0px);bottom:auto;height:var(--chat-height,100dvh);padding:0;overflow:hidden}
#adminChatModalV48 .admin-chat-card-v48{height:100%;max-height:100%;border-radius:0}
#adminChatModalV48 .admin-chat-head-v48{padding-top:calc(14px + env(safe-area-inset-top))}
#adminChatModalV48 .admin-chat-bubble-v48{font-size:14px;line-height:1.4;padding:9px 11px;max-width:86%}
#adminChatInputV48{display:block;font-size:16px;line-height:24px;padding:10px 12px;min-height:46px;max-height:118px;resize:none;overflow-y:hidden}
#adminChatModalV48 .admin-chat-compose-v48 .btn{min-height:44px;font-size:13px;padding:10px 12px}
.dog-owner-preview-note{font-size:12px;line-height:1.4;color:#92400e;margin-top:10px}.dog-owner-preview-image{display:block;aspect-ratio:1;overflow:hidden;border:2px solid #f5b9db;border-radius:18px}.dog-owner-preview-image img{display:block;width:100%;height:100%;object-fit:cover;border:0;border-radius:0}.dog-owner-photo-grid figcaption{overflow-wrap:anywhere}
$compact_old$,$compact_new$/* Compact chat viewport and profile contact row. */
html.admin-chat-open-v48,html.admin-chat-open-v48 body{overflow:hidden!important;overscroll-behavior:none!important}
#adminChatModalV48{top:var(--chat-top,0px);bottom:auto;height:var(--chat-height,100dvh);box-sizing:border-box;padding:12px;overflow:hidden;place-items:center}
#adminChatModalV48 .admin-chat-card-v48{width:min(580px,100%);height:min(var(--chat-preferred,56dvh),100%);max-height:100%;min-height:0;border-radius:24px}
#adminChatModalV48.chat-keyboard-open{place-items:end center;padding:8px 8px 0}
#adminChatModalV48.chat-keyboard-open .admin-chat-card-v48{border-bottom-left-radius:0;border-bottom-right-radius:0}
#adminChatModalV48 .admin-chat-head-v48{padding:12px 14px;gap:8px}
#adminChatModalV48 .admin-chat-head-v48 h2{font-size:18px}
#adminChatModalV48 .admin-chat-messages-v48{min-height:0;padding:10px;gap:7px;overscroll-behavior:contain}
#adminChatModalV48 .admin-chat-bubble-v48{flex-shrink:0;font-size:14px;line-height:1.35;padding:8px 10px;max-width:88%}
#adminChatModalV48 .admin-chat-compose-v48{padding:8px 10px 10px;grid-template-columns:minmax(0,1fr) 44px;gap:8px}
#adminChatInputV48{box-sizing:border-box;display:block;font-size:16px;line-height:22px;padding:10px 12px;min-height:44px;max-height:88px;resize:none;overflow-y:hidden;border-radius:22px}
#adminChatModalV48 .admin-chat-compose-v48 .chat-send{display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border-radius:50%}
#adminChatSendV48 svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}
#adminChatSendV48:disabled{opacity:.4}
#adminChatInputV48:focus{outline:none;border-color:#fb923c;box-shadow:0 0 0 2px #ffedd5}
.dog-message-contact{margin:12px 0;background:#fff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden}
.dog-message-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border:0;background:#fff;color:#111827;font:inherit;font-size:16px;font-weight:800;text-align:left}
.dog-message-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;color:#ea580c;background:#fff7ed;flex-shrink:0}
.dog-message-icon svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.dog-message-chevron{margin-left:auto;color:#9ca3af;font-size:27px}
.dog-message-note{padding:0 16px 12px}.dog-message-row:disabled{opacity:.55}
.dog-message-recipient{display:flex;justify-content:space-between;width:100%;background:#fff;border:0;border-top:1px solid #f3f4f6;padding:13px 18px;text-align:left;font:inherit;font-size:14px}
#dogMessageStatus:not(:empty){padding:0 16px 12px}
.dog-owner-photos{padding:0;background:transparent;border:0;margin:12px 0}
.dog-owner-photo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0}
.dog-owner-photo-grid figure{max-width:none;min-width:0;margin:0}
.dog-owner-photo-slot{aspect-ratio:1;border:2px solid #f5b9db;border-radius:20px;overflow:hidden;background:#fff6fb;display:grid;place-items:center}
.owner-photos-male .dog-owner-photo-slot{border-color:#93c5fd;background:#eff6ff}
.dog-owner-photo-slot img{display:block;width:100%;height:100%;object-fit:cover;border:0;border-radius:0}
.dog-owner-photo-placeholder{display:grid;justify-items:center;gap:7px;color:#9ca3af}.dog-owner-photo-placeholder svg{width:32px;height:32px;fill:none;stroke:currentColor;stroke-width:1.5;opacity:.65}.dog-owner-photo-placeholder small{font-size:12px}
.dog-owner-photo-grid figcaption{font-size:12px;font-weight:700;text-align:center;margin-top:6px;overflow-wrap:anywhere}
$compact_new$),$compact_old$ const photos=(d.owner_photos||[]).filter(p=>p.photo_url),people=dogMessageRecipients(d);
 const canPreview=Number(d.id)===77&&people.length>=2&&photos.length<2&&!!dogPhotoUrl(d);
 const preview=canPreview&&root.dataset.photoPreview==='1';
 root.classList.toggle('hidden',!photos.length&&!canPreview);
 const real=photos.length?'<div class="muted small">Fotky od majiteľov</div><div class="dog-owner-photo-grid">'+photos.map(p=>'<figure><img src="'+esc(p.photo_url)+'" alt="'+esc(d.name)+'" loading="lazy"><figcaption>'+esc(p.owner_name||'Majiteľ')+'</figcaption></figure>').join('')+'</div>':'';
 const demo=preview?'<div class="dog-owner-preview-note">Ukážka rozloženia — Bellina profilová fotka v dvoch výrezoch. Vlastné fotky majiteľov zatiaľ nie sú nahrané.</div><div class="dog-owner-photo-grid">'+people.slice(0,2).map((person,i)=>'<figure><span class="dog-owner-preview-image"><img src="'+esc(dogPhotoUrl(d))+'" alt="Ukážka fotky od majiteľa '+esc(person.full_name||'Majiteľ')+'" style="'+(i?'transform:scale(1.5);transform-origin:65% 35%':'')+'"></span><figcaption>'+esc(person.full_name||person.email||'Majiteľ')+'</figcaption></figure>').join('')+'</div>':'';
 root.innerHTML=real+(canPreview?'<button type="button" class="btn secondary compact" data-owner-photo-preview style="margin-top:8px">'+(preview?'Skryť ukážku':'Ukážka fotiek od 2 majiteľov')+'</button>'+demo:'');
 root.onclick=e=>{if(e.target.closest('[data-owner-photo-preview]')){root.dataset.photoPreview=preview?'0':'1';renderOwnerPhotoGallery(d)}};
$compact_old$,$compact_new$ const photos=(d.owner_photos||[]).filter(p=>p.photo_url),used=new Set();
 const slots=dogMessageRecipients(d).map(person=>{const index=photos.findIndex((p,i)=>!used.has(i)&&p.owner_name===person.full_name);if(index>=0)used.add(index);return {name:person.full_name||person.email||'Majiteľ',photo:index>=0?photos[index].photo_url:null}});
 photos.forEach((p,i)=>{if(!used.has(i))slots.push({name:p.owner_name||'Majiteľ',photo:p.photo_url})});
 while(slots.length<2)slots.push({name:'Nepriradený účet',photo:null});
 root.classList.remove('hidden');root.classList.toggle('owner-photos-male',d.sex==='male');root.onclick=null;
 root.innerHTML='<div class="dog-owner-photo-grid">'+slots.map(p=>'<figure><div class="dog-owner-photo-slot">'+(p.photo?'<img src="'+esc(p.photo)+'" alt="'+esc(d.name)+' — '+esc(p.name)+'" loading="lazy">':'<span class="dog-owner-photo-placeholder"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m4 17 5-5 4 4 3-3 5 5"/></svg><small>Bez fotky</small></span>')+'</div><figcaption>'+esc(p.name)+'</figcaption></figure>').join('')+'</div>';
$compact_new$),$compact_old$function dogMessageRecipients(d){
$compact_old$,$compact_new$
function createCompactChatLayout(modal,card,thread,input){
 let baseline=0,width=0,frame=0;
 function latest(){requestAnimationFrame(()=>{thread.scrollTop=thread.scrollHeight})}
 function resizeInput(){
  const near=thread.scrollHeight-thread.scrollTop-thread.clientHeight<90;
  input.style.height='0px';
  const style=getComputedStyle(input),line=parseFloat(style.lineHeight)||24;
  const padding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom),border=parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
  const max=line*3+padding+border;
  input.style.height=Math.min(input.scrollHeight+border,max)+'px';
  input.style.overflowY=input.scrollHeight+border>max?'auto':'hidden';
  if(near)latest();
 }
 function layout(){
  frame=0;if(modal.classList.contains('hidden'))return;
  const v=window.visualViewport,h=v?.height||innerHeight,w=v?.width||innerWidth;
  const near=thread.scrollHeight-thread.scrollTop-thread.clientHeight<90;
  if(!baseline||Math.abs(w-width)>60){baseline=Math.max(document.documentElement.clientHeight,innerHeight,h);width=w}
  baseline=Math.max(baseline,h);
  modal.style.setProperty('--chat-height',h+'px');
  modal.style.setProperty('--chat-top',(v?.offsetTop||0)+'px');
  modal.style.setProperty('--chat-preferred',Math.min(560,Math.max(320,baseline*.56))+'px');
  modal.classList.toggle('chat-keyboard-open',baseline-h>80);
  if(near)latest();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
 input.addEventListener('input',resizeInput);
 input.addEventListener('focus',schedule);input.addEventListener('blur',schedule);
 window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);
 return {open(){baseline=0;layout();resizeInput();latest()},close(){input.blur();modal.classList.remove('chat-keyboard-open');if(frame)cancelAnimationFrame(frame);frame=0},resizeInput,latest};
}

window.createCompactChatLayout=createCompactChatLayout;
function dogMessageRecipients(d){
$compact_new$),$compact_old$ if(!people.length)return '<div class="muted small" style="margin-top:8px">Správy budú dostupné po priradení zákazníckeho účtu.</div>';
 return '<div class="dog-message-contact" style="margin-top:8px">'+(people.length>1?'<label for="dogMessageRecipient" class="muted small">Príjemca správy</label><select id="dogMessageRecipient" class="input" style="margin:5px 0">'+people.map(p=>'<option value="'+esc(p.user_id)+'">'+esc(p.full_name||p.email||'Majiteľ')+'</option>').join('')+'</select>':'')+'<button id="dogMessageOpen" class="btn secondary compact" type="button">✉ Napísať správu</button><div id="dogMessageStatus" class="muted small" role="status"></div></div>';
$compact_old$,$compact_new$ return '<div class="dog-message-contact"><button id="dogMessageOpen" class="dog-message-row" type="button" '+(!people.length?'disabled':'')+'><span class="dog-message-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7 18-4-7-7-4 18-7Z"/><path d="m10 14 11-11"/></svg></span><span>Napísať správu</span><span class="dog-message-chevron" aria-hidden="true">›</span></button>'+(people.length?'':'<div class="muted small dog-message-note">Zákaznícky účet zatiaľ nie je priradený.</div>')+'<div id="dogMessageRecipients" class="dog-message-recipients hidden">'+people.map(p=>'<button type="button" class="dog-message-recipient" data-message-user="'+esc(p.user_id)+'">'+esc(p.full_name||p.email||'Majiteľ')+'<span aria-hidden="true">›</span></button>').join('')+'</div><div id="dogMessageStatus" class="muted small" role="status"></div></div>';
$compact_new$),$compact_old$async function openDogMessageContact(dogId){
$compact_old$,$compact_new$async function openDogMessageContact(dogId,userId=null){
$compact_new$),$compact_old$ const people=dogMessageRecipients(d),userId=$('dogMessageRecipient')?.value||people[0]?.user_id;
$compact_old$,$compact_new$ const people=dogMessageRecipients(d);
 if(!userId&&people.length>1){$('dogMessageRecipients')?.classList.toggle('hidden');return}
 userId=userId||people[0]?.user_id;
$compact_new$),$compact_old$ const button=$('dogMessageOpen'),status=$('dogMessageStatus');button.disabled=true;status.textContent='Otváram správy…';
$compact_old$,$compact_new$ const button=$('dogMessageOpen'),status=$('dogMessageStatus');if(button.disabled)return;button.disabled=true;status.textContent='Otváram správy…';
$compact_new$),$compact_old$    <div class="dog-profile-head ${d.sex==='male'?'dog-profile-male':d.sex==='female'?'dog-profile-female':'dog-profile-neutral'}"><span class="dog-profile-avatar">${dogPhotoUrl(d)?`<img src="${esc(dogPhotoUrl(d))}" alt="${esc(d.name)}">`:'🐾'}</span><div class="dog-profile-copy"><h1>${esc(d.name)}</h1><div class="dog-profile-owner">${esc(d.owners?.name||'Meno majiteľa – doplniť')}</div><div class="dog-profile-phone">${phone?`<a href="tel:${esc(phone)}">☎ ${esc(phone)}</a>`:'Telefón treba doplniť'}</div>${dogMessageContactHtml(d)}${dogOnboardingBadge(d)}<label class="btn secondary compact dog-photo-action" for="dogPhotoInput">${d.photo_path?'Zmeniť fotku':'Pridať fotku'}</label><input id="dogPhotoInput" type="file" accept="image/*" hidden></div></div><div id="dogOwnerPhotos" data-dog-id="${id}" class="dog-owner-photos hidden"></div>
$compact_old$,$compact_new$    <div class="dog-profile-head ${d.sex==='male'?'dog-profile-male':d.sex==='female'?'dog-profile-female':'dog-profile-neutral'}"><span class="dog-profile-avatar">${dogPhotoUrl(d)?`<img src="${esc(dogPhotoUrl(d))}" alt="${esc(d.name)}">`:'🐾'}</span><div class="dog-profile-copy"><h1>${esc(d.name)}</h1><div class="dog-profile-owner">${esc(d.owners?.name||'Meno majiteľa – doplniť')}</div><div class="dog-profile-phone">${phone?`<a href="tel:${esc(phone)}">☎ ${esc(phone)}</a>`:'Telefón treba doplniť'}</div>${dogOnboardingBadge(d)}<input id="dogPhotoInput" type="file" accept="image/*" hidden></div></div><div id="dogOwnerPhotos" data-dog-id="${id}" class="dog-owner-photos hidden"></div>
    ${dogMessageContactHtml(d)}
$compact_new$),$compact_old$  document.querySelectorAll('.approve-customer-booking').forEach(b=>b.addEventListener('click',()=>decideCustomerBooking(Number(b.dataset.requestId),'approve',id)));document.querySelectorAll('.reject-customer-booking').forEach(b=>b.addEventListener('click',()=>decideCustomerBooking(Number(b.dataset.requestId),'reject',id)));document.querySelectorAll('.cancel-detail-res').forEach(b=>b.addEventListener('click',async()=>{await cancelReservation(Number(b.dataset.resId));await openDog(id)})); $('toggleDogActive')?.addEventListener('click',()=>toggleDogActive(id,!d.active));$('deleteDogBtn')?.addEventListener('click',()=>deleteDogPermanently(id,d.name,historyCount));$('saveDogInfo')?.addEventListener('click',()=>saveDogInfo(id));$('dogBookingException')?.addEventListener('click',async e=>{const btn=e.currentTarget,next=!d.booking_late_exception;btn.disabled=true;try{const {data,error}=await withJwtRetry(()=>supabase.from('dogs').update({booking_late_exception:next}).eq('id',id).select('booking_late_exception').maybeSingle());if(error||!data)throw error||new Error('Zmena sa neuložila.');d.booking_late_exception=data.booking_late_exception===true;btn.setAttribute('aria-checked',String(d.booking_late_exception));btn.classList.toggle('secondary',!d.booking_late_exception);btn.textContent=d.booking_late_exception?'Zapnuté':'Vypnuté'}catch(error){alert('Výnimku sa nepodarilo uložiť: '+(error?.message||error))}finally{btn.disabled=false}});cleanOwnerSmsPhoneField($('ownerSmsPhone'));$('saveVaccinations')?.addEventListener('click',()=>saveVaccinations(id))
$compact_old$,$compact_new$  $('dogMessageRecipients')?.addEventListener('click',e=>{const b=e.target.closest('[data-message-user]');if(b)openDogMessageContact(id,b.dataset.messageUser)});
  document.querySelectorAll('.approve-customer-booking').forEach(b=>b.addEventListener('click',()=>decideCustomerBooking(Number(b.dataset.requestId),'approve',id)));document.querySelectorAll('.reject-customer-booking').forEach(b=>b.addEventListener('click',()=>decideCustomerBooking(Number(b.dataset.requestId),'reject',id)));document.querySelectorAll('.cancel-detail-res').forEach(b=>b.addEventListener('click',async()=>{await cancelReservation(Number(b.dataset.resId));await openDog(id)})); $('toggleDogActive')?.addEventListener('click',()=>toggleDogActive(id,!d.active));$('deleteDogBtn')?.addEventListener('click',()=>deleteDogPermanently(id,d.name,historyCount));$('saveDogInfo')?.addEventListener('click',()=>saveDogInfo(id));$('dogBookingException')?.addEventListener('click',async e=>{const btn=e.currentTarget,next=!d.booking_late_exception;btn.disabled=true;try{const {data,error}=await withJwtRetry(()=>supabase.from('dogs').update({booking_late_exception:next}).eq('id',id).select('booking_late_exception').maybeSingle());if(error||!data)throw error||new Error('Zmena sa neuložila.');d.booking_late_exception=data.booking_late_exception===true;btn.setAttribute('aria-checked',String(d.booking_late_exception));btn.classList.toggle('secondary',!d.booking_late_exception);btn.textContent=d.booking_late_exception?'Zapnuté':'Vypnuté'}catch(error){alert('Výnimku sa nepodarilo uložiť: '+(error?.message||error))}finally{btn.disabled=false}});cleanOwnerSmsPhoneField($('ownerSmsPhone'));$('saveVaccinations')?.addEventListener('click',()=>saveVaccinations(id))
$compact_new$),$compact_old$  let activeChatConversationV48=0,chatSignatureV48='';
$compact_old$,$compact_new$  let activeChatConversationV48=0,chatSignatureV48='',adminChatLayout=null,adminChatSending=false;
$compact_new$),$compact_old$    document.body.insertAdjacentHTML('beforeend','<div id="adminChatModalV48" class="admin-chat-modal-v48 hidden" role="dialog" aria-modal="true" aria-labelledby="adminChatTitleV48"><div class="admin-chat-card-v48"><div class="admin-chat-head-v48"><div><div class="admin-chat-kicker-v48">Správy</div><h2 id="adminChatTitleV48">Majiteľ</h2></div><div class="row" style="gap:8px"><button id="adminChatDeleteV48" class="btn secondary compact" type="button">Vymazať</button><button id="adminChatCloseV48" class="admin-chat-close-v48" type="button" aria-label="Zavrieť">×</button></div></div><div id="adminChatMessagesV48" class="admin-chat-messages-v48"></div><form id="adminChatFormV48" class="admin-chat-compose-v48"><textarea id="adminChatInputV48" class="input" rows="1" maxlength="2000" placeholder="Napísať správu…"></textarea><button id="adminChatSendV48" class="btn" type="submit">Odoslať</button></form></div></div>');
$compact_old$,$compact_new$    document.body.insertAdjacentHTML('beforeend','<div id="adminChatModalV48" class="admin-chat-modal-v48 hidden" role="dialog" aria-modal="true" aria-labelledby="adminChatTitleV48"><div class="admin-chat-card-v48"><div class="admin-chat-head-v48"><div><div class="admin-chat-kicker-v48">Správy</div><h2 id="adminChatTitleV48">Majiteľ</h2></div><div class="row" style="gap:8px"><button id="adminChatDeleteV48" class="btn secondary compact" type="button">Vymazať</button><button id="adminChatCloseV48" class="admin-chat-close-v48" type="button" aria-label="Zavrieť">×</button></div></div><div id="adminChatMessagesV48" class="admin-chat-messages-v48"></div><form id="adminChatFormV48" class="admin-chat-compose-v48"><textarea id="adminChatInputV48" class="input" rows="1" maxlength="2000" placeholder="Napísať správu…"></textarea><button id="adminChatSendV48" class="btn chat-send" type="submit" aria-label="Odoslať správu" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form></div></div>');
$compact_new$),$compact_old$    const close=()=>{modal.classList.add('hidden');document.documentElement.classList.remove('admin-chat-open-v48');activeChatConversationV48=0;chatSignatureV48=''};
    q('adminChatCloseV48').addEventListener('click',close);q('adminChatDeleteV48').addEventListener('click',()=>deleteAdminChatV48(close));modal.addEventListener('click',e=>{if(e.target===modal)close()});q('adminChatFormV48').addEventListener('submit',sendAdminChatV48);q('adminChatInputV48').addEventListener('input',resizeAdminChatInput);return modal
$compact_old$,$compact_new$    const close=()=>{adminChatLayout?.close();q('dogDetail').inert=false;modal.classList.add('hidden');document.documentElement.classList.remove('admin-chat-open-v48');activeChatConversationV48=0;chatSignatureV48=''};
    q('adminChatCloseV48').addEventListener('click',close);q('adminChatDeleteV48').addEventListener('click',()=>deleteAdminChatV48(close));modal.addEventListener('click',e=>{if(e.target===modal)close()});q('adminChatFormV48').addEventListener('submit',sendAdminChatV48);adminChatLayout=window.createCompactChatLayout(modal,modal.firstElementChild,q('adminChatMessagesV48'),q('adminChatInputV48'));q('adminChatInputV48').addEventListener('input',()=>{q('adminChatSendV48').disabled=adminChatSending||!q('adminChatInputV48').value.trim()});q('adminChatSendV48').addEventListener('pointerdown',e=>e.preventDefault());return modal
$compact_new$),$compact_old$  function resizeAdminChatInput(){const input=q('adminChatInputV48');if(!input)return;input.style.height='auto';const max=118;input.style.height=Math.min(input.scrollHeight+2,max)+'px';input.style.overflowY=input.scrollHeight+2>max?'auto':'hidden'}
  function resizeAdminChatViewport(){const modal=q('adminChatModalV48');if(!modal||modal.classList.contains('hidden'))return;const v=window.visualViewport;modal.style.setProperty('--chat-height',(v?.height||innerHeight)+'px');modal.style.setProperty('--chat-top',(v?.offsetTop||0)+'px')}
  window.visualViewport?.addEventListener('resize',resizeAdminChatViewport);window.visualViewport?.addEventListener('scroll',resizeAdminChatViewport);window.addEventListener('resize',resizeAdminChatViewport);
$compact_old$,$compact_new$$compact_new$),$compact_old$    const nearBottom=root.scrollHeight-root.scrollTop-root.clientHeight<90;
$compact_old$,$compact_new$    const previousTop=root.scrollTop,nearBottom=root.scrollHeight-root.scrollTop-root.clientHeight<90;
$compact_new$),$compact_old$    chatSignatureV48=signature;if(nearBottom||force)requestAnimationFrame(()=>{root.scrollTop=root.scrollHeight})
$compact_old$,$compact_new$    chatSignatureV48=signature;requestAnimationFrame(()=>{root.scrollTop=nearBottom||force?root.scrollHeight:previousTop})
$compact_new$),$compact_old$    event?.preventDefault();const input=q('adminChatInputV48'),button=q('adminChatSendV48'),body=String(input?.value||'').trim();if(!body||!activeChatConversationV48)return;const h=headers();if(!h)return;button.disabled=true;
    try{const session=sess();const response=await fetch(BASE+'/rest/v1/portal_messages',{method:'POST',headers:{...h,Prefer:'return=representation'},body:JSON.stringify({conversation_id:activeChatConversationV48,sender_user_id:session?.user?.id||null,sender_role:'staff',body})});if(!response.ok)throw new Error(await response.text());input.value='';resizeAdminChatInput();await window.adminMessageRuntime.refresh();renderAdminChatV48(true);input.focus({preventScroll:true})}catch(error){alert('Správu sa nepodarilo odoslať: '+(error?.message||error))}finally{button.disabled=false}
$compact_old$,$compact_new$    event?.preventDefault();const input=q('adminChatInputV48'),button=q('adminChatSendV48'),body=String(input?.value||'').trim();if(!body||!activeChatConversationV48||adminChatSending)return;const h=headers();if(!h)return;button.disabled=true;adminChatSending=true;
    try{const session=sess();const response=await fetch(BASE+'/rest/v1/portal_messages',{method:'POST',headers:{...h,Prefer:'return=representation'},body:JSON.stringify({conversation_id:activeChatConversationV48,sender_user_id:session?.user?.id||null,sender_role:'staff',body})});if(!response.ok)throw new Error(await response.text());input.value='';adminChatLayout.resizeInput();await window.adminMessageRuntime.refresh();renderAdminChatV48(true);adminChatLayout.latest()}catch(error){alert('Správu sa nepodarilo odoslať: '+(error?.message||error))}finally{adminChatSending=false;button.disabled=!input.value.trim()}
$compact_new$),$compact_old$  function openAdminChatV48(conversationId){const id=Number(conversationId||0);if(!id)return;closeDashboardModalV42();const modal=ensureAdminChatModalV48();activeChatConversationV48=id;chatSignatureV48='';q('adminChatInputV48').value='';modal.classList.remove('hidden');resizeAdminChatInput();resizeAdminChatViewport();document.documentElement.classList.add('admin-chat-open-v48');renderAdminChatV48(true);requestAnimationFrame(()=>{markAdminChatReadV48(id);q('adminChatInputV48')?.focus({preventScroll:true})})}
$compact_old$,$compact_new$  function openAdminChatV48(conversationId){const id=Number(conversationId||0);if(!id)return;closeDashboardModalV42();const modal=ensureAdminChatModalV48();activeChatConversationV48=id;chatSignatureV48='';q('adminChatInputV48').value='';modal.classList.remove('hidden');adminChatLayout.open();q('adminChatSendV48').disabled=true;q('dogDetail').inert=true;document.documentElement.classList.add('admin-chat-open-v48');renderAdminChatV48(true);requestAnimationFrame(()=>{markAdminChatReadV48(id);adminChatLayout.latest()})}
$compact_new$) where key='stable-v10-clean' and md5(html)='6e27f6c6ea8d43c42a455013561a4c78' returning key,md5(html) as checksum;