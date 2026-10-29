// Server-only. FIREBASE_SERVICE_ACCOUNT_JSON must never enter the mobile bundle.
type Account = { project_id: string; client_email: string; private_key: string };
let bearer = '', expires = 0, inflight: Promise<string> | null = null;
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const encoded = (value: unknown) => b64(new TextEncoder().encode(JSON.stringify(value)));
async function access(account: Account): Promise<string> {
  if (bearer && Date.now() < expires) return bearer;
  if (inflight) return inflight;
  inflight = (async () => {
    const now = Math.floor(Date.now() / 1000);
    const content = encoded({ alg: 'RS256', typ: 'JWT' }) + '.' + encoded({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const pem = account.private_key.replace(/-----[^-]+-----|\s/g, '');
    const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(content)));
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: content + '.' + b64(signature) }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('FCM authentication unavailable');
    const value = await response.json();
    if (!value.access_token) throw new Error('FCM access token missing');
    bearer = value.access_token; expires = Date.now() + (Number(value.expires_in) - 60) * 1000;
    return bearer;
  })().finally(() => { inflight = null; });
  return inflight;
}
export function firebaseAccount(): Account | null {
  const value = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!value) return null;
  const account = JSON.parse(value);
  if (!/^[a-z0-9-]+$/.test(account.project_id) || !account.client_email || !account.private_key) throw new Error('Invalid FCM configuration');
  return account;
}
export async function sendFcm(account: Account, token: string, title: string, body: string, customerUrl = '/', tag = '') {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + await access(account), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { token, notification: { title, body }, data: { url: customerUrl }, android: { ttl: '86400s', priority: 'high', notification: { channel_id: 'chvostikovo', icon: 'ic_notification', ...(tag ? { tag } : {}) } } } }),
    signal: AbortSignal.timeout(10000)
  });
  if (response.ok) return 'sent';
  const result = await response.json().catch(() => ({}));
  if (result.error?.details?.some((detail: { errorCode?: string }) => detail.errorCode === 'UNREGISTERED')) return 'expired';
  if (response.status === 401) { bearer = ''; expires = 0; }
  // Never log response bodies: they can contain registration tokens.
  throw new Error('FCM delivery unavailable: ' + response.status);
}

