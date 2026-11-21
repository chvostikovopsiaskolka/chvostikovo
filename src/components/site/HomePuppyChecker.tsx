import { useState } from "react";
import { AriaPuppyChecker } from "./AriaPuppyChecker";
import { LeadStepForm, LEAD_STEP_INTERESTS } from "./LeadStepForm";
import { FormDialog } from "./FormDialog";
import type { PuppyCheckInput } from "@/lib/inquiry";
import { trackMarketingInteraction } from "@/lib/analytics";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

/**
 * Reuse the already approved age/vaccination checker on the main website.
 * Breed is collected once in the shared enquiry; no lead is created until
 * the visitor accepts the privacy terms and submits the actual form.
 */
export function HomePuppyChecker() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("home_puppy_checker_eligible");
  const [answers, setAnswers] = useState<PuppyCheckInput | undefined>(undefined);
  const [preset, setPreset] = useState<string | undefined>(undefined);

  const continueToContact = (details: PuppyCheckInput, informationOnly = false) => {
    const nextSource = informationOnly ? "home_puppy_checker_info" : "home_puppy_checker_eligible";
    trackMarketingInteraction("inquiry_cta", nextSource);
    void trackCookielessInteraction("inquiry_cta", nextSource);
    setSource(nextSource);
    setAnswers(details);
    // The Edge API requires one of the existing allowlisted interests.
    setPreset(informationOnly ? LEAD_STEP_INTERESTS[0].value : "Mám záujem o škôlku pre šteniatko");
    setOpen(true);
  };

  return (
    <>
      <div data-home-puppy-checker>
        <AriaPuppyChecker
          trackingSource="home_puppy_checker"
          onInterest={(details) => continueToContact(details)}
          onInfo={(details) => continueToContact(details, true)}
        />
      </div>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Čo hľadáte pre svojho psíka?"
        subtitle="Vyplňte krátky nezáväzný formulár. Ozveme sa vám."
      >
        <LeadStepForm
          key={source}
          questionInHeading
          ariaPreview
          trackingSource={source}
          presetInterest={preset}
          puppyCheck={answers}
        />
      </FormDialog>
    </>
  );
}
