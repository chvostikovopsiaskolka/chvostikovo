import {securityLimitV336,securityAccessV336} from "./security-v336.ts";
const ALLOWED_ORIGINS = new Set([
  'https://chvostikovo.sk',
  'https://www.chvostikovo.sk',
  'https://chvostikovopsiaskolka.github.io',
]);

const PRODUCT = {
  slug: 'stojan-na-misky-pre-psa',
  name: 'Drevený stojan na misky pre psa',
  price: 40,
};

const SIZES = new Set(['small', 'large']);
const COLORS = new Set(['natural', 'dark', 'white', 'custom']);
const LETTER_COLORS = new Set(['light', 'black', 'white', 'custom']);
const DELIVERY = new Set(['pickup', 'delivery']);

function text(value: unknown, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function response(origin: string, status: number, body: Record<string, unknown>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  if (ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

async function sendEmails(orderNumber: string, payload: any, items: any[]) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;

  const from = Deno.env.get('NOTIFY_FROM') ?? 'Chvostíkovo web <onboarding@resend.dev>';
  const notifyTo = Deno.env.get('NOTIFY_TO') ?? 'chvostikovo.psiaskolka@gmail.com';
  const itemLines = items.map((item, index) => {
    const c = item.configuration ?? {};
    return [
      `${index + 1}. ${item.product_name} × ${item.quantity}`,
      `   Rozmer: ${c.size_label || ''}`,
      `   Farba stojana: ${c.color_label || ''}`,
      `   Výška psa v kohútiku: ${c.dog_height_cm || ''} cm`,
      `   Meno na stojane: ${c.name_on_stand || 'bez mena'}`,
      `   Farba písmen: ${c.letter_color_label || ''}`,
      `   Cena: ${item.line_total_eur} €`,
    ].join('\n');
  }).join('\n\n');

  const deliveryLabel = payload.delivery_method === 'pickup'
    ? 'Osobný odber v Chvostíkove'
    : 'Doručenie – cenu dopravy potvrdíme';

  const body = [
    `Objednávka č. ${orderNumber}`,
    '',
    `Meno: ${payload.customer_name}`,
    `Telefón: ${payload.phone}`,
    `E-mail: ${payload.email || ''}`,
    `Prevzatie: ${deliveryLabel}`,
    payload.address ? `Adresa: ${payload.address}` : '',
    payload.note ? `Poznámka: ${payload.note}` : '',
    '',
    itemLines,
    '',
    `Spolu za produkty: ${payload.total_eur} €`,
  ].filter(Boolean).join('\n');

  try {
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [notifyTo], subject: `Nová objednávka produktu č. ${orderNumber}`, text: body }),
    });
    if (!adminRes.ok) console.error('Admin email failed', adminRes.status, await adminRes.text());

    if (payload.email) {
      const customerText = [
        `Ďakujeme za objednávku č. ${orderNumber}.`,
        '',
        'Objednávku sme prijali. Pred výrobou si s vami potvrdíme zvolené prevedenie, rozmery a termín.',
        '',
        itemLines,
        '',
        `Spolu za produkty: ${payload.total_eur} €`,
        '',
        'Chvostíkovo',
      ].join('\n');
      const customerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [payload.email], subject: `Objednávka č. ${orderNumber} – Chvostíkovo`, text: customerText }),
      });
      if (!customerRes.ok) console.error('Customer email failed', customerRes.status, await customerRes.text());
    }
  } catch (error) {
    console.error('Email failed', error);
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false });
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') return response(origin, 405, { ok: false, error: 'method_not_allowed' });
  if (!ALLOWED_ORIGINS.has(origin)) return response(origin, 403, { ok: false, error: 'origin_not_allowed' });

  try {
    const raw = await req.text();
    if (!raw || raw.length > 30_000) return response(origin, 400, { ok: false, error: 'invalid_body' });
    const input = JSON.parse(raw);
    if (text(input.company || input.website, 200)) return response(origin, 200, { ok: true });

    const customerName = text(input.customer_name, 160);
    const phone = text(input.phone, 40);
    const email = text(input.email, 200).toLowerCase();
    const deliveryMethod = text(input.delivery_method, 30);
    const address = text(input.address, 500);
    const note = text(input.note, 1500);
    const sourceRef = text(input.source_ref || '/objednavka', 500);
    const consent = input.consent === true;

    if (!customerName || phone.length < 7 || !email || !email.includes('@') || !consent || !DELIVERY.has(deliveryMethod)) {
      return response(origin, 400, { ok: false, error: 'missing_customer_fields' });
    }
    if (deliveryMethod === 'delivery' && !address) {
      return response(origin, 400, { ok: false, error: 'missing_address' });
    }

    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 10) {
      return response(origin, 400, { ok: false, error: 'invalid_items' });
    }

    const items = input.items.map((rawItem: any) => {
      if (text(rawItem.product_slug, 100) !== PRODUCT.slug) throw new Error('invalid_product');
      const quantity = Math.max(1, Math.min(5, Number(rawItem.quantity || 1)));
      const c = rawItem.configuration ?? {};
      const size = text(c.size, 20);
      const color = text(c.color, 20);
      const letterColor = text(c.letter_color, 20);
      const dogHeight = Number(c.dog_height_cm);
      const nameOnStand = text(c.name_on_stand, 40);
      if (!SIZES.has(size) || !COLORS.has(color) || !LETTER_COLORS.has(letterColor) || !Number.isFinite(dogHeight) || dogHeight < 10 || dogHeight > 120) {
        throw new Error('invalid_configuration');
      }
      const labels: Record<string, Record<string, string>> = {
        size: { small: 'Menší cca 40 × 20 cm', large: 'Väčší cca 60 × 30 cm' },
        color: { natural: 'Prírodné drevo', dark: 'Tmavé drevo', white: 'Biela', custom: 'Iná podľa dohody' },
        letter: { light: 'Svetlé drevo', black: 'Čierna', white: 'Biela', custom: 'Iná podľa dohody' },
      };
      return {
        product_slug: PRODUCT.slug,
        product_name: PRODUCT.name,
        quantity,
        unit_price_eur: PRODUCT.price,
        line_total_eur: PRODUCT.price * quantity,
        configuration: {
          size,
          size_label: labels.size[size],
          color,
          color_label: labels.color[color],
          dog_height_cm: dogHeight,
          name_on_stand: nameOnStand,
          letter_color: letterColor,
          letter_color_label: labels.letter[letterColor],
        },
      };
    });

    const total = items.reduce((sum: number, item: any) => sum + item.line_total_eur, 0);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) throw new Error('missing_supabase_env');
    const rateBase=Deno.env.get('SUPABASE_URL')||'',rateKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
      const rateCors={'Access-Control-Allow-Origin':origin,Vary:'Origin'};
      const limited=await securityLimitV336(req,'form_ip','',rateBase,rateKey,rateCors);if(limited)return limited;
      const globalLimited=await securityLimitV336(req,'form_global','global',rateBase,rateKey,rateCors);if(globalLimited)return globalLimited;

    const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

    const since = new Date(Date.now() - 20_000).toISOString();
    const dupRes = await fetch(`${supabaseUrl}/rest/v1/product_orders?phone=eq.${encodeURIComponent(phone)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`, { headers: authHeaders, cache: 'no-store' });
    if (!dupRes.ok) throw new Error(`duplicate_check_${dupRes.status}`);
    if ((await dupRes.json()).length) return response(origin, 429, { ok: false, error: 'please_wait' });

    const orderPayload = {
      status: 'new',
      customer_name: customerName,
      phone,
      email,
      delivery_method: deliveryMethod,
      address: deliveryMethod === 'delivery' ? address : null,
      note: note || null,
      total_eur: total,
      source_ref: sourceRef,
      raw_payload: input,
    };

    const orderRes = await fetch(`${supabaseUrl}/rest/v1/product_orders`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(orderPayload),
    });
    if (!orderRes.ok) throw new Error(`order_insert_${orderRes.status}_${await orderRes.text()}`);
    const [order] = await orderRes.json();
    if (!order?.id) throw new Error('missing_order_id');

    const itemsPayload = items.map((item: any) => ({ ...item, order_id: order.id }));
    const itemsRes = await fetch(`${supabaseUrl}/rest/v1/product_order_items`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(itemsPayload),
    });
    if (!itemsRes.ok) {
      await fetch(`${supabaseUrl}/rest/v1/product_orders?id=eq.${order.id}`, { method: 'DELETE', headers: authHeaders });
      throw new Error(`items_insert_${itemsRes.status}_${await itemsRes.text()}`);
    }

    const orderNumber = String(order.id).padStart(4, '0');
    await sendEmails(orderNumber, { ...orderPayload, total_eur: total }, items);
    return response(origin, 201, { ok: true, order_number: orderNumber, total_eur: total });
  } catch (error) {
    console.error(error);
    const message = String(error instanceof Error ? error.message : error);
    if (message === 'invalid_product' || message === 'invalid_configuration') {
      return response(origin, 400, { ok: false, error: message });
    }
    return response(origin, 500, { ok: false, error: 'server_error' });
  }
});
