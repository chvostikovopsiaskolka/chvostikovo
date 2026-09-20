import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  LoaderCircle,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { FormDialog } from "@/components/site/FormDialog";
import { submitProductInquiry } from "@/lib/product-inquiry";
import targetLargeDog from "@/assets/products/target-large-dog.jpeg";
import targetLargeDetail from "@/assets/products/target-large-detail.jpeg";
import targetLargeProduct from "@/assets/products/target-large-product.jpeg";
import targetLargeConstruction from "@/assets/products/target-large-construction.jpeg";
import targetCustomHeight from "@/assets/products/target-custom-height.jpeg";
import targetSmallDog from "@/assets/products/target-small-dog.jpeg";
import targetSmallDetail from "@/assets/products/target-small-detail.jpeg";
import targetSmallProduct from "@/assets/products/target-small-product.jpeg";
import targetSizes from "@/assets/products/target-sizes.jpeg";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/target-na-cvicenie-pre-psov`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Target na cvičenie pre psov | Ručná výroba | Chvostíkovo";
const description =
  "Ručne vyrábaný drevený target na cvičenie pre psov s protišmykovým povrchom. Veľký 40 × 20 cm alebo malý 25 × 25 cm, cena 20 €.";

type TargetSize = "large" | "small";

const SIZE_OPTIONS: Array<{ value: TargetSize; label: string; detail: string }> = [
  { value: "large", label: "Veľký", detail: "40 × 20 cm" },
  { value: "small", label: "Malý", detail: "25 × 25 cm" },
];

const INSPIRATION = [
  { src: targetSmallDog, alt: "Pes pri tréningu na malom targete" },
  { src: targetSizes, alt: "Veľký a malý target na cvičenie pre psov" },
  { src: targetLargeProduct, alt: "Veľký drevený target s protišmykovým povrchom" },
  { src: targetSmallProduct, alt: "Malý štvorcový target na cvičenie" },
  { src: targetLargeDetail, alt: "Detail labiek psa na veľkom targete" },
  { src: targetSmallDetail, alt: "Detail labiek psa na malom targete" },
  { src: targetLargeConstruction, alt: "Detail konštrukcie veľkého targetu" },
  { src: targetCustomHeight, alt: "Target vyrobený s vyššími nohami podľa dohody" },
];

export const Route = createFileRoute("/target-na-cvicenie-pre-psov")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Target na cvičenie pre psov od Chvostíkova" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Target na cvičenie pre psov",
          description,
          url: PAGE_URL,
          brand: { "@type": "Brand", name: "Chvostíkovo" },
          material: "Drevo a protišmykový gumový povrch",
          offers: {
            "@type": "Offer",
            url: PAGE_URL,
            priceCurrency: "EUR",
            price: "20",
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ],
  }),
  component: TargetPage,
});

function TargetPage() {
  const submissionId = useRef(crypto.randomUUID());
  const submissionInFlight = useRef(false);
  const [size, setSize] = useState<TargetSize>("large");
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [height, setHeight] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current || isSubmitted) return;

    const parsedHeight = height.trim() ? Number(height.replace(",", ".")) : null;
    if (parsedHeight !== null && (!Number.isFinite(parsedHeight) || parsedHeight < 3 || parsedHeight > 60)) {
      setFormError("Zadajte výšku targetu v centimetroch, prípadne pole nechajte prázdne.");
      return;
    }

    setFormError("");
    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      await submitProductInquiry({
        client_submission_id: submissionId.current,
        product_type: "target",
        customer_name: customerName,
        phone,
        email,
        source_ref: "/target-na-cvicenie-pre-psov",
        company,
        configuration: {
          size,
          height_cm: parsedHeight,
          note,
        },
      });
      setIsSubmitted(true);
    } catch {
      setFormError("Dopyt sa nepodarilo odoslať. Skúste to, prosím, znova o chvíľu.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const selected = SIZE_OPTIONS.find((option) => option.value === size)!;

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20">
          <div
            className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 -left-20 size-72 rounded-full bg-secondary blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-4">
            <a
              href="/produkty"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral"
            >
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>

            <div className="grid gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12">
              <div className="aspect-[4/3] overflow-hidden rounded-4xl bg-secondary shadow-soft">
                <img
                  src={targetLargeDog}
                  alt="Pes stojaci na veľkom targete na cvičenie"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: "50% 58%" }}
                  fetchPriority="high"
                />
              </div>

              <div>
                <h1 className="text-4xl leading-[1.06] text-forest sm:text-5xl">
                  Target na cvičenie <span className="text-coral-dark">pre psov</span>
                </h1>
                <p className="mt-4 leading-relaxed text-forest/80 sm:text-lg">
                  Ručne vyrábaný drevený target s protišmykovým povrchom. Vhodný na nácvik
                  správneho umiestnenia labiek, koordinácie, rovnováhy, fitness aj poslušnosti.
                </p>

                <div className="mt-6">
                  <p className="font-display text-sm font-bold text-forest">Vyberte veľkosť</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSize(option.value)}
                        className={`rounded-2xl border-2 p-3 text-left transition ${
                          size === option.value
                            ? "border-coral bg-coral-soft/25"
                            : "border-forest/10 bg-card"
                        }`}
                      >
                        <span className="font-display text-sm font-bold text-forest">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-xs text-forest/60">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-3">
                  <span className="text-sm text-forest/60">Cena</span>
                  <span className="font-display text-4xl font-bold text-forest">20 €</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-forest/60">
                  Najbežnejšia výška je približne 5 cm. Na požiadanie vieme výšku upraviť podľa
                  dohody.
                </p>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-7 flex w-full items-center justify-between gap-4 rounded-2xl border border-forest/10 bg-card px-5 py-4 text-left shadow-card transition hover:bg-secondary/40"
                >
                  <span>
                    <span className="block font-display font-bold text-forest">
                      Mám záujem o target
                    </span>
                    <span className="mt-0.5 block text-xs text-forest/55">
                      {selected.label} · {selected.detail} · výška podľa dohody
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-forest/65" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary/45 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [ShieldCheck, "Protišmykový povrch", "Pevný povrch pomáha psíkovi udržať labky na mieste."],
                [Check, "Pevná konštrukcia", "Drevená základňa je stabilná pri bežnom tréningu."],
                [Ruler, "Dve veľkosti", "Veľký 40 × 20 cm alebo malý 25 × 25 cm."],
                [Sparkles, "Výška podľa dohody", "Štandardne približne 5 cm, vyrobiť vieme aj inú výšku."],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof Check;
                return (
                  <article key={String(heading)} className="rounded-3xl bg-card p-5 shadow-card">
                    <CardIcon className="size-5 text-coral" />
                    <h2 className="mt-3 text-lg text-forest">{String(heading)}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-forest/70">{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Pre inšpiráciu
              </p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">
                Target pri tréningu aj zblízka
              </h2>
            </div>

            <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {INSPIRATION.map((image) => (
                <figure
                  key={image.alt}
                  className="w-[78%] shrink-0 snap-center overflow-hidden rounded-4xl bg-card shadow-card sm:w-[44%] lg:w-[31%]"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-80 w-full object-cover sm:h-96"
                    style={{ objectPosition: "50% 58%" }}
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-forest py-12 text-cream sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl text-cream sm:text-4xl">Target vyrobíme podľa vášho tréningu</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-cream/80">
              Vyberte si veľký alebo malý variant. Ak potrebujete inú výšku než bežných 5 cm,
              uveďte ju do formulára a dohodneme sa podľa možností výroby.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-coral mt-6 inline-flex items-center gap-2"
            >
              Mám záujem o target <ChevronRight className="size-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />

      <FormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Mám záujem o target"
        subtitle="Vyberte veľkosť targetu a pošlite nám kontakt. Ak chcete inú výšku ako približne 5 cm, môžete ju uviesť nižšie."
      >
        {isSubmitted ? (
          <div className="rounded-3xl bg-secondary/70 px-5 py-8 text-center" role="status">
            <Check className="mx-auto size-7 text-coral" />
            <p className="mt-3 font-display text-xl font-bold text-forest">
              Ďakujeme za váš záujem 🐶 Ozveme sa vám do 24 hodín.
            </p>
          </div>
        ) : (
          <form onSubmit={sendInquiry}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block font-display text-sm font-bold text-forest sm:col-span-2">
                Meno a priezvisko *
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  autoComplete="name"
                  required
                  maxLength={160}
                  className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
                />
              </label>
              <label className="block font-display text-sm font-bold text-forest">
                Telefón *
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={40}
                  className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
                />
              </label>
              <label className="block font-display text-sm font-bold text-forest">
                E-mail *
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
                />
              </label>
            </div>

            <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
              Firma
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>

            <div className="mt-5">
              <p className="font-display text-sm font-bold text-forest">Veľkosť targetu *</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSize(option.value)}
                    className={`rounded-2xl border-2 p-3 text-left transition ${
                      size === option.value
                        ? "border-coral bg-coral-soft/25"
                        : "border-forest/10 bg-background"
                    }`}
                  >
                    <span className="font-display text-sm font-bold text-forest">{option.label}</span>
                    <span className="mt-1 block text-xs text-forest/60">{option.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block font-display text-sm font-bold text-forest">
              Požadovaná výška v cm
              <input
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                inputMode="decimal"
                placeholder="5"
                className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
              />
              <span className="mt-1.5 block font-sans text-xs font-normal text-forest/55">
                Nepovinné. Najbežnejší model má výšku približne 5 cm.
              </span>
            </label>

            <label className="mt-5 block font-display text-sm font-bold text-forest">
              Poznámka
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans font-normal outline-none focus:border-coral"
                placeholder="Čokoľvek, čo máme pri výrobe vedieť."
              />
            </label>

            {formError && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-coral mt-5 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Odosielam
                </>
              ) : (
                <>
                  <Send className="size-4" /> Odoslať záujem
                </>
              )}
            </button>
          </form>
        )}
      </FormDialog>
    </div>
  );
}
