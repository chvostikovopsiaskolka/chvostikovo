import { firebaseAccount, sendFcm } from './fcm.ts';
// Call only after the existing admin-push webhook has authenticated and built its message.
export async function dispatchNative(message: { audience?: string; recipientUserId?: string; title?: string; body?: string }, base: string, serviceKey: string) {
  if (message.audience !== 'customer' || !message.recipientUserId) return { sent: 0, removed: 0 };
  const account = firebaseAccount(); if (!account) return { sent: 0, removed: 0 };
  const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
  const result = await fetch(base + '/rest/v1/portal_native_push_devices?user_id=eq.' + encodeURIComponent(message.recipientUserId) + '&select=token', { headers, signal: AbortSignal.timeout(5000) });
  if (!result.ok) throw new Error('Native device lookup unavailable');
  const rows = await result.json(); let sent = 0, removed = 0;
  for (const row of rows) {
    try {
      const status = await sendFcm(account, row.token, message.title || 'Chvostíkovo – psia škôlka', message.body || '');
      if (status === 'sent') sent++;
      if (status === 'expired') {
        const deleted = await fetch(base + '/rest/v1/portal_native_push_devices?token=eq.' + encodeURIComponent(row.token), { method: 'DELETE', headers, signal: AbortSignal.timeout(5000) });
        if (deleted.ok) removed++;
      }
    } catch { console.error('Native push delivery failed'); }
  }
  return { sent, removed };
}
