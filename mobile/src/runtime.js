import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { notificationQuery, callbackPath } from './policy.js';

if (Capacitor.isNativePlatform()) {
  const Updates = registerPlugin('ChvoUpdates');
  const base = 'https://tlhcqwsluyqpywymjoxn.supabase.co';
  const key = 'sb_publishable_43vD4AvQwchu1V2MwDbniA_j2tLiLi_';
  let host, token = '', registeredOwner = '', syncAt = 0, pending = null, toggleBusy = false;
  let updateAt = 0, updateBusy = null, registration = null;
  const report = () => window.ChvoTelemetry?.capture?.('operation.error', { operation: 'customer-operation', error: { name: 'Error' } });
  const setPush = on => { host?.setPush(on); return on; };
  async function endpoint(action, fcmToken = token, savedSession) {
    const session = savedSession || await host.ensureSession();
    const res = await fetch(base + '/functions/v1/customer-native-push', {
      method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token: fcmToken, platform: 'android' }), signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error('Upozornenia sa nepodarilo nastaviť. Skúste to neskôr.');
  }
  async function sync() {
    const session = host?.getSession();
    if (!token || !session) return false;
    const owner = session.user?.id;
    if (registeredOwner === owner && Date.now() - syncAt < 300000) return true;
    if (pending) { await pending; return registeredOwner === owner ? true : sync(); }
    pending = endpoint('subscribe').then(() => {
      if (host.getSession()?.user?.id !== owner) return false;
      registeredOwner = owner; syncAt = Date.now(); return true;
    }).finally(() => { pending = null; });
    return pending;
  }
  function register() {
    if (registration) return registration;
    registration = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { registration = null; reject(new Error('Registrácia upozornení trvá príliš dlho. Skúste znova.')); }, 15000);
      registrationDone = value => { clearTimeout(timer); registration = null; resolve(value); };
      registrationFailed = () => { clearTimeout(timer); registration = null; reject(new Error('Upozornenia sa nepodarilo zaregistrovať.')); };
      PushNotifications.register().catch(registrationFailed);
    });
    return registration;
  }
  let registrationDone = () => {}, registrationFailed = () => {};
  async function openCallback(url) {
    const route = callbackPath(url);
    if (!route) return false;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(route));
    const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (sessionStorage.getItem('chvo-native-callback') === fingerprint) return false;
    sessionStorage.setItem('chvo-native-callback', fingerprint);
    location.replace(route); return true;
  }
  let pendingNotification = null;
  const ready = Promise.all([
    PushNotifications.addListener('registration', value => { if(token!==value.value){registeredOwner='';syncAt=0;}token = value.value; registrationDone(token); }),
    PushNotifications.addListener('registrationError', () => { registrationFailed(); report(); }),
    PushNotifications.addListener('pushNotificationActionPerformed', action => {
      pendingNotification = notificationQuery(action?.notification?.data?.url);
      // Shared routing verifies account/conversation after login and onboarding.
      host?.openNotification?.();
      void host?.resume();
    }),
    App.addListener('appStateChange', ({ isActive }) => { if (isActive) void host?.resume(); else { host?.pause(); void host?.flush(); } }),
    App.addListener('appUrlOpen', ({ url }) => { void openCallback(url).catch(report); }),
    App.addListener('backButton', () => {
      const event = new CustomEvent('chvo-native-back', { cancelable: true });
      if (document.dispatchEvent(event)) void App.minimizeApp();
    })
  ]).catch(report);
  window.ChvoNative = {
    active: true,
    needsPushPrompt() {
      const owner = host?.getSession()?.user?.id;
      return !!owner && registeredOwner !== owner && localStorage.getItem('chvo-native-push-disabled') !== '1' && localStorage.getItem('chvo-native-push-prompt:' + owner) !== 'answered';
    },
    markPushPromptAnswered(owner) {
      if (owner && host?.getSession()?.user?.id === owner) localStorage.setItem('chvo-native-push-prompt:' + owner, 'answered');
    },
    takeNotification() { const value = pendingNotification; pendingNotification = null; return value; },
    attach(value) { host = value; },
    async prepareLaunch() {
      await ready;
      const launch = await App.getLaunchUrl().catch(() => null);
      return openCallback(launch?.url);
    },
    async ensurePush() {
      await ready;
      if (localStorage.getItem('chvo-native-push-disabled') === '1') return setPush(false);
      const permission = await PushNotifications.checkPermissions();
      if (permission.receive !== 'granted' || !host?.getSession()) return setPush(false);
      try { if (!token) await register(); return setPush(await sync()); }
      catch { report(); return setPush(false); }
    },
    async enablePush() {
      await ready;
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') throw new Error('Upozornenia nie sú povolené. Povoľte ich v nastaveniach telefónu.');
      await PushNotifications.createChannel({ id: 'chvostikovo', name: 'Rezervácie a oznamy', importance: 4, visibility: 0 });
      if (!token) await register();
      if (!await sync()) throw new Error('Najprv sa prihláste.');
      await host.completePushPrompt();
      localStorage.removeItem('chvo-native-push-disabled');
      return setPush(true);
    },
    async togglePush(button) {
      if (toggleBusy) return;
      toggleBusy = true; if (button) button.disabled = true;
      try {
        if (registeredOwner && localStorage.getItem('chvo-native-push-disabled') !== '1') {
          await endpoint('unsubscribe');
          registeredOwner = ''; syncAt = 0;
          localStorage.setItem('chvo-native-push-disabled', '1');
          await PushNotifications.unregister(); token = ''; setPush(false);
          host.notify('Upozornenia sú vypnuté.');
        } else { await this.enablePush(); host.notify('Upozornenia sú zapnuté.'); }
      } catch (error) { host.notify(error.message); report(); }
      finally { toggleBusy = false; if (button) button.disabled = false; }
    },
    async logout(session) {
      // Removing the FCM token also prevents delivery to the previous account.
      const old = token; token = ''; registeredOwner = ''; syncAt = 0;
      try { await PushNotifications.unregister(); } catch {}
      try { await pending; } catch {}
      if (old && session) try { await endpoint('unsubscribe', old, session); } catch {}
    },
    checkUpdate() {
      if (updateBusy) return updateBusy;
      if (Date.now() - updateAt < 300000 || document.visibilityState === 'hidden' || navigator.onLine === false) return;
      updateAt = Date.now();
      updateBusy = Updates.check().then(result => {
        if (!result.available || document.getElementById('chvo-native-update')) return;
        const card = document.createElement('div'); card.id = 'chvo-native-update'; card.className = 'info-box';
        card.append(document.createTextNode('Je dostupná nová verzia aplikácie. '));
        const button = document.createElement('button'); button.className = 'btn secondary'; button.textContent = 'Aktualizovať';
        button.onclick = async () => { button.disabled = true; try { await Updates.start(); } catch { host?.notify('Aktualizáciu otvorte v Google Play.'); } finally { button.disabled = false; } };
        card.append(button); document.getElementById('menuTab')?.prepend(card);
      }).catch(() => {}).finally(() => { updateBusy = null; });
      return updateBusy;
    }
  };
}
