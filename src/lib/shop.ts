export type StandSize = "small" | "large";
export type StandColor = "natural" | "dark" | "white" | "custom";
export type LetterColor = "light" | "black" | "white" | "custom";

export type StandConfiguration = {
  size: StandSize;
  size_label: string;
  color: StandColor;
  color_label: string;
  dog_height_cm: number;
  name_on_stand: string;
  letter_color: LetterColor;
  letter_color_label: string;
};

export type CartItem = {
  id: string;
  product_slug: "stojan-na-misky-pre-psa";
  product_name: string;
  unit_price_eur: number;
  quantity: number;
  configuration: StandConfiguration;
};

export type ProductOrderInput = {
  customer_name: string;
  phone: string;
  email: string;
  delivery_method: "pickup" | "delivery";
  address: string;
  note: string;
  consent: true;
  source_ref: string;
  company?: string;
  items: CartItem[];
};

const STORAGE_KEY = "chvostikovo_product_cart_v1";
export const CART_UPDATED_EVENT = "chvostikovo-cart-updated";
export const PRODUCT_ORDER_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/product-order-submit";

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

export function readCart(): CartItem[] {
  const w = safeWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  w.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function addToCart(item: Omit<CartItem, "id">) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const next = [...readCart(), { ...item, id }];
  writeCart(next);
  return next;
}

export function removeFromCart(id: string) {
  const next = readCart().filter((item) => item.id !== id);
  writeCart(next);
  return next;
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(items = readCart()) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotal(items = readCart()) {
  return items.reduce((sum, item) => sum + item.unit_price_eur * item.quantity, 0);
}

export async function submitProductOrder(input: ProductOrderInput) {
  const res = await fetch(PRODUCT_ORDER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = typeof body?.error === "string" ? body.error : `submit_failed_${res.status}`;
    throw new Error(error);
  }

  return body as { ok: true; order_number: string; total_eur: number };
}
