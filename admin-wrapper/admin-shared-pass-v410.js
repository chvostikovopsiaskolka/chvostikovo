/* Staff-only explicit new shared pass purchase, for exactly two verified owner dogs.
 * NOT for backdating/repairing historical sales or attended visits.
 * The authoritative staff RPC handles price, idempotency, expiry and shared membership.
 */
(() => {
  'use strict';
  const byId = value => document.getElementById(value);
  const detail = byId('dogDetailContent');
  if (!detail || !byId('dogDetail')) return;
  const runtime = () => window.__chvostikovoAdminRuntime;
  const num = value => Number(value);
  let currentDogId = 0, operationId = '', pending = false, scheduled = false;
  const today = () => {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value = type => parts.find(p=>p.type===type)?.value||'';
    return value('year')+'-'+value('month')+'-'+value('day');
  };
  const client = () => runtime()?.client || (typeof supabase !== 'undefined' && typeof supabase?.rpc === 'function' ? supabase : null);
  const getDogs = () => Array.isArray(runtime()?.state?.dogs) ? runtime().state.dogs : [];
  const ownPair = () => {
    const primary = getDogs().find(d=>num(d.id)===currentDogId&&d.active&&num(d.owner_id)>0);
    if (!primary) return [];
    const pool=getDogs().filter(d=>d.active&&num(d.owner_id)===num(primary.owner_id));
    return pool.length===2&&pool.some(d=>num(d.id)===currentDogId)?pool:[];
  };
  // The new-sale action is not an owner-pairing or shared-pass repair tool.
  // Fail closed if pass data has not loaded, and hide it when either dog already
  // has an active/queued pass (including explicit pass_dogs memberships).
  const existingCurrentPass = pool => {
    if(pool.length!==2)return true;
    const passStore=runtime()?.state?.passes;
    const mapLike=passStore&&typeof passStore.get==='function'&&typeof passStore.values==='function';
    if(!mapLike&&!Array.isArray(passStore))return true;
    const passes=mapLike
      ?pool.flatMap(d=>passStore.get(num(d.id))||[])
      :passStore;
    const ids=pool.map(d=>num(d.id));
    return passes.some(p=>['active','queued'].includes(p.status)&&(
      ids.includes(num(p.dog_id))||
      (Array.isArray(p.pass_dogs)&&p.pass_dogs.some(member=>ids.includes(num(member.dog_id))))
    ));
  };
  const style=document.createElement('style');
  style.textContent='#chvoSharedLaunchV410{margin-top:10px;min-height:44px}#chvoSharedModalV410{position:fixed;inset:0;z-index:100001;display:grid;place-items:center;padding:calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px);background:#11182799}#chvoSharedModalV410[hidden]{display:none!important}#chvoSharedModalV410>section{box-sizing:border-box;background:#fff;border-radius:20px;padding:22px;max-height:100%;overflow:auto;width:min(100%,440px);color:#1f2937}#chvoSharedModalV410 label{display:flex;gap:10px;line-height:1.5}#chvoSharedModalV410 button{min-height:44px;border-radius:12px;padding:8px 14px;cursor:pointer}#chvoSharedModalV410 button[disabled]{opacity:.5}#chvoSharedStatusV410{min-height:24px;font-size:13px}';
  document.head.appendChild(style);
  const modal=document.createElement('div');
  modal.id='chvoSharedModalV410';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','chvoSharedTitleV410');
  modal.innerHTML='<section><h2 id="chvoSharedTitleV410">Nová spoločná permanentka</h2><p id="chvoSharedDogsV410"></p><p><strong>10 vstupov · 200 €</strong> (systémová cena). Predaj sa zaznamená iba raz a permanentka bude patriť obom psíkom.</p><p>Určené iba pre <strong>nový dnešný predaj</strong>. Ak bola permanentka zaplatená skôr alebo už mali psíci vstupy, toto tlačidlo nepoužívajte – potrebná je osobitná oprava evidencie.</p><label><input type="checkbox" id="chvoSharedConfirmV410"> Potvrdzujem nový predaj za 200 € a že nejde o už zaplatenú permanentku.</label><p id="chvoSharedStatusV410" role="status" aria-live="polite"></p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end"><button id="chvoSharedCancelV410" type="button">Zrušiť</button><button id="chvoSharedBuyV410" type="button" style="background:#bc4d92;color:#fff;border:0">Potvrdiť predaj</button></div></section>';
  document.body.append(modal);
  const status=byId('chvoSharedStatusV410'),confirm=byId('chvoSharedConfirmV410'),buy=byId('chvoSharedBuyV410');
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
  function render(){
    scheduled=false;
    if(byId('dogDetail').classList.contains('hidden'))return;
    const target=byId('dogInfoCard');
    if(!target)return;
    const pool=ownPair(),existing=byId('chvoSharedBoxV410');
    if(pool.length!==2||existingCurrentPass(pool)){existing?.remove();return}
    if(existing?.parentElement===target)return;
    existing?.remove();
    const btn=document.createElement('button');btn.id='chvoSharedLaunchV410';btn.type='button';btn.className='btn full';btn.textContent='Zakúpiť spoločnú permanentku (2 psíkovia)';
    const div=document.createElement('div');div.id='chvoSharedBoxV410';div.className='chvo-pair-v409';div.append(btn);
    const note=document.createElement('p');note.className='muted small';note.textContent='Nový predaj pre oboch; minulé návštevy sa nemenia.';
    div.append(note);target.append(div);
  }
  document.addEventListener('click',event=>{
    const card=event.target.closest?.('#dogsList .dog[data-dog-id], #inactiveDogsList .dog[data-dog-id]');
    if(card){currentDogId=num(card.dataset.dogId);schedule()}
    if(event.target.closest?.('#chvoSharedLaunchV410'))open();
  },true);
  new MutationObserver(schedule).observe(detail,{childList:true});
  function open(){
    const pool=ownPair();if(pool.length!==2||existingCurrentPass(pool))return;
    byId('chvoSharedDogsV410').textContent=pool.map(d=>d.name).join(' + ');
    confirm.checked=false;status.textContent='';buy.disabled=false;
    operationId=crypto.randomUUID();
    modal.hidden=false;confirm.focus();
  }
  function close(){if(pending)return;modal.hidden=true;confirm.checked=false}
  byId('chvoSharedCancelV410').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  async function rows(c,table,fields,make){
    const {data,error}=await make(c.from(table).select(fields));
    if(error)throw Error('Kontrola databázy zlyhala: '+error.message);
    return data||[];
  }
  async function purchase(){
    if(pending||modal.hidden)return;
    if(!confirm.checked){status.textContent='Potvrďte skutočný nový predaj.';return}
    const pool=ownPair(),c=client();
    if(pool.length!==2||existingCurrentPass(pool)||!c?.rpc||!c?.from){status.textContent='Existujúca permanentka, nenačítané údaje alebo neplatné prihlásenie. Nový predaj nie je povolený.';return}
    pending=true;buy.disabled=true;status.textContent='Kontrolujem predaj…';
    try{
      const ids=pool.map(d=>num(d.id)).sort((a,b)=>a-b);
      const owners=await rows(c,'dogs','id,owner_id,active',q=>q.eq('owner_id',num(pool[0].owner_id)));
      if(owners.length!==2||owners.some(d=>!ids.includes(num(d.id))||!d.active))throw Error('Spoločný majiteľ musí mať presne týchto dvoch aktívnych psíkov.');
      const passes=await rows(c,'passes','id,dog_id',q=>q.in('dog_id',ids));
      const memberships=await rows(c,'pass_dogs','pass_id,dog_id',q=>q.in('dog_id',ids));
      if(passes.length||memberships.length)throw Error('Niektorý psík už má históriu permanentky. Predaj musí personál individuálne overiť.');
      const interest=await rows(c,'customer_pass_requests','id,dog_id',q=>q.in('dog_id',ids).eq('status','pending'));
      if(interest.length)throw Error('Najprv potvrďte existujúci záujem o permanentku.');
      const args={p_dog_id:currentDogId,p_dog_ids:ids,p_total_entries:10,p_purchased_on:today(),p_no_expiry:false,p_use_today_single:false,p_operation_id:operationId};
      const {data:passId,error}=await c.rpc('admin_purchase_shared_pass_v348',args);
      if(error)throw Error(error.message||'Predaj sa neuložil.');
      const pass=await rows(c,'passes','id,total_entries,used_entries,purchase_price',q=>q.eq('id',passId));
      const members=await rows(c,'pass_dogs','dog_id',q=>q.eq('pass_id',passId));
      if(pass.length!==1||num(pass[0].total_entries)!==10||num(pass[0].purchase_price)!==200||members.length!==2||members.some(m=>!ids.includes(num(m.dog_id))))throw Error('Predaj sa mohol uložiť, ale overenie zostatku alebo dvojice neprešlo. Nákup neopakujte bez kontroly.');
      status.textContent='Overené: jedna spoločná permanentka pre oboch psíkov, '+pass[0].used_entries+'/10 použitých. Minulé návštevy sa nemenili.';
      buy.disabled=true;
      try {await runtime()?.loadData?.()} catch (_) {}
    }catch(e){status.textContent=String(e?.message||'Neznáma chyba');buy.disabled=false}
    finally{pending=false}
  }
  buy.addEventListener('click',()=>void purchase());
})();
