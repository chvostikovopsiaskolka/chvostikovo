import { LeadFormIntro } from "./LeadFormIntro";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { trackMarketingInteraction } from "@/lib/analytics";
import { LeadStepForm } from "./LeadStepForm";
import { SectionAmbientPaws } from "./SectionAmbientPaws";
import { FormDialog } from "./FormDialog";
import { SchoolmatesFormCrown } from "./SchoolmatesFormCrown";

const INFO_TITLE = "Čo hľadáte pre svojho psíka?";
const INFO_SUBTITLE =
  "Vyplňte krátky nezáväzný formulár. Ozveme sa vám.";

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
        <LeadStepForm questionInHeading trackingSource="after_video" />
      </FormDialog>
    </section>
  );
}

export function InquirySection({ allScreens = false, matchHero = false, id = "informujte-sa", trackingSource = "care_inline_mobile", title = INFO_TITLE, subtitle = INFO_SUBTITLE }: {
  allScreens?: boolean; matchHero?: boolean; id?: string; trackingSource?: string; title?: string; subtitle?: string;
} = {}) {
  return (
    <section id={id} className={"relative scroll-mt-24 bg-card pt-0 pb-10 " + (allScreens ? "" : "lg:hidden")}>
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        <SchoolmatesFormCrown compact={matchHero} groundAccent={!matchHero} />

        <div data-lead-form-shell data-home-inquiry-card={matchHero || undefined} className={matchHero
          ? "form-liquid-surface min-w-0 rounded-4xl border border-white/50 bg-card px-8 pt-9 pb-8 shadow-soft ring-1 ring-forest/8"
          : "form-liquid-surface relative z-0 min-w-0 rounded-4xl bg-secondary/70 px-6 pt-12 pb-6 shadow-soft ring-1 ring-coral/15 sm:px-8 sm:pt-14 sm:pb-8"}>
          <h3 data-lead-form-intro className={"text-center text-forest " + (matchHero ? "text-xl" : "text-2xl")}>{title}</h3>
          <p data-lead-form-intro className="mt-2 mb-5 text-center text-sm leading-relaxed text-muted-foreground">
            {subtitle && <LeadFormIntro text={subtitle} />}
          </p>

          <LeadStepForm questionInHeading trackingSource={trackingSource} />

        </div>
      </div>
    </section>
  );
}
