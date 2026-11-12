/* Chvostikovo admin v424: additive UX controls; native admin handlers remain authoritative. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = (root, selector) => [...(root?.querySelectorAll(selector) || [])];
  const knownViews = new Set(['today', 'week', 'dogs', 'campaigns', 'menu']);
  const version = 'v424';
  let lastFocus = null;
  let frame = 0;

  function nativeTab(tab) {
    if (!knownViews.has(tab)) return false;
    const button = document.querySelector('#bottomNav [data-tab="' + tab + '"]');
    if (!button) return false;
    button.click();
    return true;
  }
  function menuModal(kind) {
    if (!nativeTab('menu')) return false;
    const button = document.querySelector('#menuSection [data-admin-modal-kind="' + kind + '"]');
    if (!button) return false;
    button.click();
    return true;
  }
  function openStats(view) {
    if (!nativeTab('menu')) return false;
    const button = $('menuStatsCardV1');
    if (!button) return false;
    button.click();
    if (view) setTimeout(() => {
      const head = $('adminStatsHeadV40');
      let tab = head?.querySelector('[data-v40-stats="' + view + '"]');
      if (!tab && view === 'attendance') {
        tab = all(head, 'button').find(b => /doch.dzk|hist.ri/i.test(b.textContent));
      }
      tab?.click();
    }, 90);
    return true;
  }
  const links = [
    ['today','Prehľad', () => nativeTab('today')],
    ['week','Týždeň', () => nativeTab('week')],
    ['dogs','Psíkovia', () => nativeTab('dogs')],
    ['owners','Majitelia psíkov', () => menuModal('registered')],
    ['pending-owners','Čakajúci majitelia', () => menuModal('owners')],
    ['attendance','Dochádzka', () => openStats('history')],
    ['visits','Štatistiky návštev', () => openStats('visits')],
    ['revenue','Tržby a permanentky', () => openStats('revenue')],
    ['campaigns','Kampane', () => nativeTab('campaigns')],
    ['settings','Nastavenia', () => {
      if (!nativeTab('menu')) return false;
      const target = $('menuSettingsCardV1') || $('menuAdminSettingsV1') || 
        all($('menuSection'), 'button').find(b => /nastavenia/i.test(b.textContent));
      if (target) target.click();
      return !!target;
    }],
    ['other','Ďalšie možnosti', () => nativeTab('menu')]
  ];
  function openDrawer() {
    const drawer = $('chvoDrawerV424'), button = $('chvoMenuToggleV424');
    if (!drawer || !button) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add('chvo-v424-drawer-open');
    button.setAttribute('aria-expanded', 'true');
    drawer.querySelector('[data-chvo-route]')?.focus();
  }
  function closeDrawer() {
    const drawer = $('chvoDrawerV424'), button = $('chvoMenuToggleV424');
    if (!drawer || !button) return;
    drawer.hidden = true;
    document.body.classList.remove('chvo-v424-drawer-open');
    button.setAttribute('aria-expanded', 'false');
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  function addDrawer() {
    const header = document.querySelector('#mainView .top');
    if (!header || $('chvoMenuToggleV424')) return;
    const button = document.createElement('button');
    button.id = 'chvoMenuToggleV424';
    button.type = 'button';
    button.className = 'chvo-v424-menu-toggle';
    button.setAttribute('aria-controls', 'chvoDrawerV424');
    button.setAttribute('aria-expanded', 'false');
    button.textContent = '☰  Menu';
    button.addEventListener('click', openDrawer);
    header.insertBefore(button, $('logoutBtn') || null);
    const drawer = document.createElement('div');
    drawer.id = 'chvoDrawerV424';
    drawer.hidden = true;
    drawer.innerHTML = '<div class="chvo-v424-scrim" data-chvo-close></div><aside class="chvo-v424-panel" role="dialog" aria-modal="true" aria-label="Navigácia administrácie"><div class="chvo-v424-panel-head"><strong>Chvostíkovo</strong><button type="button" data-chvo-close aria-label="Zavrieť menu">✕</button></div><nav class="chvo-v424-links" aria-label="Všetky moduly"></nav></aside>';
    const nav = drawer.querySelector('nav');
    for (const [key, title, callback] of links) {
      const link = document.createElement('button');
      link.type = 'button';
      link.dataset.chvoRoute = key;
      link.textContent = title;
      link.addEventListener('click', () => {
        closeDrawer();
        try { callback(); } catch (error) { console.error('Admin UX route', key, error); }
      });
      nav.append(link);
    }
    drawer.querySelectorAll('[data-chvo-close]').forEach(el => el.addEventListener('click', closeDrawer));
    document.body.append(drawer);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !drawer.hidden) { event.preventDefault(); closeDrawer(); }
      if (event.key !== 'Tab' || drawer.hidden) return;
      const focusable = all(drawer, 'button').filter(el => el.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  function countText(id) {
    const raw = ($(id)?.textContent || '').trim();
    const digits = raw.match(/\d+/);
    return digits ? Number(digits[0]) : null;
  }
  function makeAction(label, countId, callback) {
    const button = document.createElement('button');
    button.className = 'chvo-v424-action';
    button.type = 'button';
    const name = document.createElement('span');
    name.textContent = label;
    const count = document.createElement('strong');
    count.dataset.sourceCount = countId;
    count.textContent = '—';
    button.append(name, count);
    button.addEventListener('click', callback);
    return button;
  }
  function openTodayToggle(id) {
    nativeTab('today');
    const el = $(id);
    if (el) { el.click(); el.scrollIntoView({block:'nearest',behavior:'smooth'}); }
  }
  function addOverview() {
    const section = $('todaySection'), dashboard = $('adminDashboardV40');
    if (!section || !dashboard || $('chvoAttentionV424')) return;
    const area = document.createElement('section');
    area.id = 'chvoAttentionV424';
    area.className = 'chvo-v424-attention';
    area.setAttribute('aria-label', 'Prioritné úlohy');
    const title = document.createElement('h2');
    title.textContent = 'Čo treba vybaviť';
    area.append(title);
    const actions = document.createElement('div');
    actions.className = 'chvo-v424-action-grid';
    actions.append(
      makeAction('Čakajúce rezervácie','pendingBookingsOverviewCount',()=>openTodayToggle('pendingBookingsOverviewToggle')),
      makeAction('Správy','customerMessagesCount',()=>openTodayToggle('customerMessagesToggle')),
      makeAction('Záujemcovia','webLeadsCount',()=>openTodayToggle('webLeadsToggle')),
      makeAction('Upozornenia','careAlertsCount',()=>openTodayToggle('careAlertsToggleV55')),
      makeAction('Čakajúci majitelia','pendingCustomerAccountsCount',()=>menuModal('owners'))
    );
    area.append(actions);
    const quick = document.createElement('div');
    quick.className = 'chvo-v424-quick';
    const attendance = document.createElement('button');
    attendance.id = 'chvoAttendanceShortcutV424';
    attendance.type = 'button';
    attendance.textContent = 'Psíkovia dnes · príchody a odchody';
    attendance.addEventListener('click', () => menuModal('today'));
    const week = document.createElement('button');
    week.type = 'button';
    week.textContent = 'Otvoriť týždeň';
    week.addEventListener('click', () => nativeTab('week'));
    quick.append(attendance, week);
    area.append(quick);
    dashboard.before(area);
    function sync() {
      for (const target of all(actions, '[data-source-count]')) {
        const count = countText(target.dataset.sourceCount);
        target.textContent = count === null ? '—' : String(count);
        target.parentElement.classList.toggle('chvo-v424-needs-attention',count !== null && count > 0);
      }
    }
    sync();
    for (const el of ['pendingBookingsOverviewCount','customerMessagesCount','webLeadsCount','careAlertsCount','pendingCustomerAccountsCount'].map($).filter(Boolean)) {
      new MutationObserver(sync).observe(el,{childList:true,characterData:true,subtree:true});
    }
  }
  function scheduleWeeks() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const root of [$('weekList'),$('nextWeekList')]) syncWeek(root);
    });
  }
  function syncWeek(root) {
    if (!root) return;
    const cards = all(root, '[data-admin-day-card]');
    if (!cards.length) return;
    let picker = root.previousElementSibling;
    if (!picker?.classList.contains('chvo-v424-day-picker')) {
      picker = document.createElement('nav');
      picker.className = 'chvo-v424-day-picker';
      picker.setAttribute('aria-label',root.id === 'weekList' ? 'Dni tohto týždňa' : 'Dni nasledujúceho týždňa');
      root.before(picker);
    }
    let selected = root.dataset.chvoSelectedDayV424;
    if (!cards.some(c => c.dataset.adminDayCard === selected)) {
      const now = new Date();
      const localIso = [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
      selected = cards.some(c => c.dataset.adminDayCard === localIso) ? localIso : cards[0].dataset.adminDayCard;
    }
    root.dataset.chvoSelectedDayV424 = selected;
    picker.replaceChildren();
    for (const card of cards) {
      const iso = card.dataset.adminDayCard;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.day = iso;
      const nativeLabel = card.querySelector('.day-title strong')?.textContent?.trim() || iso;
      const count = card.querySelector('.day-head .pill')?.textContent?.trim() || '';
      const span = document.createElement('span');
      span.textContent = nativeLabel;
      const pill = document.createElement('small');
      pill.textContent = count;
      b.append(span,pill);
      b.classList.toggle('active',iso === selected);
      b.setAttribute('aria-pressed',String(iso === selected));
      b.addEventListener('click', () => {
        root.dataset.chvoSelectedDayV424 = iso;
        scheduleWeeks();
      });
      picker.append(b);
      card.classList.toggle('chvo-v424-day-hidden',iso !== selected);
    }
  }
  function addWeek() {
    const week = $('weekList'), next = $('nextWeekList');
    if (!week || !next) return;
    const summary = document.createElement('div');
    summary.id = 'chvoWeekSummaryV424';
    summary.className = 'chvo-v424-week-summary';
    summary.textContent = 'Týždenný prehľad z aktuálnych rezervácií';
    const title = $('weekSectionTitle') || week;
    title.before(summary);
    const updateSummary = () => {
      const cards = all(week,'[data-admin-day-card]');
      if (!cards.length) return;
      summary.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = 'Po–Pi · aktuálne rezervácie';
      summary.append(heading);
      for(const card of cards) {
        const label = card.querySelector('.day-title strong')?.textContent?.trim()?.split(',')[0] || card.dataset.adminDayCard;
        const badge = document.createElement('span');
        badge.textContent = label + ': ' + (card.querySelector('.day-head .pill')?.textContent?.trim() || '—');
        summary.append(badge);
      }
    };
    for (const root of [week,next]) {
      new MutationObserver(() => { scheduleWeeks(); if(root===week) updateSummary(); }).observe(root,{childList:true,subtree:false});
    }
    updateSummary();
    scheduleWeeks();
  }
  function start() {
    if (!$('mainView') || !$('bottomNav')) return;
    if (document.body.dataset.chvoUxVersion === version) return;
    document.body.dataset.chvoUxVersion = version;
    addDrawer();
    addOverview();
    addWeek();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
