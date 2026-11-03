/* Chvostíkovo EN login/onboarding pilot v408.
 * Presentation-only: no auth, API, profile, terms or checkout mutation.
 * Keep legally binding text and staff-written notices in their original language.
 */
(() => {
  'use strict';
  const STORAGE_KEY = 'chvostikovo-customer-locale-v408';
  const DICTIONARY = new Map([
  ["Späť na úvod","Back to welcome"],
  ["Späť","Back"],
  ["Bližšie k vášmu psíkovi","Closer to your dog"],
  ["Zákaznícky portál","Customer portal"],
  ["Permanentka, dochádzka, rezervácie aj oznamy. Všetko dôležité na jednom mieste.","Passes, attendance, bookings and announcements. Everything important in one place."],
  ["Prehľad funkcií","Features"],
  ["Permanentka","Pass"],
  ["Dochádzka","Attendance"],
  ["Oznamy","Announcements"],
  ["Vytvoriť účet","Create an account"],
  ["Už mám účet","I already have an account"],
  ["Prihlásenie","Sign in"],
  ["Prihlásiť sa","Sign in"],
  ["Obnova hesla","Reset password"],
  ["Nové heslo","New password"],
  ["E-mail","Email"],
  ["Heslo","Password"],
  ["Zapamätať prihlásenie","Remember me"],
  ["Zabudli ste heslo?","Forgot your password?"],
  ["Meno a priezvisko","Full name"],
  ["Telefón","Phone number"],
  ["Meno psíka","Dog's name"],
  ["Podľa mena ho priradíme k vášmu účtu.","We will link your dog to your account by name."],
  ["V prípade dvoch psíkov vyplňte mená oboch oddelené čiarkou (napr. Bella, Iris).","If you have two dogs, enter both names separated by a comma (e.g. Bella, Iris)."],
  ["Minimálne 8 znakov, malé a veľké písmeno a aspoň 1 číslica.","At least 8 characters, including upper- and lower-case letters and one digit."],
  ["E-mail k účtu","Account email"],
  ["Pošleme vám odkaz na vytvorenie nového hesla.","We will email you a password reset link."],
  ["Poslať odkaz na obnovu","Send reset link"],
  ["Späť na prihlásenie","Back to sign in"],
  ["Zopakujte nové heslo","Repeat your new password"],
  ["Uložiť nové heslo","Save new password"],
  ["Skúsiť znova","Try again"],
  ["Appku sa nepodarilo načítať","The app couldn't be loaded"],
  ["Prihlásenie zostalo zachované. Skontrolujte pripojenie alebo to skúste znova o chvíľu.","Your sign-in has been preserved. Check your connection or try again shortly."],
  ["Neplatné prihlasovacie údaje.","Invalid sign-in details."],
  ["Požiadavka sa nepodarila.","The request couldn't be completed."],
  ["Prístup k účtu je zablokovaný. Kontaktujte Chvostíkovo.","Your account is blocked. Please contact Chvostíkovo."],
  ["Zadajte e-mail.","Enter your email."],
  ["Zadajte heslo.","Enter your password."],
  ["E-mail bol odoslaný.","Email sent."],
  ["Skontrolujte e-mail.","Check your email."],
  ["Zmena hesla","Change password"],
  ["Otvoriť účet","Open account"]
  ]);
  const root = document.getElementById('authView');
  const controls = document.getElementById('customerLocaleSwitchV408');
  if (!root || !controls) return;
  const original = new WeakMap();
  const knownAttributes = new WeakMap();
  let lang = 'sk';
  try {
    const requested = new URL(location.href).searchParams.get('lang');
    lang = requested === 'en' || requested === 'sk' ? requested :
      localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'sk';
  } catch (_) { lang = 'sk'; }
  const bare = node => (node?.nodeValue || '').trim();
  function updateText(node) {
    if (node.nodeType !== 3 || !node.parentElement ||
      node.parentElement.closest('script,style,textarea,[contenteditable="true"]')) return;
    const current = bare(node);
    if (!current) return;
    let record = original.get(node);
    if (!record || (current !== record.sk && current !== record.en)) {
      const en = DICTIONARY.get(current);
      if (!en) return;
      record = {sk: current, en};
      original.set(node, record);
    }
    const next = lang === 'en' ? record.en : record.sk;
    if (current === next) return;
    const value = node.nodeValue;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    node.nodeValue = leading + next + trailing;
  }
  function updateAria() {
    for (const element of root.querySelectorAll('[aria-label]')) {
      const current = element.getAttribute('aria-label');
      let record = knownAttributes.get(element);
      if (!record || (current !== record.sk && current !== record.en)) {
        const en = DICTIONARY.get(current);
        if (!en) continue;
        record = {sk:current,en};
        knownAttributes.set(element, record);
      }
      const next = lang === 'en' ? record.en : record.sk;
      if (current !== next) element.setAttribute('aria-label',next);
    }
  }
  function apply() {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) updateText(node);
    updateAria();
    for (const btn of controls.querySelectorAll('button[data-customer-locale]')) {
      const active = btn.dataset.customerLocale === lang;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('active',active);
    }
    document.documentElement.lang = lang;
    const note = document.getElementById('customerLocaleNoteV408');
    if (note) {
      const message = lang === 'en' ?
        'English preview: legal documents and staff notices are still in Slovak.' :
        'Anglický náhľad: právne dokumenty a oznamy zatiaľ zostávajú po slovensky.';
      if (note.textContent !== message) note.textContent = message;
    }
  }
  let queued = false;
  const requestApply = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {queued = false;apply();});
  };
  controls.addEventListener('click',event => {
    const button = event.target.closest('button[data-customer-locale]');
    if (!button || !controls.contains(button)) return;
    const chosen = button.dataset.customerLocale;
    if (chosen !== 'sk' && chosen !== 'en') return;
    lang = chosen;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    apply();
  });
  const observer = new MutationObserver(requestApply);
  observer.observe(root, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-label']});
  window.ChvostikovoLocale = Object.freeze({
    getLanguage: () => lang,
    setLanguage: value => {
      if (value !== 'sk' && value !== 'en') return false;
      lang = value;
      try {localStorage.setItem(STORAGE_KEY,lang)} catch (_) {}
      apply();
      return true;
    }
  });
  apply();
})();
