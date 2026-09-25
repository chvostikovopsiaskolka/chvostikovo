import { useState } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { ShortForm } from "./Forms";
import { FormDialog } from "./FormDialog";

const INFO_TITLE = "Informujte sa o škôlke";
const INFO_SUBTITLE =
  "Vyplňte nezáväzný formulár. Ozveme sa vám späť do 24 hodín a radi s vami preberieme viac informácií.";

export function InquiryCtaSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-card py-7 lg:hidden">
      <div className="mx-auto flex max-w-2xl justify-center px-4">
        <button
          type="button"
          onClick={() => {
            trackMarketingInteraction("inquiry_cta", "after_video");
            setOpen(true);
          }}
          className="btn-coral inline-flex items-center justify-center gap-2 px-6 py-3 text-center"
        >
          Chcem sa informovať o škôlke
          <ChevronRight className="size-4" />
        </button>
      </div>

      <FormDialog open={open} onOpenChange={setOpen} title={INFO_TITLE} subtitle={INFO_SUBTITLE}>
        <ShortForm
          trackingSource="after_video"
          onSent={() => setTimeout(() => setOpen(false), 2200)}
        />
      </FormDialog>
    </section>
  );
}

export function InquirySection() {
  return (
    <section id="informujte-sa" className="scroll-mt-24 bg-card py-10 lg:hidden">
      <div className="mx-auto max-w-2xl px-4">
        <div className="min-w-0 rounded-4xl bg-secondary/70 p-6 shadow-soft ring-1 ring-coral/15 sm:p-8">
          <h3 className="text-center text-2xl text-forest">Informujte sa o škôlke..</h3>
          <p className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
            {INFO_SUBTITLE}
          </p>

          <ShortForm trackingSource="care_inline_mobile" />

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
