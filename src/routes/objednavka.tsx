import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { cartTotal, clearCart, readCart, submitProductOrder, type CartItem } from "@/lib/shop";

export const Route = createFileRoute("/objednavka")({
  head: () => ({
    meta: [
      { title: "Dokončenie objednávky | Chvostíkovo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");

  useEffect(() => setItems(readCart()), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await submitProductOrder({
        customer_name: String(form.get("customer_name") || "").trim(),
        phone: String(form.get("phone") || "").trim(),
        email: String(form.get("email") || "").trim(),
        delivery_method: delivery,
        address: String(form.get("address") || "").trim(),
        note: String(form.get("note") || "").trim(),
        company: String(form.get("company") || "").trim(),
        consent: true,
        source_ref: "/objednavka",
        items,
      });
      clearCart();
      setItems([]);
      setOrderNumber(result.order_number);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "server_error";
      setError(message === "please_wait" ? "Objednávku ste práve odoslali. Skúste to, prosím, o chvíľu." : "Objednávku sa nepodarilo odoslať. Skontrolujte údaje a skúste to znova.");
    } finally {
      setSending(false);
    }
  }

  if (orderNumber) {
    return (
      <div className="min-h-screen bg-background">
        <Header homeSectionLinks />
        <main className="mx-auto max-w-3xl px-4 pb-20 pt-32">
          <div className="rounded-4xl bg-card p-8 text-center shadow-soft sm:p-12">
            <CheckCircle2 className="mx-auto size-12 text-coral" />
            <p className="mt-5 font-display text-sm font-semibold tracking-wide text-coral uppercase">Objednávka prijatá</p>
            <h1 className="mt-2 text-4xl text-forest">Ďakujeme</h1>
            <p className="mt-5 text-lg leading-relaxed text-forest/75">Vaša objednávka má číslo</p>
            <p className="mt-2 font-display text-5xl font-bold text-forest">{orderNumber}</p>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-forest/70">Pred výrobou sa vám ozveme a potvrdíme zvolené prevedenie, rozmery, termín a prípadné doručenie.</p>
            <a href="/" className="btn-coral mt-7 inline-flex">Späť na Chvostíkovo</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:pt-32">
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-7 text-coral" />
          <h1 className="text-4xl text-forest sm:text-5xl">Dokončenie objednávky</h1>
        </div>

        {!items.length ? (
          <div className="mt-10 rounded-4xl bg-card p-8 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-forest">Košík je prázdny.</p>
            <a href="/produkty" className="btn-coral mt-5 inline-flex">Pozrieť produkty</a>
          </div>
        ) : (
          <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
            <form onSubmit={submit} className="rounded-4xl bg-card p-6 shadow-soft sm:p-8">
              <h2 className="text-2xl text-forest">Kontaktné údaje</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-forest">Meno a priezvisko *<input required name="customer_name" autoComplete="name" className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-normal outline-none focus:border-coral" /></label>
                <label className="block text-sm font-semibold text-forest">Telefón *<input required name="phone" autoComplete="tel" inputMode="tel" className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-normal outline-none focus:border-coral" /></label>
                <label className="block text-sm font-semibold text-forest sm:col-span-2">E-mail *<input required type="email" name="email" autoComplete="email" className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-normal outline-none focus:border-coral" /></label>
              </div>

              <h2 className="mt-8 text-2xl text-forest">Prevzatie</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setDelivery("pickup")} className={`rounded-3xl border-2 p-4 text-left transition ${delivery === "pickup" ? "border-coral bg-coral-soft/30" : "border-forest/10"}`}>
                  <span className="font-display font-bold text-forest">Osobný odber</span><span className="mt-1 block text-sm text-forest/65">Chvostíkovo, Košice</span>
                </button>
                <button type="button" onClick={() => setDelivery("delivery")} className={`rounded-3xl border-2 p-4 text-left transition ${delivery === "delivery" ? "border-coral bg-coral-soft/30" : "border-forest/10"}`}>
                  <span className="font-display font-bold text-forest">Doručenie</span><span className="mt-1 block text-sm text-forest/65">Cenu potvrdíme pred výrobou</span>
                </button>
              </div>

              {delivery === "delivery" && (
                <label className="mt-5 block text-sm font-semibold text-forest">Adresa doručenia *<textarea required name="address" rows={3} className="mt-2 w-full resize-none rounded-2xl border border-forest/15 bg-background px-4 py-3 font-normal outline-none focus:border-coral" /></label>
              )}
              <label className="mt-5 block text-sm font-semibold text-forest">Poznámka k objednávke<textarea name="note" rows={4} className="mt-2 w-full resize-none rounded-2xl border border-forest/15 bg-background px-4 py-3 font-normal outline-none focus:border-coral" /></label>
              <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-forest/70">
                <input required type="checkbox" className="mt-1" />
                <span>Súhlasím so spracovaním údajov potrebných na vybavenie objednávky. <a href="/ochrana-osobnych-udajov" className="font-semibold text-coral underline">Ochrana osobných údajov</a></span>
              </label>

              {error && <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button disabled={sending} type="submit" className="btn-coral mt-6 flex w-full items-center justify-center gap-2 disabled:opacity-60">
                {sending && <Loader2 className="size-4 animate-spin" />} {sending ? "Odosielam…" : "Odoslať objednávku"}
              </button>
            </form>

            <aside className="rounded-4xl bg-card p-6 shadow-soft lg:sticky lg:top-28">
              <h2 className="text-xl text-forest">Vaša objednávka</h2>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="border-b border-forest/10 pb-4 text-sm text-forest/70 last:border-0">
                    <div className="flex justify-between gap-3 font-display font-bold text-forest"><span>{item.product_name}</span><span>{item.unit_price_eur * item.quantity} €</span></div>
                    <p className="mt-2">{item.configuration.size_label}</p>
                    <p>{item.configuration.color_label} · pes {item.configuration.dog_height_cm} cm</p>
                    <p>{item.configuration.name_on_stand ? `Meno: ${item.configuration.name_on_stand}` : "Bez mena"} · {item.configuration.letter_color_label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between font-display text-2xl font-bold text-forest"><span>Spolu</span><span>{cartTotal(items)} €</span></div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
