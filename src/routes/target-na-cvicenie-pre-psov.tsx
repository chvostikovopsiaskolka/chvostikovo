import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { EdgePhotoCarousel } from "@/components/site/EdgePhotoCarousel";
import { FormDialog } from "@/components/site/FormDialog";
import { ProductInquirySteps } from "@/components/site/ProductInquirySteps";
import { ProductInquiryContact } from "@/components/site/ProductInquiryContact";
import { TargetVariantCards, type TargetSize } from "@/components/site/TargetVariantCards";
import { phoneFromForm } from "@/lib/phone";
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
const PAGE_URL = `${BASE_URL}/target-na-cvicenie-pre-psov/`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Target na cvičenie pre psov | Ručná výroba | Chvostíkovo";
const description =
  "Ručne vyrábaný drevený target s protišmykovým povrchom na tréning správneho postoja, koordinácie a rovnováhy. Veľký 40 × 20 cm alebo malý 25 × 25 cm, cena 20 €.";

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
    links: [
      { rel: "canonical", href: PAGE_URL },
      { rel: "preload", as: "image", href: targetLargeDog },
      { rel: "preload", as: "image", href: targetSmallDog },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Target na cvičenie pre psov",
          description,
          url: PAGE_URL,
          image: [targetLargeDog, targetSmallDog, targetLargeProduct, targetSmallProduct].map(
            (src) => (src.startsWith("http") ? src : `${BASE_URL}${src}`),
          ),
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

function TargetGalleryLoop() {
  return (
    <EdgePhotoCarousel
      photos={INSPIRATION}
      label="Fotogaléria targetov na cvičenie – posúvajte fotografie do strán"
      dataName="target"
      className="mt-9"
    />
  );
}

function TargetPage() {
  const submissionId = useRef(crypto.randomUUID());
  const submissionInFlight = useRef(false);
  const [size, setSize] = useState<TargetSize>("large");
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
      const fd = new FormData(event.currentTarget);
      await submitProductInquiry({
        client_submission_id: submissionId.current,
        product_type: "target",
        customer_name: String(fd.get("customer_name") ?? "").trim(),
        phone: phoneFromForm(event.currentTarget, "target-phone"),
        email: String(fd.get("email") ?? "").trim(),
        customer_location: String(fd.get("customer_location") ?? "").trim(),
        source_ref: "/target-na-cvicenie-pre-psov",
        consent: true,
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

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section data-target-product-intro className="relative overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pt-32">
          <div aria-hidden="true" className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4">
            <a href="/produkty"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral">
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl leading-[1.06] text-forest sm:text-5xl">
                Target na cvičenie <span className="text-coral-dark">pre psov</span>
              </h1>
              <p className="mt-4 leading-relaxed text-forest/80 sm:text-lg">
                Vyberte si variant a objednajte si target pre svojho psíka.
              </p>
            </div>
            <TargetVariantCards onInterest={(nextSize) => {
              setSize(nextSize);
              setStep(1);
              setFormError("");
              setModalOpen(true);
            }} />
          </div>
        </section>

        <section className="bg-secondary/45 py-12 sm:py-16" aria-labelledby="target-value-heading">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Cvičenie v praxi
              </p>
              <h2 id="target-value-heading" className="section-title mt-2 text-3xl sm:text-4xl">
                Čo môžete s targetom trénovať?
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [
                  ShieldCheck,
                  "Presný dotyk labkou",
                  "Psík má jasne určené miesto, kam položiť labku. Môžete tak trénovať cielený dotyk namiesto náhodného kroku.",
                ],
                [
                  Check,
                  "Rehabilitácia a fyzioterapia",
                  "Pod vedením odborníka sa target môže využiť na kontrolované postavenie labiek, prácu s držaním tela a cviky podporujúce stabilitu či posilňovanie svalstva. Nenahrádza rehabilitačný plán.",
                ],
                [
                  Sparkles,
                  "Poslušnosť a zotrvanie na mieste",
                  "V bežnom tréningu môže target označovať miesto pre labky. Psík sa učí prísť na pokyn, pokojne zotrvať a odísť až po uvoľnení.",
                ],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof Check;
                return (
                  <article key={String(heading)} className="rounded-3xl bg-card p-6 shadow-card">
                    <CardIcon aria-hidden="true" className="size-5 text-coral" />
                    <h3 className="mt-3 text-lg text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/70">{String(text)}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-7 text-center">
              <a href="/blog/target-na-cvicenie-psov-prve-cviky/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral-dark underline underline-offset-4 hover:text-forest">
                Ako začať s targetom? Prvé cviky krok za krokom
                <ChevronRight aria-hidden="true" className="size-4" />
              </a>
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="section-title text-3xl sm:text-4xl">
                Targety, ktoré už pomáhajú psíkom pri tréningu
              </h2>
            </div>

            <TargetGalleryLoop />
          </div>
        </section>

        <section className="bg-forest py-12 text-cream sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-3xl text-cream sm:text-4xl">Máte záujem o target?</h2>
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
              Ďakujeme za váš záujem 🐶 Ozveme sa vám hneď, ako to bude možné.
            </p>
          </div>
        ) : (
          <ProductInquirySteps step={step} onStepChange={(next) => { setStep(next); setFormError(""); }}
            titles={["Rozmer targetu", "Úprava na mieru", "Kontakt"]}
            stepOne={(
              <div className="space-y-5">
                <div>
                  <p className="font-display text-sm font-bold text-forest">Veľkosť targetu *</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {SIZE_OPTIONS.map((option) => (
                      <button key={option.value} type="button" onClick={() => setSize(option.value)}
                        aria-pressed={size === option.value}
                        className={size === option.value
                          ? "rounded-2xl border-2 border-coral bg-coral-soft/25 p-3 text-left"
                          : "rounded-2xl border-2 border-forest/10 bg-background p-3 text-left"}>
                        <span className="font-display text-sm font-bold text-forest">{option.label}</span>
                        <span className="mt-1 block text-xs text-forest/60">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block font-display text-sm font-bold text-forest">
                  Požadovaná výška targetu v cm (voliteľné)
                  <input value={height} onChange={(event) => { setHeight(event.target.value); setFormError(""); }}
                    inputMode="decimal" placeholder="5"
                    className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral" />
                  <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                    Ak výšku necháte prázdnu, platí štandard približne 5 cm.
                  </span>
                </label>
              </div>
            )}
            stepTwo={(
              <label className="block font-display text-sm font-bold text-forest">
                Poznámka k výrobe (voliteľné)
                <textarea value={note} onChange={(event) => setNote(event.target.value)}
                  maxLength={1000} rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral"
                  placeholder="Čokoľvek, čo máme pri výrobe vedieť." />
                <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                  Pokiaľ nechcete žiadnu úpravu, pokračujte bez poznámky.
                </span>
              </label>
            )}
            stepThree={(
              <ProductInquiryContact phoneId="target-phone"
                customerName={customerName} setCustomerName={setCustomerName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                company={company} setCompany={setCompany} />
            )}
            onNext={() => {
              const value = height.trim() ? Number(height.replace(",", ".")) : null;
              const valid = value === null || (Number.isFinite(value) && value >= 3 && value <= 60);
              setFormError(valid ? "" : "Zadajte výšku targetu v centimetroch (3 až 60) alebo nechajte pole prázdne.");
              return valid;
            }}
            onSubmit={sendInquiry} error={formError} submitting={isSubmitting} />
        )}
      </FormDialog>
    </div>
  );
}
