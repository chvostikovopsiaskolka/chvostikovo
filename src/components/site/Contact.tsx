import { MapPin, Mail, Phone, Clock, Instagram, Facebook } from "lucide-react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { PHONE, PHONE_PRETTY, EMAIL, MAP_LINK, INSTAGRAM, FACEBOOK } from "@/content/site";
import { LongForm } from "./Forms";

export function Contact() {
  return (
    <section id="kontakt" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4">
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

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <ContactRow icon={<MapPin className="size-5" />} label="Adresa">
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="hover:text-coral">
              Poľská 6, 040 01 Košice
            </a>
          </ContactRow>
          <ContactRow icon={<Phone className="size-5" />} label="Telefón">
            <a href={`tel:${PHONE}`} className="hover:text-coral">
              {PHONE_PRETTY}
            </a>
          </ContactRow>
          <ContactRow icon={<Mail className="size-5" />} label="E-mail">
            <a href={`mailto:${EMAIL}`} className="break-all hover:text-coral">
              {EMAIL}
            </a>
          </ContactRow>
          <ContactRow icon={<Clock className="size-5" />} label="Otváracie hodiny">
            Pondelok – piatok, 7:00 – 17:00
          </ContactRow>
        </div>

        <div className="mt-8 overflow-hidden rounded-4xl shadow-card">
          <iframe
            title="Mapa – Chvostíkovo, Poľská 6, Košice"
            src="https://www.google.com/maps?q=Po%C4%BEsk%C3%A1%206,%20Ko%C5%A1ice&output=embed"
            loading="lazy"
            className="h-72 w-full border-0"
          />
        </div>
      </div>
    </section>
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

export function Footer() {
  return (
    <footer className="bg-forest py-10 text-cream/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <img
          src={logo}
          alt="Chvostíkovo psia škôlka"
          className="h-8 w-auto brightness-0 invert opacity-90"
        />
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">
            Psia škôlka Chvostíkovo · Poľská 6, Košice ·{" "}
            <a href={`tel:${PHONE}`} className="font-semibold text-cream hover:text-coral-soft">
              {PHONE_PRETTY}
            </a>
          </p>
          <div className="flex items-center gap-2">
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
        <p className="text-xs">
          © {new Date().getFullYear()} Chvostíkovo ·{" "}
          <Link to="/cookies" className="underline hover:text-cream">
            Cookies
          </Link>{" "}
          ·{" "}
          <Link to="/ochrana-osobnych-udajov" className="underline hover:text-cream">
            Ochrana osobných údajov
          </Link>
        </p>

      </div>
    </footer>
  );
}
