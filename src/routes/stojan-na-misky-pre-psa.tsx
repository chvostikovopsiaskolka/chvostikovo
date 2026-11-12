import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Droplets,
  Ruler,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { ProductDeliveryDetails } from "@/components/site/ProductDeliveryDetails";
import { StandGalleryLoop } from "@/components/site/StandGalleryLoop";
import { StandVariantCards } from "@/components/site/StandVariantCards";
import { ProductInquirySteps } from "@/components/site/ProductInquirySteps";
import { ProductInquiryContact } from "@/components/site/ProductInquiryContact";
import { FormDialog } from "@/components/site/FormDialog";
import { Collapse } from "@/components/site/Collapse";
import { phoneFromForm } from "@/lib/phone";
import { submitProductInquiry } from "@/lib/product-inquiry";
import type { LetterColor, StandColor, StandSize } from "@/lib/shop";
import standDark from "@/assets/products/stand-dark.webp";
import standWhite from "@/assets/products/stand-white.webp";
import standMia from "@/assets/products/stand-small-mia.webp";

const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/stojan-na-misky-pre-psa/`;
const OG_IMAGE = `${BASE_URL}/og-image.png`;
const title = "Stojan na misky pre psa | Drevený stojan na mieru | Chvostíkovo";
const description =
  "Ručne vyrábané drevené stojany na misky S, M a L. Dve nerezové misky, výška nôh na mieru, personalizácia a doručenie v Košiciach a okolí.";

const FAQ = [
  {
    q: "Ako vybrať správnu výšku stojana?",
    a: "Pri objednávke nám stačí uviesť výšku psíka v kohútiku. Podľa nej zvolíme vhodnú výšku stojana tak, aby bol prispôsobený konkrétnemu psíkovi.",
  },
  {
    q: "Sú misky súčasťou stojana?",
    a: "Áno, dve nerezové misky sú v cene každého variantu S, M aj L. Veľkosť misiek prispôsobujeme prevedeniu.",
  },
  {
    q: "Aké veľkosti vyrábate?",
    a: "Verzia S má cca 40 × 20 cm a výšku nôh do 15 cm (40 €). Verzia M má cca 60 × 30 cm s výškou nôh 20 až 35 cm (45 €). Verziu L vyrábame po individuálnej dohode podľa veľkosti psíka; cenu a rozmer potvrdíme vopred.",
  },
  {
    q: "Môžem si vybrať farbu a meno na stojane?",
    a: "Áno. Farebné prevedenie stojana, meno psíka aj farbu písmen vieme dohodnúť individuálne podľa možností konkrétnej výroby.",
  },
  {
    q: "Ako sa stojan udržiava?",
    a: "Povrch je ošetrený pre jednoduchšiu údržbu a bežnú vlhkosť okolo misiek. Stojan stačí utrieť vlhkou handričkou a nerezové misky sa dajú jednoducho vybrať a umyť.",
  },
  {
    q: "Ako dlho trvá výroba?",
    a: "Každý stojan vyrábame ručne a často na mieru, preto termín výroby potvrdíme individuálne pri objednávke podľa aktuálnej vyťaženosti a zvoleného prevedenia.",
  },
];

const SIZE_OPTIONS: Array<{ value: StandSize; label: string; detail: string }> = [
  { value: "small", label: "S verzia", detail: "cca 40 × 20 cm · výška nôh do 15 cm · 40 €" },
  { value: "large", label: "M verzia", detail: "cca 60 × 30 cm · výška nôh 20–35 cm · 45 €" },
  { value: "extra_large", label: "L verzia", detail: "Rozmer a cena na individuálnu dohodu" },
];

const COLOR_OPTIONS: Array<{ value: StandColor; label: string }> = [
  { value: "natural", label: "Svetlé" },
  { value: "dark", label: "Tmavé" },
  { value: "white", label: "Biela" },
  { value: "custom", label: "Iná" },
];

const LETTER_OPTIONS: Array<{ value: LetterColor; label: string }> = [
  { value: "light", label: "Svetlé" },
  { value: "dark", label: "Tmavé" },
  { value: "black", label: "Čierne" },
  { value: "custom", label: "Iné" },
];

export const Route = createFileRoute("/stojan-na-misky-pre-psa")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Drevený stojan na misky pre psa od Chvostíkova" },
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
          "@graph": [
            {
              "@type": "Product",
              name: "Drevený stojan na misky pre psa",
              description,
              url: PAGE_URL,
              image: [standDark, standWhite, standMia].map((src) =>
                src.startsWith("http") ? src : `${BASE_URL}${src}`,
              ),
              brand: { "@type": "Brand", name: "Chvostíkovo" },
              material: "Drevo",
              offers: {
                "@type": "AggregateOffer",
                url: PAGE_URL,
                priceCurrency: "EUR",
                lowPrice: "40",
                highPrice: "45",
                offerCount: "2",
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: BowlStandPage,
});

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-w-0 rounded-xl border-2 px-1 py-2 text-center text-[10px] font-semibold leading-tight transition sm:rounded-full sm:px-3 sm:text-xs ${
            value === option.value
              ? "border-coral bg-coral-soft/25 text-forest"
              : "border-forest/10 bg-background text-forest/70"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BowlStandPage() {
  const submissionId = useRef(crypto.randomUUID());
  const submissionInFlight = useRef(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [size, setSize] = useState<StandSize>("small");
  const [color, setColor] = useState<StandColor>("dark");
  const [dogHeight, setDogHeight] = useState("");
  const [nameOnStand, setNameOnStand] = useState("");
  const [letterColor, setLetterColor] = useState<LetterColor>("light");
  const [orderOpen, setOrderOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [configError, setConfigError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function sendInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current || isSubmitted) return;

    const height = Number(dogHeight.replace(",", "."));
    if (!Number.isFinite(height) || height < 10 || height > 120) {
      setConfigError("Zadajte, prosím, výšku psíka v kohútiku v centimetroch.");
      return;
    }

    setConfigError("");
    submissionInFlight.current = true;
    setIsSubmitting(true);
    try {
      const fd = new FormData(event.currentTarget);
      await submitProductInquiry({
        client_submission_id: submissionId.current,
        product_type: "stand",
        customer_name: String(fd.get("customer_name") ?? "").trim(),
        phone: phoneFromForm(event.currentTarget, "stand-phone"),
        email: String(fd.get("email") ?? "").trim(),
        customer_location: String(fd.get("customer_location") ?? "").trim(),
        source_ref: "/stojan-na-misky-pre-psa",
        consent: true,
        company,
        configuration: {
          size,
          color,
          dog_height_cm: height,
          name_on_stand: nameOnStand,
          letter_color: letterColor,
        },
      });
      setIsSubmitted(true);
    } catch {
      setConfigError("Dopyt sa nepodarilo odoslať. Skúste to, prosím, znova o chvíľu.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  function openOrderOptions(nextSize?: StandSize) {
    if (nextSize) setSize(nextSize);
    setStep(1);
    setConfigError("");
    setOrderOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header homeSectionLinks />
      <main>
        <section id="konfigurator" className="scroll-mt-24 relative overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pt-32">
          <div className="absolute -top-24 -right-24 size-80 rounded-full bg-coral-soft/40 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4">
            <a href="/produkty"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest/65 transition-colors hover:text-coral">
              <ArrowLeft className="size-4" /> Späť na produkty
            </a>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl leading-[1.06] text-forest sm:text-5xl">
                Drevený stojan na <span className="text-coral-dark">misky pre psa</span>
              </h1>
              <p className="mt-4 leading-relaxed text-forest/80 sm:text-lg">
                Vyberte si variant a objednajte si stojan pre svojho psíka.
              </p>
            </div>
            <StandVariantCards onInterest={openOrderOptions} />
            <div className="mx-auto mt-4 max-w-xl"><ProductDeliveryDetails /></div>
            <p className="mt-2 text-center text-sm text-forest/60 md:hidden">
              Potiahnite do strany a porovnajte všetky tri varianty.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20" aria-labelledby="stand-value-heading">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Pri každodennom používaní
              </p>
              <h2 id="stand-value-heading" className="section-title mt-2 text-3xl sm:text-4xl">
                Tri praktické výhody stojana
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                [
                  Check,
                  "Misky majú svoje miesto",
                  "Drevený podstavec drží obe misky pohromade, aby sa pri jedle neposúvali samostatne po podlahe.",
                ],
                [
                  Droplets,
                  "Po jedle rýchlo upratané",
                  "Nerezové misky vyberiete a umyjete osobitne; ošetrený povrch stačí utrieť vlhkou handričkou.",
                ],
                [
                  Ruler,
                  "Výšku nemusíte odhadovať",
                  "Stačí nám výška psíka v kohútiku. Vhodnú výšku stojana doladíme pri vybavovaní dopytu.",
                ],
              ].map(([Icon, heading, text]) => {
                const CardIcon = Icon as typeof Check;
                return (
                  <article key={String(heading)} className="rounded-3xl bg-card p-6 shadow-card">
                    <CardIcon aria-hidden="true" className="size-5 text-coral" />
                    <h3 className="mt-3 text-lg text-forest">{String(heading)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest/75">{String(text)}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-7 text-center">
              <a href="/blog/stojan-na-misky-pre-psa-vyhody-a-vyber/" className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold text-coral-dark underline underline-offset-4 hover:text-forest">
                Ako vybrať stojan a na čo si dať pozor?
                <ChevronRight aria-hidden="true" className="size-4" />
              </a>
            </p>
          </div>
        </section>

        <section className="bg-forest py-14 text-cream sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-12">
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-coral-soft uppercase">
                Ručná výroba
              </p>
              <h2 className="mt-2 text-3xl text-cream sm:text-4xl">
                Každý stojan prejde našimi rukami
              </h2>
              <div className="mt-5 space-y-4 leading-relaxed text-cream/85">
                <p>
                  Stojany nevyrábame ako anonymný sériový produkt. Každý kus skladáme a dokončujeme
                  ručne, preto vieme upraviť jeho výšku, farebné prevedenie aj personalizáciu.
                </p>
                <p>
                  Drevený povrch má vodeodolnú úpravu pre bežné kvapky vody pri pití.
                  Jednoducho sa utiera vlhkou handričkou, no nie je určený na dlhodobé máčanie.
                  Dve vyberateľné nerezové misky sú súčasťou každého stojana.
                </p>
              </div>
            </div>
            <img
              src={standWhite}
              alt="Biely ručne vyrábaný stojan na misky"
              loading="lazy"
              className="h-80 w-full rounded-4xl object-cover shadow-soft"
              style={{ objectPosition: "50% 62%" }}
            />
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Naše realizácie
              </p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">
                Spokojní štvornohí klienti
              </h2>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">
                Niekoľko hotových prevedení. Ďalšie farby a realizácie budeme postupne dopĺňať.
              </p>
            </div>
            <div className="mt-9">
              <StandGalleryLoop />
            </div>
          </div>
        </section>

        <section className="bg-secondary/55 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
              Vytvorte si svoj stojan
            </p>
            <h2 className="section-title mt-2 text-3xl sm:text-4xl">
              Vyberte si prevedenie a objednajte
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">
              Rozmer, farbu, výšku psíka aj personalizáciu si nastavíte priamo hore pri produkte.
            </p>
            <button
              type="button"
              onClick={() => openOrderOptions()}
              className="btn-coral mt-6 inline-flex items-center gap-2"
            >
              Objednať <ChevronRight className="size-4" />
            </button>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
                Máte otázku?
              </p>
              <h2 className="section-title mt-2 text-3xl sm:text-4xl">Časté otázky o stojanoch</h2>
            </div>
            <div className="mt-9 space-y-3">
              {FAQ.map((item) => (
                <Collapse key={item.q} title={item.q}>
                  <p>{item.a}</p>
                </Collapse>
              ))}
            </div>
          </div>
        </section>
      </main>
      <FormDialog open={orderOpen} onOpenChange={setOrderOpen}
        title="Mám záujem o stojan"
        subtitle="V troch krátkych krokoch vyberte stojan, personalizáciu a kontaktné údaje.">
        {isSubmitted ? (
          <div role="status" className="rounded-3xl bg-secondary/70 px-5 py-8 text-center">
            <Check className="mx-auto size-7 text-coral" />
            <p className="mt-3 font-display text-xl font-bold text-forest">
              Ďakujeme za váš záujem 🐶 Ozveme sa vám hneď, ako to bude možné.
            </p>
          </div>
        ) : (
          <ProductInquirySteps step={step} onStepChange={(next) => { setStep(next); setConfigError(""); }}
            titles={["Rozmer stojana", "Personalizácia", "Kontakt"]}
            stepOne={(
              <div>
                <div data-stand-size-picker="inquiry" className="grid grid-cols-3 gap-2">
                  {SIZE_OPTIONS.map((option) => (
                    <button key={option.value} type="button" onClick={() => setSize(option.value)}
                      aria-pressed={size === option.value}
                      className={size === option.value
                        ? "min-w-0 rounded-2xl border-2 border-coral bg-coral-soft/25 p-2 text-left"
                        : "min-w-0 rounded-2xl border-2 border-forest/10 bg-background p-2 text-left"}>
                      <span className="block font-display text-sm font-bold text-forest">{option.label}</span>
                      <span className="mt-1 block text-[11px] leading-snug text-forest/65">{option.detail}</span>
                    </button>
                  ))}
                </div>
                <label className="mt-5 block font-display text-sm font-bold text-forest">
                  Výška psíka v kohútiku *
                  <div className="relative mt-2">
                    <input value={dogHeight} onChange={(event) => { setDogHeight(event.target.value); setConfigError(""); }}
                      inputMode="decimal" aria-required="true" placeholder="napr. 58"
                      className="w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 pr-12 font-sans text-base font-normal outline-none focus:border-coral" />
                    <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-forest/50">cm</span>
                  </div>
                  <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                    Zadajte výšku psíka, nie výšku nôh stojana.
                  </span>
                </label>
              </div>
            )}
            stepTwo={(
              <div className="space-y-5">
                <div>
                  <p className="font-display text-sm font-bold text-forest">Farba stojana</p>
                  <ChoiceGrid options={COLOR_OPTIONS} value={color}
                    onChange={(value) => setColor(value as StandColor)} />
                </div>
                <label className="block font-display text-sm font-bold text-forest">
                  Meno na stojane (voliteľné)
                  <input value={nameOnStand} onChange={(event) => setNameOnStand(event.target.value.slice(0, 24))}
                    placeholder="napr. Bella" maxLength={24}
                    className="mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral" />
                  <span className="mt-1 block font-sans text-xs font-normal text-forest/55">
                    Ak meno nechcete, nechajte pole prázdne.
                  </span>
                </label>
                <div>
                  <p className="font-display text-sm font-bold text-forest">Farba písmen</p>
                  <ChoiceGrid options={LETTER_OPTIONS} value={letterColor}
                    onChange={(value) => setLetterColor(value as LetterColor)} />
                </div>
              </div>
            )}
            stepThree={(
              <ProductInquiryContact phoneId="stand-phone"
                customerName={customerName} setCustomerName={setCustomerName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                company={company} setCompany={setCompany} />
            )}
            onNext={() => {
              const height = Number(dogHeight.replace(",", "."));
              const valid = dogHeight.trim().length > 0 && Number.isFinite(height) && height >= 10 && height <= 120;
              setConfigError(valid ? "" : "Zadajte výšku psíka v kohútiku v cm (10 až 120).");
              return valid;
            }}
            onSubmit={sendInquiry} error={configError} submitting={isSubmitting} />
        )}
      </FormDialog>
      <Footer />
    </div>
  );
}
