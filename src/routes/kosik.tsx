import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { cartTotal, readCart, removeFromCart, type CartItem } from "@/lib/shop";

export const Route = createFileRoute("/kosik")({
  head: () => ({
    meta: [
      { title: "Košík | Chvostíkovo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => setItems(readCart()), []);

  const remove = (id: string) => setItems(removeFromCart(id));

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <a href="/produkty" className="inline-flex items-center gap-2 text-sm font-semibold text-forest/65 hover:text-coral">
          <ArrowLeft className="size-4" /> Späť na produkty
        </a>
        <div className="mt-6 flex items-center gap-3">
          <ShoppingBag className="size-7 text-coral" />
          <h1 className="text-4xl text-forest sm:text-5xl">Košík</h1>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-4xl bg-card p-8 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-forest">Košík je prázdny.</p>
            <a href="/produkty" className="btn-coral mt-5 inline-flex">Pozrieť produkty</a>
          </div>
        ) : (
          <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-4xl bg-card p-6 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl text-forest">{item.product_name}</h2>
                      <p className="mt-1 text-sm text-forest/60">{item.configuration.size_label}</p>
                    </div>
                    <button type="button" onClick={() => remove(item.id)} className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-forest/60 hover:text-coral" aria-label="Odstrániť položku">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-5 grid gap-2 text-sm text-forest/75 sm:grid-cols-2">
                    <span className="rounded-2xl bg-secondary px-4 py-3">Farba: {item.configuration.color_label}</span>
                    <span className="rounded-2xl bg-secondary px-4 py-3">Výška psa: {item.configuration.dog_height_cm} cm</span>
                    <span className="rounded-2xl bg-secondary px-4 py-3">Meno: {item.configuration.name_on_stand || "bez mena"}</span>
                    <span className="rounded-2xl bg-secondary px-4 py-3">Písmená: {item.configuration.letter_color_label}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between font-display font-bold text-forest">
                    <span>{item.quantity} ks</span>
                    <span>{item.unit_price_eur * item.quantity} €</span>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-4xl bg-card p-6 shadow-soft lg:sticky lg:top-28">
              <p className="font-display text-sm font-semibold text-forest/55">Súhrn</p>
              <div className="mt-3 flex items-center justify-between font-display text-2xl font-bold text-forest">
                <span>Spolu</span>
                <span>{cartTotal(items)} €</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-forest/55">Cena dopravy nie je zahrnutá. Ak zvolíte doručenie, potvrdíme ju spolu s termínom výroby.</p>
              <a href="/objednavka" className="btn-coral mt-5 flex w-full items-center justify-center gap-2">
                Pokračovať k objednávke <ArrowRight className="size-4" />
              </a>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
