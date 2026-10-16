DO $patch263$ declare h text;patch jsonb; begin
 select html into h from public.frontend_snapshots where key='stable-v10-clean' for update;
 if md5(h)<>'3a420f031dd671da1d0692918290f80f' then raise exception 'Admin baseline changed';end if;
 insert into public.frontend_snapshots(key,html) values('backup-admin-before-crm-workflow-v263-20261016',h) on conflict(key) do nothing;
 if (select md5(html) from public.frontend_snapshots where key='backup-admin-before-crm-workflow-v263-20261016')<>md5(h) then raise exception 'Backup differs';end if;
 if (length(h)-length(replace(h,'staff_note,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)','')))/length('staff_note,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)')<>1 then raise exception 'Field selection changed';end if;
 h:=replace(h,'staff_note,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)','staff_note,waiting_for_application,crm_lead_id,consent,source,source_ref,converted_dog_id,created_at,application_dogs:web_form_application_dogs_v237(*)');
 h:=replace(h,'</body>',$snippet263$<script id="chvo-crm-workflow-v263">
(function(){
 if(window.__crmWorkflowV263)return;window.__crmWorkflowV263=true;
 const rows=()=>state.webSubmissions||[],apps=id=>rows().filter(r=>r.form_type==='application'&&Number(r.crm_lead_id)===Number(id)&&r.status!=='archived');
 const phone=x=>{let d=String(x||'').replace(/\D/g,'');if(d.startsWith('00421'))d=d.slice(2);if(d.length===10&&d.startsWith('0'))d='421'+d.slice(1);if(d.length===9)d='421'+d;return d};
 const sameContact=(a,b)=>(phone(a.phone).length>=10&&phone(a.phone)===phone(b.phone))||(a.email&&b.email&&a.email.trim().toLowerCase()===b.email.trim().toLowerCase());
 const label=s=>{
  if(s.form_type!=='lead')return '';
  const linked=apps(s.id);
  if(linked.some(a=>a.status==='converted'||a.converted_dog_id))return 'Klient';
  if((state.introVisits||[]).some(v=>Number(v.source_submission_id)===Number(s.id)||linked.some(a=>Number(a.id)===Number(v.source_submission_id))))return 'Úvodná návšteva dohodnutá';
  if(linked.length)return 'Prihláška prijatá';
  return s.waiting_for_application?'✓ Čakáme na prihlášku':'';
 };
 const originalCard=webSubmissionCard;
 webSubmissionCard=function(s){const html=originalCard(s),text=label(s);return text?html.replace(/<span class="pill(?: warn)?">(?:Nové|Vybavené)<\/span>/,'<span class="pill crm-status-v263" style="white-space:normal;max-width:150px;text-align:center">'+esc(text)+'</span>'):html};
 const originalOpen=openWebSubmission;let current=0;
 const merge=row=>{if(!row)return;const found=rows().find(s=>Number(s.id)===Number(row.id));if(found)Object.assign(found,row)};
 const refresh=()=>renderWebSubmissions($('dogSearch')?.value||'');
 openWebSubmission=async function(id){
  current=Number(id);await originalOpen(id);if(current!==Number(id))return;
  const s=rows().find(r=>Number(r.id)===Number(id)),body=$('dogDetailContent');if(!s||!body)return;
  $('crmWorkflowV263')?.remove();
  const linked=s.form_type==='lead'?apps(s.id):[],root=s.crm_lead_id?rows().find(r=>Number(r.id)===Number(s.crm_lead_id)):null;
  const candidates=s.form_type==='lead'?rows().filter(a=>a.form_type==='application'&&a.status!=='archived'&&!a.crm_lead_id&&sameContact(s,a)):[];
  if(s.form_type!=='lead'&&!root)return;
  const panel=document.createElement('div');panel.className='card stack';panel.id='crmWorkflowV263';
  if(root)panel.innerHTML='<button class="btn secondary full" type="button" data-crm-open="'+Number(root.id)+'">Pôvodný záujem · '+esc(root.owner_name||'Majiteľ')+'</button>';
  else if(linked.length)panel.innerHTML='<strong>'+esc(label(s))+'</strong>'+linked.map(a=>'<button class="btn secondary full" type="button" data-crm-open="'+Number(a.id)+'">Otvoriť prihlášku · '+esc(a.application_dogs?.map(d=>d.dog_name).join(' a ')||a.dog_name||a.owner_name||'Majiteľ')+'</button>').join('');
  else panel.innerHTML='<label style="display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer"><input type="checkbox" data-crm-wait '+(s.waiting_for_application?'checked':'')+' style="width:22px;height:22px;flex:0 0 22px;accent-color:#f97316"><strong>Čakáme na prihlášku</strong></label>';
  if(candidates.length)panel.insertAdjacentHTML('beforeend','<label>Súvisiaca prihláška<select class="input" data-crm-application><option value="">Vyberte prihlášku</option>'+candidates.map(a=>'<option value="'+Number(a.id)+'">'+esc((a.owner_name||'Majiteľ')+' · '+(a.dog_name||'Prihláška')+' · '+webSubmissionDate(a.created_at))+'</option>').join('')+'</select></label><button class="btn secondary full" type="button" data-crm-link>Prepojiť prihlášku</button><div class="muted small">Prepojením potvrdíte, že ide o rovnakého majiteľa.</div>');
  panel.insertAdjacentHTML('beforeend','<div role="status" aria-live="polite" data-crm-message></div>');
  body.querySelector('.card.stack')?.before(panel);if(!panel.isConnected)body.append(panel);
  panel.querySelectorAll('[data-crm-open]').forEach(b=>b.onclick=()=>openWebSubmission(Number(b.dataset.crmOpen)));
  const checkbox=panel.querySelector('[data-crm-wait]'),message=panel.querySelector('[data-crm-message]');
  if(checkbox)checkbox.onchange=async()=>{
   const wanted=checkbox.checked;checkbox.disabled=true;message.textContent='';
   try{const r=await withJwtRetry(()=>supabase.rpc('set_web_lead_waiting_v263',{p_lead_id:Number(s.id),p_waiting:wanted}));if(r.error)throw r.error;merge(Array.isArray(r.data)?r.data[0]:r.data);refresh();message.textContent=wanted?'Vybavené · čakáme na prihlášku.':'Čakanie na prihlášku je zrušené.';}
   catch(e){checkbox.checked=Boolean(s.waiting_for_application);message.textContent=e.message||'Stav sa nepodarilo uložiť.'}finally{checkbox.disabled=false}
  };
  const link=panel.querySelector('[data-crm-link]');if(link)link.onclick=async()=>{
   const selected=Number(panel.querySelector('[data-crm-application]').value);if(!selected){message.textContent='Vyberte prihlášku.';return}
   link.disabled=true;message.textContent='';
   try{const r=await withJwtRetry(()=>supabase.rpc('link_web_application_v263',{p_lead_id:Number(s.id),p_application_id:selected}));if(r.error)throw r.error;merge(r.data?.lead);merge(r.data?.application);refresh();if(current===Number(id))await openWebSubmission(id)}catch(e){message.textContent=e.message||'Prihlášku sa nepodarilo prepojiť.'}finally{link.disabled=false}
  };
 };
 const originalFollowup=showWebSubmissionFollowup;
 showWebSubmissionFollowup=function(id){const s=rows().find(r=>Number(r.id)===Number(id));if(s?.form_type==='lead'&&s.waiting_for_application){void openWebSubmission(id);return}originalFollowup(id)};
})();

</script>
</body>$snippet263$);
for patch in select value from jsonb_array_elements('[{"old": "if(register){const c=await withJwtRetry(()=>supabase.rpc(''convert_web_application_two_dogs_v237'',{p_submission_id:context.sourceId}));if(c.error)throw c.error;await loadData()}", "new": "if(register){const c=await withJwtRetry(()=>supabase.rpc(''convert_web_application_two_dogs_v237'',{p_submission_id:context.sourceId}));if(c.error)throw c.error;await sendMetaCrmStage(context.sourceId,''qualified'');await sendMetaCrmStage(context.sourceId,''converted'');await loadData()}"}, {"old": "    if(result.error)throw result.error;\n    var ids=result.data?.dog_ids||[];", "new": "    if(result.error)throw result.error;\n    await sendMetaCrmStage(Number(id),''converted'');\n    var ids=result.data?.dog_ids||[];"}]'::jsonb) loop
 if (length(h)-length(replace(h,patch->>'old','')))/length(patch->>'old')<>1 then raise exception 'Pair event source changed';end if;
 h:=replace(h,patch->>'old',patch->>'new');
 end loop;
 if md5(h)<>'e0cd8f3987a9b90bc17032e3a39c5484' then raise exception 'Patch checksum differs';end if;
 update public.frontend_snapshots set html=h where key='stable-v10-clean';
end $patch263$;
