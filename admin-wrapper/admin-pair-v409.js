/* Staff-only pairing of two existing dog profiles for future shared passes.
 * Does NOT create passes, change visits/finance, delete owners, or grant customer access.
 */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const detail = byId('dogDetailContent');
  const wrapper = byId('dogDetail');
  if (!detail || !wrapper) return;
  const runtime = () => window.__chvostikovoAdminRuntime;
  let currentDogId = 0, queued = false, submitting = false;
  const style = document.createElement('style');
  style.textContent = '.chvo-pair-v409{margin:10px 0;padding:12px;border:1px solid #e3d9ed;border-radius:14px;background:#fff}.chvo-pair-v409 button{min-height:44px}.chvo-pair-modal-v409{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom));background:#11182788}.chvo-pair-modal-v409[hidden]{display:none!important}.chvo-pair-card-v409{box-sizing:border-box;width:min(100%,450px);max-height:100%;overflow-y:auto;padding:20px;border-radius:20px;background:white;color:#1f2937}.chvo-pair-card-v409 select{width:100%;min-height:48px;margin:12px 0;border:1px solid #d1d5db;border-radius:11px;background:#fff;padding:8px;font:inherit}.chvo-pair-actions-v409{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}.chvo-pair-actions-v409 button{min-height:44px;padding:10px 16px;border-radius:11px;border:1px solid #d1d5db;cursor:pointer}.chvo-pair-confirm-v409{color:white;background:#bc4d92;border-color:#bc4d92!important}.chvo-pair-status-v409{font-size:13px;min-height:20px}.chvo-pair-card-v409 label{display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.45}';
  document.head.appendChild(style);
  const modal = document.createElement('div');
  modal.id = 'chvoPairModalV409';
  modal.className = 'chvo-pair-modal-v409';
  modal.hidden = true;
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','chvoPairTitleV409');
  modal.innerHTML = '<section class="chvo-pair-card-v409"><h2 id="chvoPairTitleV409">Spárovať existujúcich psíkov</h2><p id="chvoPairHelpV409">Vyberte druhého psíka, ak majú obaja skutočne rovnakého majiteľa. Párovanie nemení historické vstupy ani automaticky nevytvára permanentku.</p><select id="chvoPairSelectV409" aria-label="Druhý psík"></select><label><input id="chvoPairVerifyV409" type="checkbox">Potvrdzujem, že som overil/a spoločného majiteľa oboch psíkov.</label><p id="chvoPairStatusV409" class="chvo-pair-status-v409" role="status" aria-live="polite"></p><div class="chvo-pair-actions-v409"><button id="chvoPairCancelV409" type="button">Zrušiť</button><button id="chvoPairCommitV409" class="chvo-pair-confirm-v409" type="button">Spárovať psíkov</button></div></section>';
  document.body.appendChild(modal);
  const select = byId('chvoPairSelectV409');
  const status = byId('chvoPairStatusV409');
  const verify = byId('chvoPairVerifyV409');
  const commit = byId('chvoPairCommitV409');
  function fail(message) { status.textContent=String(message || 'Úkon sa nepodaril.'); }
  function dogs() { return Array.isArray(runtime()?.state?.dogs) ? runtime().state.dogs : []; }
  const id = value => Number(value);
  function renderLauncher() {
    queued=false;
    if (!currentDogId || wrapper.classList.contains('hidden')) return;
    if (!dogs().some(d => id(d.id)===currentDogId && d.active)) return;
    const target=byId('dogInfoCard')||detail;
    if (!target || target.querySelector('#chvoPairLaunchV409')) return;
    const box=document.createElement('div');box.className='chvo-pair-v409';
    const button=document.createElement('button');button.id='chvoPairLaunchV409';button.type='button';button.className='btn secondary full';button.textContent='Spárovať s ďalším psíkom';
    const note=document.createElement('p');note.className='muted small';note.textContent='Pre spoločnú permanentku musia mať obaja psíkovia jedného overeného majiteľa.';
    box.append(button,note);target.appendChild(box);
  }
  function schedule() { if(queued)return;queued=true;requestAnimationFrame(renderLauncher); }
  document.addEventListener('click', e => {
    const card=e.target.closest?.('#dogsList .dog[data-dog-id], #inactiveDogsList .dog[data-dog-id]');
    if (card) {currentDogId=id(card.dataset.dogId);schedule();}
    if (e.target.closest?.('#chvoPairLaunchV409')) show();
  },true);
  new MutationObserver(schedule).observe(detail,{childList:true});
  function close() {
    if(submitting)return;
    modal.hidden=true;verify.checked=false;status.textContent='';
  }
  byId('chvoPairCancelV409').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  function show() {
    if(!currentDogId)return;
    select.replaceChildren();
    const other=dogs().filter(d=>d.active&&id(d.id)!==currentDogId).sort((a,b)=>String(a.name).localeCompare(String(b.name),'sk'));
    for(const d of other){const option=document.createElement('option');option.value=String(d.id);option.textContent=String(d.name);select.appendChild(option)}
    status.textContent=other.length?'':'Nie je dostupný ďalší aktívny psík.';
    verify.checked=false;commit.disabled=!other.length;modal.hidden=false;select.focus();
  }
  async function query(client,table,columns,apply) {
    let req=client.from(table).select(columns);
    req=apply(req);
    const {data,error}=await req;
    if(error)throw new Error('Kontrola údajov zlyhala: '+error.message);
    return data||[];
  }
  async function pair() {
    if(submitting||modal.hidden||!verify.checked){fail('Najprv potvrďte spoločného majiteľa.');return}
    const secondId=id(select.value),firstId=currentDogId,client=runtime()?.client || (typeof supabase !== 'undefined' && typeof supabase?.from === 'function' ? supabase : null);
    if(!Number.isSafeInteger(firstId)||!Number.isSafeInteger(secondId)||firstId===secondId){fail('Vyberte dvoch rôznych psíkov.');return}
    if(!client?.from){fail('Chýba aktívne prihlásenie personálu. Obnovte administráciu.');return}
    submitting=true;commit.disabled=true;status.textContent='Overujem záznamy…';
    try {
      const pair=await query(client,'dogs','id,name,owner_id,active',r=>r.in('id',[firstId,secondId]));
      if(pair.length!==2||pair.some(d=>!d.active||!d.owner_id))throw new Error('Obaja psíci musia byť aktívni a mať majiteľa.');
      const a=pair.find(d=>id(d.id)===firstId),b=pair.find(d=>id(d.id)===secondId);
      if(!a||!b)throw new Error('Záznam psa sa zmenil.');
      if(id(a.owner_id)===id(b.owner_id)){status.textContent='Psíkovia už majú spoločného majiteľa. Pri ďalšej kúpe môžete vybrať spoločnú permanentku.';return}
      const ownerIds=[id(a.owner_id),id(b.owner_id)];
      const owned=await query(client,'dogs','id,owner_id',r=>r.in('owner_id',ownerIds));
      if(owned.length!==2||owned.some(d=>![firstId,secondId].includes(id(d.id))))throw new Error('Niektorý majiteľ má ďalšieho psa. Párovanie sa musí individuálne preveriť.');
      const links=await query(client,'customer_owner_links','owner_id',r=>r.in('owner_id',ownerIds));
      if(links.length)throw new Error('Majiteľ už má zákaznícky účet. Najprv treba individuálne skontrolovať oprávnenia.');
      const passes=await query(client,'passes','id,dog_id',r=>r.in('dog_id',[firstId,secondId]));
      const memberships=await query(client,'pass_dogs','pass_id,dog_id',r=>r.in('dog_id',[firstId,secondId]));
      if(passes.length||memberships.length)throw new Error('Niektorý psík už má permanentku. Staré permanentky sa nesmú spájať automaticky.');
      const pending=await query(client,'customer_pass_requests','id,dog_id',r=>r.in('dog_id',[firstId,secondId]).eq('status','pending'));
      if(pending.length)throw new Error('Existuje otvorený záujem o permanentku. Najprv ho spracujte.');
      const updated=await client.from('dogs').update({owner_id:a.owner_id}).eq('id',secondId).eq('owner_id',b.owner_id).select('id,owner_id');
      if(updated.error)throw updated.error;
      if(updated.data?.length!==1)throw new Error('Záznam sa medzičasom zmenil, nespároval sa žiadny pes.');
      status.textContent='Hotovo. Obaja psíci majú rovnakého majiteľa. Permanentku možno zakúpiť spoločnú.';
      try {
        const state=runtime()?.state;if(state?.dogs){const dog=state.dogs.find(d=>id(d.id)===secondId);if(dog)dog.owner_id=a.owner_id}
        await runtime()?.loadData?.();
      }catch(_){}
    } catch(e) {fail(e?.message||'Párovanie sa nepodarilo.')} finally {submitting=false;commit.disabled=false}
  }
  commit.addEventListener('click',()=>void pair());
})();