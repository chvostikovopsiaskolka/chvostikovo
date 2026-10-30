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
  selectedId: null, error: '', ready: false
};
const logo = '<img src="https://bellaris-client-portal.pages.dev/assets/bellaris-logo-light-background.svg" alt="Bellaris" class="bm-logo" width="168" height="64">';
const message = (text) => text ? '<p class="bm-error" role="alert">' + escapeText(text) + '</p>' : '';
const humanDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('sk-SK', {day:'numeric',month:'short',year:'numeric'}).format(date);
};
const card = (value,label,details='') => '<div class="bm-kpi"><strong>' + value + '</strong><span>' + escapeText(label) + '</span><small>' + escapeText(details) + '</small></div>';
function frame(content, {login=false}={}) {
  const userControls = state.user ? '<button class="bm-mini" data-bm="refresh" type="button">Obnoviť</button><button class="bm-mini" data-bm="logout" type="button">Odhlásiť</button>' : '';
  state.root.innerHTML = '<div class="bm-shell"><header class="bm-header"><div class="bm-header-brand">' + logo +
    '<span>Interná administrácia</span></div><div class="bm-header-actions"><button class="bm-mini" data-bm="back" type="button" aria-label="Späť na výber">Výber</button>' +
    userControls + '</div></header>' +
    '<main class="bm-main">' + content + '</main>' +
    (!login && state.user ? '<nav class="bm-nav" aria-label="Bellaris sekcie">' +
      nav('overview','Prehľad') + nav('inquiries','Záujmy') + nav('projects','Projekty') + '</nav>' : '') +
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
    message(error) + '<button class="bm-primary" type="submit">Prihlásiť do Bellaris</button></form></section>', {login:true});
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
        card(sum.inquiries,'Záujmy','Mimo testovacích') +
        card(sum.activeProjects,'Aktívne projekty','Mimo testovacích') +
        card(sum.newInquiries + sum.reviewProjects,'Na kontrolu','Nové záujmy + projekty') +
      '</section>' +
      '<section class="bm-section"><div class="bm-heading"><h2>Posledné záujmy</h2><button data-bm="inquiries" type="button">Všetky</button></div>' +
      (state.inquiries.length ? state.inquiries.slice(0,5).map(inquiryRow).join('') : '<p class="bm-empty">Zatiaľ žiadne netestovacie záujmy.</p>') +
      '</section>' +
      '<section class="bm-section"><div class="bm-heading"><h2>Projekty</h2><button data-bm="projects" type="button">Všetky</button></div>' +
      (state.projects.length ? state.projects.slice(0,4).map(projectRow).join('') : '<p class="bm-empty">Zatiaľ žiadne netestovacie projekty.</p>') +
      '</section>' +
      '<section class="bm-section bm-coming"><h2>Návštevnosť webu</h2><p>GA4 a Search Console ešte nie sú prepojené s Bellaris adminom. Údaje nebudeme odhadovať.</p><span>Pripravujeme dátové napojenie</span></section>');
  } else if (state.view === 'inquiries') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">CRM</span><h1>Záujmy</h1>' +
      '<p>' + sum.inquiries + ' netestovacích záznamov · ' + sum.newInquiries + ' nových</p></div>' +
      '<section class="bm-section">' + (state.inquiries.length ?
        state.inquiries.map(inquiryRow).join('') : '<p class="bm-empty">Zatiaľ nič na spracovanie.</p>') + '</section>');
  } else if (state.view === 'projects') {
    frame('<div class="bm-intro"><span class="bm-eyebrow">REALIZÁCIE</span><h1>Projekty</h1>' +
      '<p>Stav a priebeh realizácie jednotlivých webov.</p></div><section class="bm-section">' +
      (state.projects.length ? state.projects.map(projectRow).join('') :
        '<p class="bm-empty">Zatiaľ žiadne projekty.</p>') + '</section>');
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
  if(window.BELLARIS_PORTAL_CONFIG?.publishableKey)return window.BELLARIS_PORTAL_CONFIG;
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
  if(['overview','inquiries','projects'].includes(action)){state.view=action;render();return;}
  if(action==='inquiry'||action==='project'){state.view=action;state.selectedId=button.dataset.id;render();}
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
    state.ready=true;
  }
  root.hidden=false;
  if(!state.client){
    renderBusy('Pripájam Bellaris…');
    try {
      const cfg=await loadPublicConfig();
      const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.57.0');
      state.client=createClient(cfg.supabaseUrl,cfg.publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,
          storageKey:'bellaris-mobile-admin-v1'}
      });
    }catch {
      state.user=null;
      renderLogin('Nepodarilo sa pripojiť Bellaris. Skontrolujte internetové pripojenie.');
      return;
    }
  }
  await refresh();
}
