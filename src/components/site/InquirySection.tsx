import { useState } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { PHONE } from "@/content/site";
import { trackMarketingInteraction } from "@/lib/analytics";
import { ShortForm } from "./Forms";
import { FormDialog } from "./FormDialog";
import schoolmatesCta from "@/assets/skolkari-web-4.png";

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
    <section id="informujte-sa" className="scroll-mt-24 bg-card pt-0 pb-10 lg:hidden">
      <div className="mx-auto max-w-2xl px-4">
        <div
          className="relative z-10 mx-auto -mb-8 h-[142px] w-full max-w-[500px] overflow-hidden sm:h-[165px]"
          aria-hidden="true"
        >
          <img
            src={schoolmatesCta}
            alt=""
            loading="lazy"
            decoding="async"
            width={1200}
            height={630}
            className="absolute inset-x-0 bottom-[-14px] h-[185px] w-full scale-[1.07] object-cover object-bottom sm:h-[210px] sm:scale-[1.06]"
          />
        </div>

        <div className="relative z-0 min-w-0 rounded-4xl bg-secondary/70 px-6 pt-12 pb-6 shadow-soft ring-1 ring-coral/15 sm:px-8 sm:pt-14 sm:pb-8">
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
