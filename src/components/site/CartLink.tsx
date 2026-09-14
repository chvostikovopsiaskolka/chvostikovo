import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { CART_UPDATED_EVENT, cartCount, readCart } from "@/lib/shop";

export function CartLink({ mobile = false }: { mobile?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(cartCount(readCart()));
    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (mobile) {
    return (
      <a href="/kosik" className="flex items-center justify-between rounded-2xl px-4 py-3 font-display text-sm font-semibold text-forest hover:bg-secondary">
        <span className="flex items-center gap-2"><ShoppingBag className="size-4 text-coral" /> Košík</span>
        {count > 0 && <span className="rounded-full bg-coral px-2 py-0.5 text-xs text-white">{count}</span>}
      </a>
    );
  }

  return (
    <a href="/kosik" aria-label={`Košík${count ? `, ${count} položiek` : ""}`} className="relative hidden size-9 items-center justify-center rounded-full bg-secondary text-forest transition-colors hover:bg-coral-soft sm:inline-flex">
      <ShoppingBag className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-coral px-1 text-center text-[0.6rem] font-bold leading-4 text-white">{count}</span>
      )}
    </a>
  );
}
