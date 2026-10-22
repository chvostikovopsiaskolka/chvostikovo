// Installed inside the existing authenticated main scope.
try{window.ChvoTelemetry?.init({app:'admin',build:'20261022-opentelemetry-v348',base:SUPABASE_URL,key:SUPABASE_KEY,getToken:async()=>{const r=await supabase.auth.getSession();return r.data?.session?.access_token||''},isReady:()=>!document.getElementById('appBoot')||document.getElementById('appBoot').classList.contains('hidden'),getSurface:()=>{
 if(!document.getElementById('dogDetail')?.classList.contains('hidden'))return 'dog-details';
 if(!document.getElementById('menuSection')?.classList.contains('hidden'))return 'menu';
 if(!document.getElementById('weekSection')?.classList.contains('hidden'))return 'reservations';return 'overview';
}});}catch(_){}
function installTelemetryPanelV345(){
 const opener=document.getElementById('menuTelemetryV345');if(!opener)return;
 const modal=document.createElement('dialog');modal.id='telemetryPanelV345';modal.setAttribute('aria-labelledby','telemetryTitleV345');
 modal.innerHTML='<header><h2 id="telemetryTitleV345">Technický stav appiek</h2><button type="button" class="btn secondary" data-telemetry-close aria-label="Zavrieť">×</button></header><p class="muted small">Technické chyby za posledných 7 dní. Bez obsahu správ, formulárov či fotografií.</p><p class="muted small">Pri opakovanej závažnej chybe príde upozornenie. Najviac raz za hodinu; rovnaký problém najviac raz za deň.</p><button type="button" class="btn secondary" data-telemetry-refresh>Obnoviť</button><div data-telemetry-body aria-live="polite"></div>';
 document.body.append(modal);let generation=0;
 function close(){generation++;modal.close();modal.querySelector('[data-telemetry-body]').replaceChildren();}
 const el=(tag,text,cls)=>{const node=document.createElement(tag);node.textContent=text;if(cls)node.className=cls;return node;};
 async function load(){
  const gen=++generation,root=modal.querySelector('[data-telemetry-body]'),button=modal.querySelector('[data-telemetry-refresh]');button.disabled=true;root.replaceChildren(el('p','Načítavam technické záznamy…','muted'));
  try{const result=await supabase.rpc('portal_staff_telemetry_v345',{});if(result.error||!Array.isArray(result.data?.groups))throw new Error('telemetry unavailable');if(gen!==generation||!modal.open)return;
   root.replaceChildren(el('p',result.data.enabled?'Zber technických chýb je aktívny.':'Zber technických chýb je pozastavený.','small'));
   if(!result.data.groups.length)root.append(el('p','Za posledných 7 dní nie sú zachytené technické chyby.','empty'));
   for(const row of result.data.groups){const card=el('article','','card'),kind=({'javascript.error':'Chyba v aplikácii','promise.error':'Nedokončená operácia','request.error':'Zlyhaná požiadavka','request.slow':'Pomalá požiadavka','operation.error':'Zlyhaná operácia'})[row.category]||'Technický záznam';
    card.append(el('strong',(row.app==='admin'?'Admin':'Zákaznícka appka')+' · '+kind),el('p',row.operation+' · '+Number(row.occurrences)+'×','telemetry-operation-v345'),el('p',row.build+' · '+row.browser+' · '+row.platform,'muted small'));
    card.append(el('p',(row.source_file==='unknown'?'':row.source_file+':'+row.source_line+' · ')+row.exception_type+(row.http_status?' · HTTP '+row.http_status:'')+(row.max_duration_ms?' · '+(row.max_duration_ms/1000).toFixed(1)+' s':''),'small'));
    const date=new Date(row.last_seen);if(Number.isFinite(date.getTime()))card.append(el('p',date.toLocaleString('sk-SK',{timeZone:'Europe/Bratislava'}),'muted small'));root.append(card);
   }
  }catch(_){if(gen===generation)root.replaceChildren(el('p','Technické záznamy sa nepodarilo načítať. Skúste Obnoviť.','error'));}
  finally{if(gen===generation)button.disabled=false;}
 }
 opener.addEventListener('click',()=>{modal.showModal();void load();});
 modal.querySelector('[data-telemetry-close]').addEventListener('click',close);
 modal.querySelector('[data-telemetry-refresh]').addEventListener('click',()=>void load());
 modal.addEventListener('cancel',()=>{generation++;});modal.addEventListener('close',()=>{generation++;modal.querySelector('[data-telemetry-body]').replaceChildren();});
 supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||!session){close();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTelemetryPanelV345,{once:true});else installTelemetryPanelV345();
