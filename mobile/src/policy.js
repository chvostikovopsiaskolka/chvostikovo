export const APP_ID = 'sk.chvostikovo.app';
export function callbackPath(value) {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://app.chvostikovo.sk' || !['/', '/index.html', '/email-confirmed.html'].includes(url.pathname)) return null;
    // Only authentication callbacks can navigate the WebView. Never allow arbitrary URLs.
    const hash = new URLSearchParams(url.hash.slice(1));
    if (!hash.get('access_token') && !hash.get('error') && !hash.get('error_code')) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}

// Retain only the existing account-scoped notification target contract.
export function notificationQuery(value) {
  try {
    if (typeof value !== 'string' || value.length > 2048) return null;
    const url = new URL(value, 'https://app.chvostikovo.sk');
    if (url.origin !== 'https://app.chvostikovo.sk' || !['/', '/index.html'].includes(url.pathname) || url.hash) return null;
    const kind = url.searchParams.get('open'), field = kind === 'messages' ? 'conversation' : kind === 'announcement' ? 'announcement' : '';
    const id = Number(url.searchParams.get(field)), recipient = url.searchParams.get('recipient');
    if (!field || !Number.isSafeInteger(id) || id <= 0 || !/^[a-f0-9-]{36}$/i.test(recipient || '')) return null;
    return new URLSearchParams({ open: kind, [field]: String(id), recipient }).toString();
  } catch { return null; }
}
