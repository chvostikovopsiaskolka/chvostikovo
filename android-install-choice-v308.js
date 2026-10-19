/* Android-only install-guide enhancement. Does not change iOS or install APIs. */
(() => {
  'use strict';
  const ua = navigator.userAgent || '';
  if (!/Android/i.test(ua) || window.matchMedia?.('(display-mode: standalone)').matches) return;
  const browserIsChrome = /Chrome\/[\d.]+/i.test(ua) &&
    !/(SamsungBrowser|EdgA|OPR|Opera|Firefox|FxiOS|MiuiBrowser|HuaweiBrowser|UCBrowser|DuckDuckGo|Vivaldi|FBAN|FBAV|Instagram|GSA)/i.test(ua);
  const installHint = 'Kliknite na <strong>Nainštalovať aplikáciu</strong>. Potom potvrďte <strong>Inštalovať</strong> alebo <strong>Pridať na plochu</strong> (podľa prehliadača).';
  let initialized = false;
  let guide = null;
  function normalizeIntro() {
    if (!guide || guide.dataset.installStartedV308 === '1') return;
    const steps = guide.querySelector('.install-steps');
    const content = steps?.textContent || '';
    if (!steps || !/Android môže aplikáciu|Keď prehliadač ponúkne inštaláciu|Otvorte tento odkaz v Chrome/i.test(content)) return;
    steps.innerHTML = '<div class="install-step"><span>' + installHint + '</span></div>';
  }
  function attach() {
    guide = document.getElementById('installGuideModal');
    if (!guide || initialized) return !!guide;
    initialized = true;
    const card = guide.querySelector('.install-guide-card');
    const steps = guide.querySelector('.install-steps');
    const native = document.getElementById('installGuideInstallBtn');
    if (!card || !steps || !native) return true;
    const style = document.createElement('style');
    style.textContent = `
      #installGuideModal.android-browser-choice-v308 .install-steps,
      #installGuideModal.android-browser-choice-v308 #installGuideInstallBtn {display:none!important}
      #installGuideModal:not(.android-browser-choice-v308) .android-install-choices-v308 {display:none!important}
      .android-install-choices-v308{display:grid;gap:10px;margin:2px 0 16px}
      .android-install-choices-v308 p{margin:0 0 2px;font-size:14px;line-height:1.45}
      .android-install-choices-v308 a,.android-install-choices-v308 button{box-sizing:border-box;min-height:48px;display:flex;align-items:center;justify-content:center;text-align:center;width:100%;text-decoration:none;cursor:pointer}
      .android-install-choices-v308 small{font-size:12px;line-height:1.4;color:#6b7280}
    `;
    document.head.appendChild(style);
    if (!browserIsChrome) {
      const choices = document.createElement('div');
      choices.className = 'android-install-choices-v308';
      choices.innerHTML = '<p>Na inštaláciu Chvostíkova odporúčame Google Chrome. Vyberte, v ktorom prehliadači chcete pokračovať.</p>';
      const chrome = document.createElement('a');
      chrome.className = 'btn full';
      chrome.textContent = 'Otvoriť v Chrome';
      chrome.href = 'intent://app.chvostikovo.sk/#Intent;scheme=https;package=com.android.chrome;end';
      const current = document.createElement('button');
      current.type = 'button';
      current.className = 'btn secondary full';
      current.textContent = 'Pokračovať v tomto prehliadači';
      current.addEventListener('click', () => {
        guide.classList.remove('android-browser-choice-v308');
        normalizeIntro();
        if (native.classList.contains('hidden')) {
          steps.innerHTML = '<div class="install-step"><span>V menu aktuálneho prehliadača vyberte <strong>Inštalovať aplikáciu</strong> alebo <strong>Pridať na plochu</strong>.</span></div>';
        }
      });
      const hint = document.createElement('small');
      hint.textContent = 'Ak sa Chrome neotvorí alebo ho nemáte nainštalovaný, môžete zvoliť druhú možnosť.';
      choices.append(chrome, current, hint);
      steps.parentElement.insertBefore(choices, steps);
      guide.classList.add('android-browser-choice-v308');
    }
    native.addEventListener('click', () => { guide.dataset.installStartedV308 = '1'; });
    window.addEventListener('appinstalled', () => guide.classList.remove('android-browser-choice-v308'));
    normalizeIntro();
    return true;
  }
  window.addEventListener('beforeinstallprompt', () => queueMicrotask(() => { if (attach()) normalizeIntro(); }));
  if (!attach()) {
    const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
    observer.observe(document.body, {childList: true});
  }
})();
