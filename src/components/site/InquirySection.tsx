import { Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import { ShortForm } from "./Forms";

export function InquirySection() {
  return (
    <section id="informujte-sa" className="scroll-mt-24 bg-card pb-10 lg:hidden">
      <div className="mx-auto max-w-2xl px-4">
        <div className="min-w-0 rounded-4xl bg-secondary/70 p-6 shadow-soft ring-1 ring-coral/15 sm:p-8">
          <h3 className="text-center text-2xl text-forest">Informujte sa o škôlke..</h3>
          <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
            Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií.
          </p>

          <ShortForm />

          <a
            href={`tel:${PHONE}`}
            className="btn-coral mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
          >
            <Phone className="size-4" /> Zavolajte nám
          </a>
        </div>
      </div>
    </section>
  );
}
