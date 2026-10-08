import { useEffect, useState } from "react";
import { MapPin, Mail, Phone, Clock, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";
import { PHONE, PHONE_PRETTY, EMAIL, MAP_LINK, INSTAGRAM, FACEBOOK } from "@/content/site";
import { LongForm } from "./Forms";
import { EnglishInquiryForm } from "./EnglishInquiryForm";
import { LegalDialog, type LegalDialogType } from "./LegalDialog";
import { hasFunctionalConsent } from "@/lib/consent";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

export function Contact() {
  return (
    <section id="kontakt" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h2 className="section-title text-3xl leading-tight sm:text-4xl">
            Prihlás svojho psíka ešte dnes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-forest/80">
            Vyplňte formulár, v ktorom nám poviete viac o vašom psíkovi. Následne sa vám ozveme a dohodneme ďalší postup pri jeho prihlásení do škôlky.
          </p>
        </div>

        <div className="mt-8 rounded-4xl bg-card p-6 shadow-soft sm:p-9">
          <LongForm />
        </div>

        <ContactDetails language="sk" />
      </div>
    </section>
  );
}

export function EnglishContact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h2 className="section-title text-3xl leading-tight sm:text-4xl">
            Enquire about dog daycare
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-forest/80">
            Fill in the short, non-binding form. We will get back to you and talk through how Chvostíkovo works and whether daycare is a good fit for your dog.
          </p>
        </div>

        <div className="mt-8 rounded-4xl bg-card p-6 shadow-soft sm:p-9">
          <EnglishInquiryForm trackingSource="en_contact" />
        </div>

        <ContactDetails language="en" />
      </div>
    </section>
  );
}

function ContactDetails({ language }: { language: "sk" | "en" }) {
  const isEnglish = language === "en";

  return (
    <>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <ContactRow icon={<MapPin className="size-5" />} label={isEnglish ? "Address" : "Adresa"}>
          <a href={MAP_LINK} target="_blank" rel="noreferrer" className="hover:text-coral">
            Poľská 6, 040 01 Košice
          </a>
        </ContactRow>
        <ContactRow icon={<Phone className="size-5" />} label={isEnglish ? "Phone" : "Telefón"}>
          <a href={`tel:${PHONE}`} className="hover:text-coral">
            {PHONE_PRETTY}
          </a>
        </ContactRow>
        <ContactRow icon={<Mail className="size-5" />} label={isEnglish ? "Email" : "E-mail"}>
          <a href={`mailto:${EMAIL}`} className="break-all hover:text-coral">
            {EMAIL}
          </a>
        </ContactRow>
        <ContactRow icon={<Clock className="size-5" />} label={isEnglish ? "Opening hours" : "Otváracie hodiny"}>
          {isEnglish ? "Monday – Friday, 7:00 – 17:00" : "Pondelok – piatok, 7:00 – 17:00"}
        </ContactRow>
      </div>

      <FunctionalMap language={language} />
    </>
  );
}

function FunctionalMap({ language }: { language: "sk" | "en" }) {
  const [allowed, setAllowed] = useState(false);
  const isEnglish = language === "en";

  useEffect(() => {
    function syncConsent() {
      setAllowed(hasFunctionalConsent());
    }

    syncConsent();
    window.addEventListener("chvostikovo-consent-changed", syncConsent);
    return () => window.removeEventListener("chvostikovo-consent-changed", syncConsent);
  }, []);

  if (!allowed) {
    return (
      <div className="mt-8 flex h-72 flex-col items-center justify-center rounded-4xl bg-secondary/60 px-6 text-center shadow-card">
        <MapPin className="size-8 text-coral" />
        <p className="mt-3 font-display text-lg font-bold text-forest">
          {isEnglish ? "Google Map is disabled" : "Google mapa je vypnutá"}
        </p>
        <p className="mt-1 max-w-md text-sm text-forest/70">
          {isEnglish
            ? "Allow functional cookies to load the interactive Google map."
            : "Pre načítanie interaktívnej Google mapy povoľte funkčné cookies."}
        </p>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("chvostikovo-open-cookie-settings"))
          }
          className="btn-coral mt-4"
        >
          {isEnglish ? "Open cookie settings" : "Otvoriť nastavenia cookies"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-4xl shadow-card">
      <iframe
        title={isEnglish ? "Map – Chvostíkovo, Poľská 6, Košice" : "Mapa – Chvostíkovo, Poľská 6, Košice"}
        src="https://www.google.com/maps?q=Po%C4%BEsk%C3%A1%206,%20Ko%C5%A1ice&output=embed"
        loading="lazy"
        className="h-72 w-full border-0"
      />
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-forest">
        {icon}
      </span>
      <div>
        <p className="font-display text-xs font-semibold tracking-wide text-forest/60 uppercase">
          {label}
        </p>
        <p className="font-semibold text-forest">{children}</p>
      </div>
    </div>
  );
}

export function Footer({ language = "sk" }: { language?: "sk" | "en" }) {
  const [legalDialog, setLegalDialog] = useState<LegalDialogType | null>(null);
  const isEnglish = language === "en";

  return (
    <>
      <footer className="bg-forest py-10 text-cream/80">
        <div className="mx-auto grid max-w-6xl gap-7 px-4 text-center sm:grid-cols-[auto_1fr_auto] sm:items-start sm:text-left">
          <div className="flex justify-center sm:justify-start">
            <img
              src={logo}
              alt={isEnglish ? "Chvostíkovo dog daycare" : "Chvostíkovo psia škôlka"}
              className="h-8 w-auto brightness-0 invert opacity-90"
            />
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm">
              {isEnglish ? "Chvostíkovo dog daycare" : "Psia škôlka Chvostíkovo"} · Poľská 6, Košice ·{" "}
              <a href={`tel:${PHONE}`} className="font-semibold text-cream hover:text-coral-soft">
                {PHONE_PRETTY}
              </a>
            </p>

            <p className="text-xs">
              © {new Date().getFullYear()} Chvostíkovo ·{" "}
              <button type="button" onClick={() => setLegalDialog("cookies")} className="underline hover:text-cream">
                {isEnglish ? "Cookies" : "Cookies"}
              </button>{" "}
              ·{" "}
              <button type="button" onClick={() => setLegalDialog("privacy")} className="underline hover:text-cream">
                {isEnglish ? "Privacy" : "Ochrana osobných údajov"}
              </button>{" "}
              ·{" "}
              <button type="button" onClick={() => setLegalDialog("operator")} className="underline hover:text-cream">
                {isEnglish ? "Operator details" : "Údaje prevádzkovateľa"}
              </button>{" "}
              ·{" "}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("chvostikovo-open-cookie-settings"))
                }
                className="underline hover:text-cream"
              >
                {isEnglish ? "Cookie settings" : "Nastavenia cookies"}
              </button>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Chvostíkovo"
              className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href={FACEBOOK}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook Chvostíkovo"
              className="flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-coral"
            >
              <Facebook className="size-5" />
            </a>
          </div>
        </div>
      </footer>

      <LegalDialog
        kind={legalDialog ?? "cookies"}
        open={legalDialog !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDialog(null);
        }}
        onSelect={setLegalDialog}
        language={language}
      />
    </>
  );
}
