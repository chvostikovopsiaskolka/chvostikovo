// Bellaris staff dashboard inside the existing Chvostikovo admin PWA.
// Public Bellaris config is loaded from the existing portal only after selection.
// Never share auth tokens, project data, service-role keys or session state with Chvostikovo.
const CONFIG_ORIGIN = 'https://bellaris-client-portal.pages.dev';
const EXPECTED_API = 'https://cycjpgjftbdcnrqisibw.supabase.co';
const projectStates = {
  brief: 'Zadanie', design: 'Dizajn', development: 'Vývoj',
  review: 'Kontrola', delivered: 'Odovzdané', paused: 'Pozastavené'
};
const inquiryStates = {
  new: 'Nový', received: 'Nový', reviewing: 'V riešení',
  contacted: 'Kontaktovaný', approved: 'Schválený', rejected: 'Zamietnutý',
  converted: 'Projekt vytvorený'
};
export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
export const getSummary = (inquiries, projects, milestones) => ({
  inquiries: inquiries.length,
  newInquiries: inquiries.filter(x => ['new','received'].includes(x.status)).length,
  activeProjects: projects.filter(x => !['delivered','paused'].includes(x.state)).length,
  reviewProjects: projects.filter(x => x.state === 'review').length,
  completedSteps: milestones.filter(x => x.completed).length,
});
export function projectProgress(projectId, milestones) {
  const steps = milestones.filter(x => x.project_id === projectId);
  const total = steps.reduce((n,x) => n + (Number(x.weight) || 0), 0);
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round(100 * steps.reduce(
    (n,x) => n + (x.completed ? (Number(x.weight) || 0) : 0), 0
  ) / total)));
}
const state = {
  root: null, onBack: null, client: null, user: null, busy: false,
  inquiries: [], projects: [], milestones: [], view: 'overview',
  selectedId: null, error: '', ready: false, traffic: [], trafficReady: false, range: 30, remember: false, expandedCta: null
};

function bellarisSessionStorage() {
  // Two separate key stores; only the explicitly opted-in admin retains a session
  // across app restarts. Passwords are never saved by our code.
  return {
    getItem(key) {
      try { return (state.remember ? localStorage : sessionStorage).getItem(key); }
      catch { return null; }
    },
    setItem(key,value) {
      try {
        if(state.remember) {
          localStorage.setItem('bellaris-admin-remember-v1','1');
          sessionStorage.removeItem(key);
          localStorage.setItem(key,value);
        } else {
          localStorage.removeItem('bellaris-admin-remember-v1');
          localStorage.removeItem(key);
          sessionStorage.setItem(key,value);
        }
      } catch { /* no persistent storage in private mode */ }
    },
    removeItem(key) {
      try {localStorage.removeItem(key); sessionStorage.removeItem(key);} catch {}
    }
  };
}

const logo = '<img src="https://bellaris-client-portal.pages.dev/assets/bellaris-logo-light-background.svg" alt="Bellaris" class="bm-logo" width="168" height="64">';
const message = (text) => text ? '<p class="bm-error" role="alert">' + escapeText(text) + '</p>' : '';
const humanDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('sk-SK', {day:'numeric',month:'short',year:'numeric'}).format(date);
};
const card = (value,label,details='') => '<div class="bm-kpi"><strong>' + value + '</strong><span>' + escapeText(label) + '</span><small>' + escapeText(details) + '</small></div>';
function frame(content, {login=false}={}) {
  state.root.innerHTML = '<div class="bm-shell"><header class="bm-header"><div class="bm-header-brand">' + logo +
    '</div></header>' +
    '<main class="bm-main">' + content + '</main>' +
    (!login && state.user ? '<nav class="bm-nav" aria-label="Bellaris sekcie">' +
      nav('overview','Prehľad') + nav('inquiries','Záujmy') + nav('projects','Projekty') + nav('traffic','Návštevnosť') + nav('menu','Menu') + '</nav>' : '') +
    '</div>';
}
function nav(view,label) {
  return '<button type="button" data-bm="' + view + '" class="' + (state.view === view ? 'active' : '') +
    '" aria-current="' + (state.view === view ? 'page':'false') + '">' + label + '</button>';
}
function renderLogin(error='') {
  state.user=null;
  frame('<section class="bm-login"><h1>Bellaris dashboard</h1>' +
    '<p>Prihláste sa svojím účtom správcu Bellaris. Klientske účty sem nemajú prístup.</p>' +
    '<form id="bellarisAdminLogin" class="bm-login-form">' +
    '<label>E-mail<input type="email" name="email" autocomplete="username" required placeholder="E-mail správcu"></label>' +
    '<label>Heslo<input type="password" name="password" autocomplete="current-password" required placeholder="Heslo"></label>' +
    '<label class="bm-remember"><input type="checkbox" name="remember" ' + (state.remember ? 'checked' : '') +
    '> Zapamätať prihlásenie na tomto zariadení</label>' +
    message(error) + '<button class="bm-primary" type="submit">Prihlásiť do Bellaris</button></form>' +
    '<button class="bm-login-back" data-bm="back" type="button">← Výber projektu</button></section>', {login:true});
}
function renderBusy(text='Načítavam prehľad…') {
  frame('<div class="bm-busy" role="status"><span class="bm-spinner" aria-hidden="true"></span><p>' + escapeText(text) + '</p></div>', {login:!state.user});
}
function inquiryRow(q) {
  return '<button type="button" class="bm-item" data-bm="inquiry" data-id="' + escapeText(q.id) +
    '"><span><strong>' + escapeText(q.name || 'Záujemca') + '</strong><small>' +
    escapeText(q.project_type || 'Neurčený projekt') + ' · ' + humanDate(q.created_at) +
    '</small></span><em>' + escapeText(inquiryStates[q.status] || q.status || '—') + '</em></button>';
}
function projectRow(p) {
  const progress = projectProgress(p.id,state.milestones);
  return '<button class="bm-project" type="button" data-bm="project" data-id="' + escapeText(p.id) +
    '"><span><strong>' + escapeText(p.name) + '</strong><small>' +
    escapeText(projectStates[p.state] || p.state || '—') + '</small></span>' +
    '<span class="bm-progress"><span style="width:' + progress + '%"></span></span><small>' +
    progress + ' % dokončené</small></button>';
}
function render() {
  if (!state.user) return renderLogin(state.error);
  const sum=getSummary(state.inquiries,state.projects,state.milestones);
  if (state.view === 'overview') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">BELLARIS · SPRÁVA</span><h1>Prehľad</h1>' +
      '<p>Záujmy a priebeh projektov na jednom mieste.</p></div>' +
      '<section class="bm-kpis" aria-label="Štatistiky">' +
        card(sum.inquiries,'Záujmy','Celkom') +
        card(sum.activeProjects,'Aktívne projekty','Rozpracované') +
        card(sum.newInquiries + sum.reviewProjects,'Na kontrolu','Nové záujmy + projekty') +
      '</section>' +
      '<section class="bm-section"><div class="bm-heading"><h2>Posledné záujmy</h2><button data-bm="inquiries" type="button">Všetky</button></div>' +
      (state.inquiries.length ? state.inquiries.slice(0,5).map(inquiryRow).join('') : '<p class="bm-empty">Zatiaľ žiadne záujmy.</p>') +
      '</section>' +
      '<section class="bm-section"><div class="bm-heading"><h2>Projekty</h2><button data-bm="projects" type="button">Všetky</button></div>' +
      (state.projects.length ? state.projects.slice(0,4).map(projectRow).join('') : '<p class="bm-empty">Zatiaľ žiadne projekty.</p>') +
      '</section>' +
      renderTrafficPreview());
  } else if (state.view === 'inquiries') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">CRM</span><h1>Záujmy</h1>' +
      '<p>' + sum.inquiries + ' záznamov · ' + sum.newInquiries + ' nových</p></div>' +
      '<section class="bm-section">' + (state.inquiries.length ?
        state.inquiries.map(inquiryRow).join('') : '<p class="bm-empty">Zatiaľ nič na spracovanie.</p>') + '</section>');
  } else if (state.view === 'projects') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">REALIZÁCIE</span><h1>Projekty</h1>' +
      '<p>Stav a priebeh realizácie jednotlivých webov.</p></div><section class="bm-section">' +
      (state.projects.length ? state.projects.map(projectRow).join('') :
        '<p class="bm-empty">Zatiaľ žiadne projekty.</p>') + '</section>');
  } else if (state.view === 'traffic') {
    frame(renderTrafficFull());
  } else if (state.view === 'menu') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">NASTAVENIA</span><h1>Menu</h1>' +
      '<p>Ovládanie pracovného priestoru Bellaris.</p></div><section class="bm-section bm-menu">' +
      '<button type="button" data-bm="refresh">Obnoviť údaje <span aria-hidden="true">↻</span></button>' +
      '<button type="button" data-bm="back">Výber projektu <span aria-hidden="true">›</span></button>' +
      '<button type="button" data-bm="logout">Odhlásiť Bellaris <span aria-hidden="true">↪</span></button>' +
      '</section>');
  } else if (state.view === 'inquiry') {
    const q=state.inquiries.find(x=>x.id===state.selectedId);
    if(!q){state.view='inquiries';return render();}
    frame('<button class="bm-subback" type="button" data-bm="inquiries">← Všetky záujmy</button>' +
      '<section class="bm-section bm-detail"><span class="bm-eyebrow">ZÁUJEM</span><h1>' + escapeText(q.name || 'Záujemca') + '</h1>' +
      '<p><strong>Stav:</strong> ' + escapeText(inquiryStates[q.status] || q.status || '—') + '</p>' +
      '<p><strong>Typ:</strong> ' + escapeText(q.project_type || '—') + '</p>' +
      '<p><strong>Dátum:</strong> ' + humanDate(q.created_at) + '</p>' +
      '<h2>Správa</h2><p class="bm-detail-text">' + escapeText(q.message || 'Bez správy') + '</p>' +
      '<h2>Interná poznámka</h2><p class="bm-detail-text">' + escapeText(q.internal_note || 'Bez poznámky') + '</p>' +
      '<p class="bm-muted">Zatiaľ iba čítanie. Stav a schvaľovanie zostávajú v pôvodnom CRM.</p></section>');
  } else if (state.view === 'project') {
    const p=state.projects.find(x=>x.id===state.selectedId);
    if(!p){state.view='projects';return render();}
    const ms=state.milestones.filter(x=>x.project_id===p.id).sort((a,b)=>(a.position||0)-(b.position||0));
    frame('<button class="bm-subback" type="button" data-bm="projects">← Všetky projekty</button>' +
      '<section class="bm-section bm-detail"><span class="bm-eyebrow">PROJEKT</span><h1>' + escapeText(p.name) + '</h1>' +
      '<p><strong>Stav:</strong> ' + escapeText(projectStates[p.state] || p.state) + '</p>' +
      '<p><strong>Postup:</strong> ' + projectProgress(p.id,state.milestones) + ' %</p>' +
      '<h2>Míľniky</h2>' + (ms.length ? ms.map(m=>'<div class="bm-step"><span aria-hidden="true">' +
        (m.completed?'✓':'○') + '</span>' + escapeText(m.title) + '</div>').join('') :
        '<p class="bm-empty">Zatiaľ nie sú míľniky.</p>') +
      '<p class="bm-muted">Správa míľnikov, potvrdení a projektových poznámok bude doplnená samostatne.</p></section>');
  }
}

const trafficLabels = {direct:'Priame / neznáme',google:'Google',social:'Sociálne siete',
  paid:'Reklama',referral:'Odkazy',ai:'AI vyhľadávanie',other:'Ostatné'};
const numeric = n => Number.isFinite(Number(n)) ? Math.max(0,Number(n)) : 0;
export function trafficSummary(rows, days=30) {
  const today=new Date();
  const start=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-days+1));
  const selected=rows.filter(x=>new Date(String(x.day)+'T00:00:00Z')>=start);
  const total=selected.filter(x=>x.event_type==='page_view').reduce((v,x)=>v+numeric(x.total),0);
  const ctas=selected.filter(x=>x.event_type==='cta_click').reduce((v,x)=>v+numeric(x.total),0);
  const forms=selected.filter(x=>x.event_type==='lead_submit').reduce((v,x)=>v+numeric(x.total),0);
  const byPage=new Map(),bySource=new Map(),byDay=new Map(),byCta=new Map();
  const byCtaOrigin=new Map();
  for(const x of selected.filter(x=>x.event_type==='cta_click')) {
    const key=x.event_label||'iné';
    const amount=numeric(x.total);
    byCta.set(key,(byCta.get(key)||0)+amount);
    // Page and source are stored as grouped first-party event dimensions.
    // There is no UTM in this daily schema, so do not claim campaign-level attribution.
    const channel=String(x.source_channel||'direct').slice(0,80);
    const detailKey=JSON.stringify([key,x.path||'/',channel]);
    byCtaOrigin.set(detailKey,(byCtaOrigin.get(detailKey)||0)+amount);
  }
  for(const x of selected.filter(x=>x.event_type==='page_view')) {
    const n=numeric(x.total);
    byPage.set(x.path,(byPage.get(x.path)||0)+n);
    const key=trafficLabels[x.source_channel] ? x.source_channel : 'other';
    bySource.set(key,(bySource.get(key)||0)+n);
    byDay.set(x.day,(byDay.get(x.day)||0)+n);
  }
  return {total,ctas,forms,byPage:[...byPage].sort((a,b)=>b[1]-a[1]),
    bySource:[...bySource].sort((a,b)=>b[1]-a[1]),
    byCta:[...byCta].sort((a,b)=>b[1]-a[1]),
    byCtaOrigin:[...byCtaOrigin].map(([key,total])=>{const [label,path,channel]=JSON.parse(key);return {label,path,channel,total};}).sort((a,b)=>b.total-a.total),
    byDay:[...byDay].sort((a,b)=>a[0].localeCompare(b[0]))};
}
function lineChart(points) {
  const max=Math.max(1,...points.map(x=>x[1]));
  const width=460,height=185,pad=18;
  const xy=points.map(([_,n],i)=>[
    points.length===1 ? width/2:pad+(width-2*pad)*i/(points.length-1),
    height-pad-(height-2*pad)*n/max
  ]);
  const poly=xy.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1)).join(' ');
  return '<svg class="bm-chart" viewBox="0 0 460 185" role="img" aria-label="Vývoj zobrazení stránok za obdobie">' +
    '<line x1="18" y1="167" x2="442" y2="167" stroke="#dfe8ed"/>' +
    '<line x1="18" y1="92" x2="442" y2="92" stroke="#ecf0f2"/>' +
    (poly?'<polyline points="'+poly+'" fill="none" stroke="#ec985b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>':'')+
    xy.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3.2" stroke="#ec985b" stroke-width="2.2" fill="white"/>').join('')+
    '</svg>';
}
function trafficRows(items,type,maxEntries=6){
  const max=Math.max(1,...items.map(x=>x[1]));
  if(!items.length)return '<p class="bm-empty">Zatiaľ nie sú namerané údaje.</p>';
  return items.slice(0,maxEntries).map(([key,n])=>
    '<div class="bm-traffic-row"><div><span>'+escapeText(type==='source'?(trafficLabels[key]||key):(key==='/'?'Domov':key))+
    '</span><strong>'+n.toLocaleString('sk-SK')+'</strong></div><span class="bm-traffic-bar"><span style="width:'+
    Math.min(100,Math.round(n/max*100))+'%"></span></span></div>').join('');
}
function trafficCtaDetails(data) {
  if(!data.byCta.length)return '<p class="bm-empty">Zatiaľ nie sú namerané kliknutia na tlačidlá.</p>';
  const max=Math.max(1,...data.byCta.map(x=>x[1]));
  return data.byCta.slice(0,10).map(([label,count])=>{
    const expanded=state.expandedCta===label;
    const breakdown=data.byCtaOrigin.filter(x=>x.label===label);
    const rows=breakdown.map(x=>'<div class="bm-cta-source"><span><strong>'+escapeText(trafficLabels[x.channel]||x.channel)+'</strong><small>'+escapeText(x.path||'/')+'</small></span><b>'+x.total.toLocaleString('sk-SK')+'</b></div>').join('');
    return '<article class="bm-cta-item"><button type="button" class="bm-cta-toggle" data-bm="cta-detail" data-label="'+escapeText(encodeURIComponent(label))+'" aria-expanded="'+expanded+'"><span><strong>'+escapeText(label)+'</strong><small>Rozkliknúť pôvod kliknutí</small></span><b>'+count.toLocaleString('sk-SK')+' '+(expanded?'⌃':'⌄')+'</b></button>'+
      '<span class="bm-traffic-bar"><span style="width:'+Math.min(100,Math.round(count/max*100))+'%"></span></span>'+
      (expanded?'<div class="bm-cta-details"><strong>Odkiaľ prišli kliknutia</strong>'+rows+
        '<p class="bm-traffic-intro">Zdroje podľa dostupnej atribúcie pri kliku a podstránky. Ide o udalosti, nie unikátne osoby. Detail kampane/UTM zatiaľ táto denná evidencia neobsahuje.</p></div>':'')+'</article>';
  }).join('');
}
function renderTrafficPreview() {
  const data=trafficSummary(state.traffic,30);
  return '<section class="bm-section"><div class="bm-heading"><h2>Návštevnosť webu</h2>'+
    '<button type="button" data-bm="traffic">Podrobnosti</button></div>' +
    (!state.trafficReady?'<p class="bm-empty">Interné meranie sa pripravuje. Žiadne čísla neodhadujeme.</p>':
      '<p class="bm-traffic-intro">Posledných 30 dní · anonymné zobrazenia stránok</p>' +
      '<div class="bm-traffic-kpis">'+card(data.total.toLocaleString('sk-SK'),'Zobrazenia stránok')+
      card(data.ctas.toLocaleString('sk-SK'),'Kliknutia na CTA')+'</div>')+
    '</section>';
}
function renderTrafficFull() {
  const data=trafficSummary(state.traffic,state.range);
  return '<div class="bm-intro"><span class="bm-eyebrow">BELLARIS · WEB</span>'+
    '<h1>Návštevnosť</h1><p>Vlastné anonymné meranie bez cookies a identifikátorov. Počítame udalosti, nie unikátnych ľudí.</p></div>' +
    '<section class="bm-traffic-kpis">'+card(data.total.toLocaleString('sk-SK'),'Zobrazenia stránok')+
      card(data.ctas.toLocaleString('sk-SK'),'Kliknutia na CTA')+
      card(data.forms.toLocaleString('sk-SK'),'Odoslané záujmy','Iba po potvrdení webu')+
    '</section><section class="bm-section"><div class="bm-heading"><h2>Návštevnosť po dňoch</h2>'+
    '<select class="bm-range" id="bmRange" aria-label="Obdobie"><option value="7" '+
    (state.range===7?'selected':'')+'>7 dní</option><option value="30" '+
    (state.range===30?'selected':'')+'>30 dní</option></select></div>'+
    (data.total ? lineChart(data.byDay):'<p class="bm-empty">Za zvolené obdobie zatiaľ nemáme merania.</p>')+'</section>'+
    '<section class="bm-section"><h2>Stránky</h2>'+trafficRows(data.byPage,'path')+'</section>'+
    '<section class="bm-section"><h2>Kliknutia na tlačidlá</h2>'+trafficCtaDetails(data)+'</section>'+ 
    '<section class="bm-section"><h2>Odkiaľ prichádzajú</h2><p class="bm-traffic-intro">Zdroj podľa UTM alebo domény odkazu, nie osobná identifikácia.</p>'+
    trafficRows(data.bySource,'source')+'</section>'+
    '<section class="bm-section bm-coming"><h2>Google Search Console a GA4</h2>'+
    '<p>Nepovinné doplnkové reporty. Interné meranie funguje samostatne.</p></section>';
}

async function refresh() {
  if(state.busy)return;
  state.busy=true;
  renderBusy();
  try {
    const {data:{user},error:userError}=await state.client.auth.getUser();
    if(userError || !user){renderLogin();return;}
    // Server-side RLS gates all data. This explicit staff check also blocks the admin UI.
    const staff=await state.client.from('bp_staff').select('user_id').eq('user_id',user.id).maybeSingle();
    if(staff.error)throw staff.error;
    if(!staff.data){state.user=null;renderLogin('Tento účet nemá oprávnenie správcu Bellaris.');return;}
    state.user=user;
    const [inquiries,projects]=await Promise.all([
      state.client.from('bp_inquiries')
        .select('id,created_at,name,project_type,message,status,internal_note,is_test')
        .eq('is_test',false).order('created_at',{ascending:false}).limit(150),
      state.client.from('bp_projects')
        .select('id,name,state,is_test,created_at').eq('is_test',false)
        .order('created_at',{ascending:false}).limit(100)
    ]);
    if(inquiries.error)throw inquiries.error;
    if(projects.error)throw projects.error;
    const ids=(projects.data||[]).map(p=>p.id);
    let milestones=[];
    if(ids.length){
      const steps=await state.client.from('bp_milestones').select('id,project_id,title,position,weight,completed').in('project_id',ids).limit(500);
      if(steps.error)throw steps.error;
      milestones=steps.data||[];
    }
    state.inquiries=inquiries.data||[];
    state.projects=projects.data||[];
    state.milestones=milestones;
    // Missing analytics module must never break the working CRM.
    try {
      const after=new Date(Date.now()-31*864e5).toISOString().slice(0,10);
      const t=await state.client.from('bp_web_traffic_daily')
        .select('day,path,source_channel,event_type,event_label,total').gte('day',after).limit(5000);
      state.traffic=t.error?[]:(t.data||[]);
      state.trafficReady=!t.error;
    } catch {state.traffic=[];state.trafficReady=false;}
    state.error='';
    render();
  }catch(err){
    // Avoid displaying private API error responses or credentials in the UI.
    state.error='Načítanie Bellaris sa nepodarilo. Skontrolujte pripojenie a skúste obnoviť.';
    if(state.user) frame('<section class="bm-section">'+message(state.error)+
      '<button class="bm-primary" type="button" data-bm="refresh">Skúsiť znova</button></section>');
    else renderLogin(state.error);
  }finally{state.busy=false;}
}
async function loadPublicConfig() {
  // Always validate the Bellaris project reference, even if a config already exists.
  if (window.BELLARIS_PORTAL_CONFIG?.publishableKey) {
    const existing=window.BELLARIS_PORTAL_CONFIG;
    if (existing.supabaseUrl === EXPECTED_API &&
        (existing.publishableKey.startsWith('sb_publishable_') || existing.publishableKey.startsWith('eyJ')))
      return existing;
    throw new Error('Invalid Bellaris public configuration');
  }
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=CONFIG_ORIGIN+'/config.js';
    script.async=true;
    script.onload=resolve;
    script.onerror=()=>reject(new Error('Bellaris config unavailable'));
    document.head.appendChild(script);
  });
  const cfg=window.BELLARIS_PORTAL_CONFIG||{};
  // The public configuration is shared by the existing Bellaris portal; no keys copied into Chvostikovo.
  if(cfg.supabaseUrl !== EXPECTED_API || !cfg.publishableKey ||
    !(cfg.publishableKey.startsWith('sb_publishable_') || cfg.publishableKey.startsWith('eyJ')))
    throw new Error('Invalid Bellaris public configuration');
  return cfg;
}
async function handleClick(event) {
  const button=event.target.closest('button[data-bm]');
  if(!button || state.busy)return;
  const action=button.dataset.bm;
  if(action==='back'){state.onBack();return;}
  if(action==='logout'){state.busy=true;try{await state.client.auth.signOut();state.user=null;state.view='overview';renderLogin();}finally{state.busy=false;}return;}
  if(action==='refresh'){await refresh();return;}
  if(['overview','inquiries','projects','traffic','menu'].includes(action)){state.view=action;render();return;}
  if(action==='cta-detail'&&state.view==='traffic'){
    let label='';
    try {label=decodeURIComponent(button.dataset.label||'');} catch {return;}
    const current=trafficSummary(state.traffic,state.range);
    if(!current.byCta.some(item=>item[0]===label))return;
    state.expandedCta=state.expandedCta===label?null:label;
    render();return;
  }
  if(action==='inquiry'||action==='project'){state.view=action;state.selectedId=button.dataset.id;render();}
}
function handleChange(event) {
  if(event.target?.id==='bmRange'){
    const next=Number(event.target.value);
    state.range=next===7?7:30;
    state.expandedCta=null;
    render();
  }
}
async function handleSubmit(event) {
  if(event.target.id!=='bellarisAdminLogin')return;
  event.preventDefault();
  if(state.busy)return;
  state.busy=true;
  const button=event.target.querySelector('button[type=submit]');
  button.disabled=true;
  const form=new FormData(event.target);
  const email=String(form.get('email')||'').trim();
  const password=String(form.get('password')||'');
  state.remember=form.get('remember')==='on';
  try {
    const {error}=await state.client.auth.signInWithPassword({email,password});
    if(error){renderLogin('Nesprávne prihlasovacie údaje alebo účet nie je aktivovaný.');return;}
  }catch {
    renderLogin('Prihlásenie sa nepodarilo. Skúste to znova.');
    return;
  }finally{state.busy=false;}
  await refresh();
}
export async function openBellarisMobile(root,onBack) {
  state.root=root;state.onBack=onBack;state.view='overview';
  if(!state.ready) {
    root.addEventListener('click',ev=>void handleClick(ev));
    root.addEventListener('submit',ev=>void handleSubmit(ev));
    root.addEventListener('change',handleChange);
    state.ready=true;
  }
  root.hidden=false;
  if(!state.client){
    try { state.remember=localStorage.getItem('bellaris-admin-remember-v1')==='1'; } catch {}
    renderBusy('Pripájam Bellaris…');
    try {
      const cfg=await loadPublicConfig();
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
      state.client=createClient(cfg.supabaseUrl,cfg.publishableKey,{
        // Never persist a Bellaris access token on Chvostikovo's origin.
        // RLS protects server-side data; a separate Bellaris login is required on PWA restart.
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
          storageKey:'bellaris-staff-session-v1',
          storage:bellarisSessionStorage()}
      });
    }catch {
      state.user=null;
      renderLogin('Nepodarilo sa pripojiť Bellaris. Skontrolujte internetové pripojenie.');
      return;
    }
  }
  await refresh();
}
