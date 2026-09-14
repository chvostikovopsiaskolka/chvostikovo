import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { cartTotal, readCart, removeFromCart, type CartItem } from "@/lib/shop";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (open) setItems(readCart());
  }, [open]);

  if (!open) return null;

  const remove = (id: string) => setItems(removeFromCart(id));

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Zavrieť košík" onClick={onClose} className="absolute inset-0 bg-forest/45 backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-forest/10 px-5 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-coral" />
            <h2 className="font-display text-xl font-bold text-forest">Váš košík</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-forest" aria-label="Zavrieť">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-3xl bg-card p-6 text-center shadow-card">
              <p className="font-display font-semibold text-forest">Košík je zatiaľ prázdny.</p>
              <a href="/produkty" className="mt-4 inline-flex text-sm font-semibold text-coral">Pozrieť produkty</a>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-3xl bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-forest">{item.product_name}</h3>
                      <p className="mt-1 text-sm text-forest/65">{item.configuration.size_label}</p>
                    </div>
                    <button type="button" onClick={() => remove(item.id)} className="text-forest/45 hover:text-coral" aria-label="Odstrániť z košíka">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-1 text-sm text-forest/70">
                    <span>Farba: {item.configuration.color_label}</span>
                    <span>Výška psa: {item.configuration.dog_height_cm} cm</span>
                    <span>Meno: {item.configuration.name_on_stand || "bez mena"}</span>
                    <span>Farba písmen: {item.configuration.letter_color_label}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between font-display font-bold text-forest">
                    <span>{item.quantity} ks</span>
                    <span>{item.unit_price_eur * item.quantity} €</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-forest/10 bg-card p-5">
            <div className="flex items-center justify-between font-display text-lg font-bold text-forest">
              <span>Spolu</span>
              <span>{cartTotal(items)} €</span>
            </div>
            <p className="mt-1 text-xs text-forest/55">Cena dopravy sa prípadne potvrdí samostatne.</p>
            <a href="/objednavka" className="btn-coral mt-4 flex w-full items-center justify-center gap-2">
              Dokončiť objednávku <ArrowRight className="size-4" />
            </a>
            <a href="/kosik" className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-forest/10 px-5 py-3 font-display text-sm font-semibold text-forest">
              Upraviť košík
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
