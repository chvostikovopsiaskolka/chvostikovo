const translations = {
  sk: {
    title: 'Nová verzia Chvostíkova',
    body: 'V Google Play je dostupná nová verzia aplikácie. Aktualizujte ju a získajte najnovšie vylepšenia.',
    update: 'Aktualizovať v Google Play',
    later: 'Pripomenúť neskôr',
    error: 'Google Play sa nepodarilo otvoriť. Skúste to znova.'
  },
  en: {
    title: 'New Chvostíkovo version',
    body: 'A new app version is available on Google Play. Update to get the latest improvements.',
    update: 'Update in Google Play',
    later: 'Remind me later',
    error: 'Could not open Google Play. Please try again.'
  }
};

const css = `
#chvo-native-update {position:fixed;inset:0;z-index:30000;background:rgba(24,29,40,.64);display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 16px) 18px calc(env(safe-area-inset-bottom,0px) + 16px);box-sizing:border-box;overscroll-behavior:contain}
#chvo-native-update .chvo-update-panel {box-sizing:border-box;width:min(100%,400px);max-height:calc(100dvh - 32px);overflow:auto;border-radius:26px;background:#fff;padding:30px 24px 24px;box-shadow:0 22px 70px rgba(9,18,32,.25);text-align:center;color:#19202e}
#chvo-native-update .chvo-update-symbol {width:62px;height:62px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#fff0e4;color:#f57015;font-size:30px;font-weight:700;line-height:1}
#chvo-native-update .chvo-update-title {font-size:25px;line-height:1.16;font-weight:850;margin:0 0 12px;color:#19202e}
#chvo-native-update .chvo-update-body {font-size:15px;line-height:1.52;margin:0 0 24px;color:#586071}
#chvo-native-update .chvo-update-action {display:block;box-sizing:border-box;width:100%;min-height:52px;padding:13px 12px;border-radius:15px;font-size:16px;font-weight:750;cursor:pointer;-webkit-tap-highlight-color:transparent}
#chvo-native-update .chvo-update-primary {background:#f97316;border:2px solid #f97316;color:white}
#chvo-native-update .chvo-update-secondary {background:transparent;border:2px solid transparent;color:#4b5563;margin-top:6px}
#chvo-native-update .chvo-update-action:focus-visible {outline:3px solid #b95004;outline-offset:3px}
#chvo-native-update .chvo-update-action:disabled {opacity:.6}
#chvo-native-update .chvo-update-error {margin:14px 0 0;font-size:13px;line-height:1.4;color:#b42318}
#chvo-native-update .chvo-update-error[hidden] {display:none}
@media(max-width:360px){#chvo-native-update .chvo-update-panel {padding:25px 17px 19px}#chvo-native-update .chvo-update-title {font-size:22px}}
`;

export function showPlayUpdateDialog({ language = 'sk', onUpdate, onLater }, doc = document) {
  if (doc.getElementById('chvo-native-update')) return null;
  const t = translations[language === 'en' ? 'en' : 'sk'];
  const currentFocus = doc.activeElement;
  if (!doc.getElementById('chvo-native-update-style')) {
    const style = doc.createElement('style');
    style.id = 'chvo-native-update-style';
    style.textContent = css;
    doc.head.append(style);
  }
  const create = (tag, className, value) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  };
  const overlay = create('div');
  overlay.id = 'chvo-native-update';
  const panel = create('section', 'chvo-update-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'chvo-update-title');
  panel.setAttribute('aria-describedby', 'chvo-update-body');
  const symbol = create('div', 'chvo-update-symbol', '↻');
  symbol.setAttribute('aria-hidden', 'true');
  const title = create('h2', 'chvo-update-title', t.title);
  title.id = 'chvo-update-title';
  const description = create('p', 'chvo-update-body', t.body);
  description.id = 'chvo-update-body';
  const update = create('button', 'chvo-update-action chvo-update-primary', t.update);
  update.type = 'button';
  const later = create('button', 'chvo-update-action chvo-update-secondary', t.later);
  later.type = 'button';
  const error = create('p', 'chvo-update-error', t.error);
  error.hidden = true;
  panel.append(symbol, title, description, update, later, error);
  overlay.append(panel);
  const close = () => {
    overlay.remove();
    try { if (currentFocus?.isConnected) currentFocus.focus({ preventScroll: true }); } catch (_) {}
  };
  later.addEventListener('click', () => { onLater(); close(); });
  update.addEventListener('click', async () => {
    update.disabled = true;
    error.hidden = true;
    try { await onUpdate(); close(); }
    catch (_) { error.hidden = false; }
    finally { update.disabled = false; }
  });
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); later.click(); }
    if (event.key !== 'Tab') return;
    if (event.shiftKey && doc.activeElement === update) { event.preventDefault(); later.focus(); }
    else if (!event.shiftKey && doc.activeElement === later) { event.preventDefault(); update.focus(); }
  });
  doc.body.append(overlay);
  update.focus({ preventScroll: true });
  return { overlay, close };
}
