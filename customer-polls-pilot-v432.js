/* v434: server-scoped polls. Published audience is enforced by Supabase RLS;
 * customer sees only their own vote, and no staff identity is exposed.
 */
(() => {
 'use strict';
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
 let allowed='',sequence=0,loaded='',loading=null,active=null,choices=[],selection=null,publishedForAccount=false,
     quantityValue='1',sending=false,thankYou=false,error='';
 function unmountUi(){
  $('customerPollMenuV432')?.remove();
  $('customerPollOverviewV432')?.remove();
  $('customerPollNavBadgeV432')?.remove();
  const group=$('customerMenuPrimaryV432');
  if(group){for(const child of [...group.children])group.before(child);group.remove()}
  document.documentElement.classList.remove('customer-polls-owner-v432');
 }
 function clear(){unmountUi();allowed='';loaded='';active=null;choices=[];selection=null;publishedForAccount=false;quantityValue='1';thankYou=false;error=''}
 function menuLayout(showPoll){
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
  if(showPoll&&!$('customerPollMenuV432')){
   const box=el('section','customer-poll-v432 customer-poll-menu-v432');
   box.id='customerPollMenuV432';
   box.addEventListener('click',click);
   menu.querySelector('.customer-social-v223')?.before(box);
   if(!box.isConnected)menu.append(box);
  }
  if(showPoll&&!$('customerPollNavBadgeV432')){
   const nav=$('navDog');
   if(nav){
    const badge=el('span','customer-poll-nav-badge-v432','1');
    badge.id='customerPollNavBadgeV432';badge.setAttribute('aria-hidden','true');
    nav.append(badge);
   }
  }
  if(!showPoll){$('customerPollMenuV432')?.remove();$('customerPollNavBadgeV432')?.remove()}
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
  if(!pollRows.length)return {poll:null,options:[],publishedForAccount:false};
  const votes=await getRows('portal_poll_votes_v433?user_id=eq.'+encodeURIComponent(id)+'&select=poll_id',id);
  const done=new Set(votes.map(row=>row.poll_id));
  const poll=pollRows.find(row=>!done.has(row.id));
  if(!poll)return {poll:null,options:[],publishedForAccount:true};
  const options=await getRows('portal_poll_options_v433?poll_id=eq.'+encodeURIComponent(poll.id)+'&select=id,label,position,asks_quantity&order=position.asc',id);
  return {poll:options.length>=2?poll:null,options,publishedForAccount:true};
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
    active=next.poll;choices=next.options;publishedForAccount=next.publishedForAccount;loaded=id;error='';
   }catch(exc){
    if(version!==sequence||allowed!==account())return;
    // Fail closed: no stale poll offered when the server state cannot be confirmed.
    active=null;choices=[];publishedForAccount=false;loaded='';error=safeError();
   }finally{
    if(version===sequence&&allowed===account()){render();loading=null}
   }
  })();
  return loading;
 }
 function render(){
  if(!allowed||allowed!==account())return;
  const show=Boolean(active||thankYou);
  // A completed poll hides its vote card, but the owner's compact Menu must persist.
  // It is tied to the server-visible poll audience, not to the ability to vote again.
  if(!show&&!publishedForAccount){unmountUi();return}
  if(!menuLayout(show))return;
  if(!show)return;
  const root=$('customerPollMenuV432'),badge=$('customerPollNavBadgeV432');
  root.hidden=false;root.replaceChildren();
  if(badge)badge.hidden=!active||thankYou;
  if(thankYou){
   const success=el('div','customer-poll-complete-v432');
   success.setAttribute('role','status');
   success.append(el('strong','',text('Ďakujeme za váš hlas!','Thank you for voting!')),
     el('p','',text('Váš záujem sme zaznamenali.','Your response has been recorded.')));
   const done=el('button','customer-poll-finish-v433',text('Hotovo','Done'));
   done.type='button';done.dataset.pollDone='true';
   root.append(success,done);return;
  }
  const h=el('h2','',active.title);h.id='customerPollMenuTitleV432';h.tabIndex=-1;
  const question=el('p','customer-poll-question-v432',active.question);
  const details=el('p','customer-poll-desc-v432',active.description);
  root.append(el('span','customer-poll-kicker-v432',text('Hlasovanie','Poll')),h,question,details);
  if(active.price_note)root.append(el('p','customer-poll-price-v433',active.price_note));
  const opts=el('div','customer-poll-options-v432');
  opts.setAttribute('role','group');opts.setAttribute('aria-label',active.question);
  choices.slice(0,10).forEach(row=>{
   const wrap=el('div','customer-poll-option-row-v434');
   const button=el('button','customer-poll-choice-v432'+(selection===row.id?' selected-v433':''),row.label);
   button.type='button';button.dataset.pollChoice=row.id;
   button.setAttribute('aria-pressed',String(selection===row.id));
   button.disabled=sending;
   wrap.append(button);
   if(selection===row.id&&row.asks_quantity){
    const qty=el('div','customer-poll-quantity-v433');
    const label=el('span','customer-poll-quantity-label-v434',text('O koľko kusov máte záujem?','How many copies?'));
    label.id='customerPollQuantityLabelV434';
    const stepper=el('div','customer-poll-stepper-v434');
    stepper.setAttribute('role','group');stepper.setAttribute('aria-labelledby',label.id);
    const count=Math.max(1,Math.min(999,Number(quantityValue)||1));
    const minus=el('button','customer-poll-quantity-minus-v434','−');
    minus.type='button';minus.dataset.pollMinus='true';minus.disabled=sending||count<=1;
    minus.setAttribute('aria-label',text('Znížiť počet kusov','Decrease quantity'));
    const value=el('output','customer-poll-quantity-value-v434',String(count));
    value.id='customerPollQuantityV433';value.setAttribute('aria-live','polite');
    const plus=el('button','customer-poll-quantity-plus-v434','+');
    plus.type='button';plus.dataset.pollPlus='true';plus.disabled=sending||count>=999;
    plus.setAttribute('aria-label',text('Zvýšiť počet kusov','Increase quantity'));
    stepper.append(minus,value,plus);
    const controls=el('div','customer-poll-quantity-controls-v434');controls.append(label,stepper);
    const send=el('button','customer-poll-submit-v433',sending?text('Ukladám…','Saving…'):text('Potvrdiť hlas','Confirm vote'));
    send.type='button';send.dataset.pollSubmit='true';send.disabled=sending;
    qty.append(controls,send);wrap.append(qty);
   }
   opts.append(wrap);
  });
  root.append(opts);
  if(error){
   const msg=el('p','customer-poll-error-v433',error);msg.setAttribute('role','alert');root.append(msg);
  }
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
  if(button.dataset.pollDone){thankYou=false;loaded='';render();void refresh(allowed,true);return}
  if(button.dataset.pollSubmit){void submit(selection);return}
  if(button.dataset.pollMinus||button.dataset.pollPlus){
   const count=Number(quantityValue)||1;
   quantityValue=String(Math.max(1,Math.min(999,count+(button.dataset.pollPlus?1:-1))));
   render();return;
  }
  if(button.dataset.pollChoice){
   const choice=choices.find(v=>v.id===button.dataset.pollChoice);
   if(!choice||sending)return;
   selection=choice.id;error='';
   if(choice.asks_quantity){quantityValue='1';render();return}
   void submit(choice.id);
  }
 }
 async function sync(){
  const id=account();
  if(!id||!state?.data){sequence++;clear();return}
  if(allowed===id){render();return}
  sequence++;clear();
  const marker=sequence;
  if(marker!==sequence||id!==account()||!state?.data)return;
  allowed=id;
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
