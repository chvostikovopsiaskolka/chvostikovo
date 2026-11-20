/* v433: real staff-controlled poll; hard-scoped to the single verified school customer. 
 * Public client receives only its own votes; staff identities remain server-side under RLS.
 * The previous localStorage v432 demo is NOT a source of votes.
 */
(() => {
 'use strict';
 const OWNER_FINGERPRINT='288c196a3d8f47da8e96737e2c1753be2db7b1864c406c95e312c7687e0dcd66';
 const $=id=>document.getElementById(id);
 const account=()=>state?.session?.user?.id||'';
 const en=()=>window.ChvostikovoLocale?.getLanguage?.()==='en';
 const text=(sk,english)=>en()?english:sk;
 const el=(tag,className,value)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(value!==undefined)node.textContent=String(value);
  return node;
 };
 let allowed='',sequence=0,loaded='',loading=null,active=null,choices=[],selection=null,
     quantityValue='1',expanded=false,sending=false,thankYou=false,error='';
 function clear(){
  $('customerPollMenuV432')?.remove();
  $('customerPollOverviewV432')?.remove();
  $('customerPollNavBadgeV432')?.remove();
  const group=$('customerMenuPrimaryV432');
  if(group){for(const child of [...group.children])group.before(child);group.remove()}
  document.documentElement.classList.remove('customer-polls-owner-v432');
  allowed='';loaded='';active=null;choices=[];expanded=false;thankYou=false;error='';
 }
 async function matchesOwner(id){
  if(!id||!globalThis.crypto?.subtle)return false;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(id).toLowerCase()));
  return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')===OWNER_FINGERPRINT;
 }
 function menuLayout(){
  const menu=$('menuTab'),first=$('menuDogGroup');
  if(!menu||!first)return false;
  if(!$('customerMenuPrimaryV432')){
   const wrap=el('div','customer-menu-primary-v432');
   wrap.id='customerMenuPrimaryV432';
   first.before(wrap);
   for(const id of ['menuDogGroup','menuContact','menuSettingsGroup','menuMessage']){
    const node=$(id);if(node)wrap.append(node);
   }
  }
  if(!$('customerPollMenuV432')){
   const box=el('section','customer-poll-v432 customer-poll-menu-v432');
   box.id='customerPollMenuV432';
   box.addEventListener('click',click);
   menu.querySelector('.customer-social-v223')?.before(box);
   if(!box.isConnected)menu.append(box);
  }
  if(!$('customerPollNavBadgeV432')){
   const nav=$('navDog');
   if(nav){
    const badge=el('span','customer-poll-nav-badge-v432','1');
    badge.id='customerPollNavBadgeV432';badge.setAttribute('aria-hidden','true');
    nav.append(badge);
   }
  }
  document.documentElement.classList.add('customer-polls-owner-v432');
  return true;
 }
 const safeError=()=>text('Hlasovanie sa nepodarilo načítať. Skúste otvoriť Menu znova.',
  'Could not load the poll. Please open Menu again.');
 async function getRows(path,id){
  const result=await customerReadJsonV391(SUPABASE_URL+'/rest/v1/'+path,id);
  if(!result.response?.ok)throw new Error('Poll read failed '+result.response?.status);
  return Array.isArray(result.rows)?result.rows:[];
 }
 async function fetchPolls(id){
  const pollRows=await getRows('portal_polls_v433?status=eq.published&select=id,title,question,description,price_note,created_at&order=created_at.desc&limit=10',id);
  if(!pollRows.length)return {poll:null,options:[]};
  const votes=await getRows('portal_poll_votes_v433?user_id=eq.'+encodeURIComponent(id)+'&select=poll_id',id);
  const done=new Set(votes.map(row=>row.poll_id));
  const poll=pollRows.find(row=>!done.has(row.id));
  if(!poll)return {poll:null,options:[]};
  const options=await getRows('portal_poll_options_v433?poll_id=eq.'+encodeURIComponent(poll.id)+'&select=id,label,position,asks_quantity&order=position.asc',id);
  return {poll:options.length>=2?poll:null,options};
 }
 async function refresh(id,force=false){
  if(!allowed||allowed!==id)return;
  if(loading&&!force)return loading;
  if(loaded===id&&!force)return;
  const version=++sequence;
  loading=(async()=>{
   try{
    const next=await fetchPolls(id);
    if(version!==sequence||allowed!==account())return;
    active=next.poll;choices=next.options;loaded=id;error='';
   }catch(exc){
    if(version!==sequence||allowed!==account())return;
    // Fail closed: no stale poll offered when the server state cannot be confirmed.
    active=null;choices=[];loaded='';error=safeError();
   }finally{
    if(version===sequence&&allowed===account()){render();loading=null}
   }
  })();
  return loading;
 }
 function render(){
  if(!allowed||allowed!==account())return;
  if(!menuLayout())return;
  const root=$('customerPollMenuV432'),badge=$('customerPollNavBadgeV432');
  const show=Boolean(active||thankYou);
  root.hidden=!show;root.replaceChildren();
  if(badge)badge.hidden=!active||thankYou;
  if(!show)return;
  if(thankYou){
   const success=el('div','customer-poll-complete-v432');
   success.setAttribute('role','status');
   success.append(el('strong','',text('Ďakujeme za váš hlas!','Thank you for voting!')),
     el('p','',text('Váš záujem sme zaznamenali.','Your response has been recorded.')));
   const done=el('button','customer-poll-finish-v433',text('Hotovo','Done'));
   done.type='button';done.dataset.pollDone='true';
   root.append(success,done);return;
  }
  if(!expanded){
   const marker=el('span','customer-poll-kicker-v432',text('Nové hlasovanie','New poll'));
   const label=el('strong','customer-poll-invite-v433',text('Je k dispozícii nové hlasovanie.','A new poll is available.'));
   const btn=el('button','customer-poll-open-v433',text('Chcem hlasovať','I want to vote'));
   btn.type='button';btn.dataset.pollExpand='true';
   root.append(marker,label,btn);
   return;
  }
  const h=el('h2','',active.title);h.id='customerPollMenuTitleV432';h.tabIndex=-1;
  const question=el('p','customer-poll-question-v432',active.question);
  const details=el('p','customer-poll-desc-v432',active.description);
  root.append(el('span','customer-poll-kicker-v432',text('Hlasovanie','Poll')),h,question,details);
  if(active.price_note)root.append(el('p','customer-poll-price-v433',active.price_note));
  const opts=el('div','customer-poll-options-v432');
  opts.setAttribute('role','group');opts.setAttribute('aria-label',active.question);
  choices.slice(0,10).forEach(row=>{
   const button=el('button','customer-poll-choice-v432'+(selection===row.id?' selected-v433':''),row.label);
   button.type='button';button.dataset.pollChoice=row.id;
   button.setAttribute('aria-pressed',String(selection===row.id));
   button.disabled=sending;
   opts.append(button);
  });
  root.append(opts);
  const selected=choices.find(x=>x.id===selection);
  if(selected?.asks_quantity){
   const qty=el('div','customer-poll-quantity-v433');
   const label=el('label','',text('O koľko kusov máte záujem?','How many copies would you like?'));
   label.htmlFor='customerPollQuantityV433';
   const field=el('input','');
   field.id='customerPollQuantityV433';field.type='number';field.min='1';field.max='999';
   field.step='1';field.inputMode='numeric';field.required=true;field.value=quantityValue;
   field.disabled=sending;
   field.addEventListener('input',()=>{quantityValue=field.value});
   const send=el('button','customer-poll-submit-v433',sending?text('Ukladám…','Saving…'):text('Potvrdiť hlas','Confirm vote'));
   send.type='button';send.dataset.pollSubmit='true';send.disabled=sending;
   qty.append(label,field,send);root.append(qty);
  }
  if(error){
   const msg=el('p','customer-poll-error-v433',error);msg.setAttribute('role','alert');root.append(msg);
  }
  const close=el('button','customer-poll-collapse-v433',text('Späť','Back'));
  close.type='button';close.dataset.pollCollapse='true';root.append(close);
 }
 async function submit(choice){
  if(!allowed||allowed!==account()||!active||sending)return;
  const target=choices.find(x=>x.id===choice);
  if(!target)return;
  const count=Number(quantityValue);
  if(target.asks_quantity&&(!Number.isInteger(count)||count<1||count>999)){
   error=text('Zadajte počet kusov od 1 do 999.','Enter a quantity between 1 and 999.');
   render();return;
  }
  sending=true;error='';render();
  const userId=allowed,postPoll=active.id;
  try{
   const session=await ensureCustomerSessionV357();
   if(userId!==account()||session.user?.id!==userId)throw new Error('Účet sa zmenil.');
   const response=await fetch(SUPABASE_URL+'/rest/v1/portal_poll_votes_v433',{
    method:'POST',cache:'no-store',
    headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+session.access_token,
     'Content-Type':'application/json',Prefer:'return=minimal'},
    body:JSON.stringify({poll_id:postPoll,option_id:choice,user_id:userId,
     quantity:target.asks_quantity?count:null})
   });
   if(response.status===409){
    // A prior tab may have already recorded a vote; server is the source of truth.
    const rows=await getRows('portal_poll_votes_v433?poll_id=eq.'+encodeURIComponent(postPoll)+
      '&user_id=eq.'+encodeURIComponent(userId)+'&select=id&limit=1',userId);
    if(!rows.length)throw new Error('Conflict without existing vote');
   }else if(!response.ok)throw new Error('Poll write failed '+response.status);
   if(userId!==account())return;
   thankYou=true;active=null;choices=[];selection=null;render();
  }catch(exc){
   if(userId===account()){
    error=text('Hlas sa nepodarilo uložiť. Skúste to znova.','Could not save your vote. Please try again.');
   }
  }finally{sending=false;if(userId===account())render()}
 }
 function click(event){
  if(!allowed||allowed!==account())return;
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.pollExpand){
   expanded=true;render();requestAnimationFrame(()=>$('#customerPollMenuTitleV432')?.focus({preventScroll:true}));return;
  }
  if(button.dataset.pollCollapse){expanded=false;selection=null;error='';render();return}
  if(button.dataset.pollDone){thankYou=false;loaded='';expanded=false;render();void refresh(allowed,true);return}
  if(button.dataset.pollSubmit){void submit(selection);return}
  if(button.dataset.pollChoice){
   const choice=choices.find(v=>v.id===button.dataset.pollChoice);
   if(!choice||sending)return;
   selection=choice.id;error='';
   if(choice.asks_quantity){render();$('#customerPollQuantityV433')?.focus();return}
   void submit(choice.id);
  }
 }
 async function sync(){
  const id=account();
  if(!id||!state?.data){sequence++;clear();return}
  if(allowed===id){render();return}
  sequence++;clear();
  const marker=sequence;
  let accepted=false;
  try{accepted=await matchesOwner(id)}catch(_){}
  if(marker!==sequence||id!==account()||!state?.data||!accepted)return;
  allowed=id;
  if(!menuLayout())return;
  render();
  await refresh(id,true);
 }
 addCustomerHook('afterBootstrap',sync);
 addCustomerHook('afterRenderDog',()=>{if(allowed===account())render();else void sync()});
 addCustomerHook('afterSwitchTab',()=>{if(allowed===account())render()});
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-customer-locale]')&&allowed===account())
   requestAnimationFrame(render);
 });
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&allowed===account()&&!sending&&loaded===allowed)void refresh(allowed,true);
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
 else void sync();
})();
