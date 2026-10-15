function openPairIntroV250(source,visit=null){
 $('dogDetail')?.classList.add('hidden');openDogCreate('intro');state.convertingSubmissionId=source.id;
 let dogs=visit?.application_dogs||source.application_dogs;
 let draft=null;try{if(!visit)draft=JSON.parse(sessionStorage.getItem('chvo-intro-draft-'+source.id)||'null')}catch(_){}
 if(draft?.dogs?.length===2)dogs=draft.dogs;
 state.introPairV250={sourceId:source.id,introId:visit?.id||null};
 const form=$('introVisitForm');form.querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);form.classList.add('pair-intro-v250');
 const panel=document.createElement('div');panel.id='introPairPanelV250';panel.className='stack';
 const field=(label,id,value,type='text')=>'<label>'+esc(label)+'<input class="input" id="'+id+'" type="'+type+'" value="'+esc(value??'')+'"></label>';
 panel.innerHTML='<div class="muted small">Úvodná návšteva pre dvoch psíkov – jeden majiteľ</div>'+field('Majiteľ','pairIntroOwnerV250',draft?.owner??visit?.owner_name??source.owner_name)+field('Telefón','pairIntroPhoneV250',draft?.phone??visit?.owner_phone??source.phone)+
 '<div class="grid2">'+field('Dátum návštevy','pairIntroDateV250',draft?.date??visit?.visit_date??'','date')+field('Čas návštevy','pairIntroTimeV250',draft?.time??visit?.visit_time?.slice(0,5)??'','time')+'</div>';
 dogs.slice().sort((a,b)=>a.dog_order-b.dog_order).forEach((d,i)=>{
  const details=document.createElement('details');details.className='card pair-intro-dog-v250';details.open=i===0;
  details.innerHTML='<summary><strong>'+(i+1)+'. psík – '+esc(d.dog_name)+'</strong></summary><div class="stack" style="margin-top:12px">'+
  field('Meno psa','pairDogName'+i,d.dog_name)+field('Plemeno','pairDogBreed'+i,d.dog_breed)+field('Váha (kg)','pairDogWeight'+i,d.dog_weight_kg)+field('Vek','pairDogAge'+i,d.dog_age_text)+
  '<label>Pohlavie<select class="input" id="pairDogSex'+i+'"><option value="">Neuvedené</option><option value="male">Pes</option><option value="female">Suka</option></select></label>'+ 
  '<label>Kastrovaný / sterilizovaná<select class="input" id="pairDogNeutered'+i+'"><option value="">Neuvedené</option><option value="true">Áno</option><option value="false">Nie</option></select></label>'+ 
  field('Plán využívania','pairDogUsage'+i,d.interest_reason)+
  '<label>Alergie a zdravotné obmedzenia<textarea class="input" id="pairDogAllergies'+i+'" maxlength="3000" rows="3">'+esc(d.dog_allergies||'')+'</textarea></label>'+ 
  '<label>Povaha a ďalšie informácie<textarea class="input" id="pairDogTemperament'+i+'" maxlength="3000" rows="3">'+esc(d.dog_temperament||'')+'</textarea></label></div>';
  panel.append(details);
 });
 const notes=document.createElement('label');notes.textContent='Poznámka';const input=document.createElement('textarea');input.id='pairIntroNotesV250';input.className='input';input.rows=3;input.value=draft?.notes??visit?.notes??'';notes.append(input);panel.append(notes);
 form.prepend(panel);
 dogs.forEach((d,i)=>{$('pairDogSex'+i).value=d.dog_sex||'';$('pairDogNeutered'+i).value=d.dog_neutered==null?'':String(d.dog_neutered)});
 if(visit){
  const register=document.createElement('button');register.type='button';register.className='btn secondary full';register.textContent='Prihlásiť oboch psíkov k jednému majiteľovi';register.onclick=()=>{if(confirm('Prihlásiť oboch psíkov do registra k jednému majiteľovi?'))void savePairIntroV250(null,true)};panel.append(register);
  const remove=document.createElement('button');remove.type='button';remove.className='btn danger full';remove.textContent='Zrušiť úvodnú návštevu';remove.onclick=async()=>{if(!confirm('Zrušiť spoločnú úvodnú návštevu a vrátiť prihlášku medzi nové?'))return;remove.disabled=true;try{const result=await withJwtRetry(()=>supabase.rpc('cancel_web_intro_two_v250',{p_intro_id:visit.id}));if(result.error)throw result.error;state.introVisits=state.introVisits.filter(x=>Number(x.id)!==Number(visit.id));source.status='new';closeDogCreate();renderIntroVisits('');renderWeek();queueAdminLive('forms',60)}catch(e){alert(e.message||String(e));remove.disabled=false}};panel.append(remove);
 }
 const persist=()=>{try{sessionStorage.setItem('chvo-intro-draft-'+source.id,JSON.stringify(readPairIntroV250()))}catch(_){}};
 panel.addEventListener('input',persist);panel.addEventListener('change',persist);
 $('dogCreateTitle').textContent=visit?'Upraviť úvodnú návštevu':'Úvodná návšteva';
 form.querySelector('button:not([type="button"])').textContent=visit?'Uložiť zmeny':'Uložiť úvodnú návštevu';
}
function readPairIntroV250(){
 const dogs=[0,1].map(i=>({dog_order:i+1,dog_name:$('pairDogName'+i).value.trim(),dog_breed:$('pairDogBreed'+i).value.trim(),dog_weight_kg:$('pairDogWeight'+i).value.trim()?parseAdminDogWeightKg($('pairDogWeight'+i).value):null,dog_age_text:$('pairDogAge'+i).value.trim(),dog_sex:$('pairDogSex'+i).value||null,dog_neutered:$('pairDogNeutered'+i).value===''?null:$('pairDogNeutered'+i).value==='true',interest_reason:$('pairDogUsage'+i).value.trim(),dog_allergies:$('pairDogAllergies'+i).value.trim(),dog_temperament:$('pairDogTemperament'+i).value.trim()}));
 return {dogs,owner:$('pairIntroOwnerV250').value.trim(),phone:$('pairIntroPhoneV250').value.trim(),date:$('pairIntroDateV250').value,time:$('pairIntroTimeV250').value,notes:$('pairIntroNotesV250').value.trim()};
}
async function savePairIntroV250(e,register=false){
 e?.preventDefault();const context=state.introPairV250,msg=$('introVisitMessage');if(!context||context.busy)return;
 const data=readPairIntroV250();
 if(!data.date||!data.time||!data.owner||!data.phone||data.dogs.some(d=>!d.dog_name)){msg.innerHTML='<div class="error">Vyplňte majiteľa, telefón, dátum, čas a obe mená.</div>';return}
 if([0,1].some(i=>$('pairDogWeight'+i).value.trim()&&data.dogs[i].dog_weight_kg==null)){msg.innerHTML='<div class="error">Skontrolujte váhu oboch psíkov.</div>';return}
 context.busy=true;const buttons=[...$('introVisitForm').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);msg.textContent='Ukladám…';
 try{
  const phone=data.phone.startsWith('+')?data.phone.replace(/\s/g,''):phoneWithPrefix(data.phone);
  const r=await withJwtRetry(()=>supabase.rpc('save_web_intro_two_v250',{p_submission_id:context.sourceId,p_dogs:data.dogs,p_date:data.date,p_time:data.time,p_owner_name:data.owner,p_owner_phone:phone,p_notes:data.notes||null,p_intro_id:context.introId}));if(r.error)throw r.error;
  const visit=r.data.visit;context.introId=visit.id;
  state.introVisits=state.introVisits.filter(x=>Number(x.id)!==Number(visit.id)).concat(visit);
  const source=state.webSubmissions.find(s=>Number(s.id)===Number(context.sourceId));if(source)source.status='reviewed';
  if(register){const c=await withJwtRetry(()=>supabase.rpc('convert_web_application_two_dogs_v237',{p_submission_id:context.sourceId}));if(c.error)throw c.error;await loadData()}
  else if(r.data.created)void sendMetaCrmStage(context.sourceId,'qualified');
  sessionStorage.removeItem('chvo-intro-draft-'+context.sourceId);renderIntroVisits('');renderWeek();closeDogCreate();switchTab('dogs');queueAdminLive('forms',60);
 }catch(error){msg.textContent='Uloženie sa nepodarilo: '+(error.message||error)+'. Údaje ostali vo formulári.'}
 finally{context.busy=false;buttons.forEach(b=>b.disabled=false)}
}
