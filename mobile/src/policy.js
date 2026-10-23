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
