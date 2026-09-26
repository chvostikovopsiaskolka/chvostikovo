import { useState } from "react";
import { EMAIL } from "@/content/site";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Language = "sk" | "en";

function SlovakPolicy() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-forest/85">
      <p>
        Tieto zásady vysvetľujú, ako spracovávame osobné údaje, ktoré nám poskytnete
        prostredníctvom webovej stránky chvostikovo.sk.
      </p>
      <p>
        <strong>Prevádzkovateľ:</strong> Marek Leder - Bellaris, Miškovecká 2, Košice,
        IČO: 56 447 001.
      </p>
      <div>
        <h3 className="font-display font-bold text-forest">Aké údaje spracovávame</h3>
        <p className="mt-1">
          Kontaktné údaje, najmä meno, priezvisko, telefón a údaje, ktoré nám dobrovoľne
          uvediete vo formulári. Pri používaní webu môžu byť spracúvané aj technické údaje
          o návšteve v súlade s nastavením cookies.
        </p>
      </div>
      <div>
        <h3 className="font-display font-bold text-forest">Na čo údaje používame</h3>
        <p className="mt-1">
          Na vybavenie vašej požiadavky alebo prihlášky, komunikáciu s vami, poskytovanie
          našich služieb a plnenie súvisiacich zákonných povinností. Marketingové a
          analytické spracovanie používame iba v rozsahu, v akom je naň daný príslušný
          právny základ alebo súhlas.
        </p>
      </div>
      <div>
        <h3 className="font-display font-bold text-forest">Ako dlho údaje uchovávame</h3>
        <p className="mt-1">
          Len počas obdobia potrebného na účel, na ktorý boli získané, prípadne počas
          lehoty vyžadovanej právnymi predpismi.
        </p>
      </div>
      <div>
        <h3 className="font-display font-bold text-forest">Vaše práva</h3>
        <p className="mt-1">
          Máte právo na prístup, opravu, vymazanie alebo obmedzenie spracovania údajov,
          právo na prenosnosť a v zákonom stanovených prípadoch aj právo namietať.
          Kontaktovať nás môžete na {EMAIL}.
        </p>
      </div>
      <p>
        Podrobné znenie nájdete aj na stránke{" "}
        <a
          href="/ochrana-osobnych-udajov"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-coral underline underline-offset-2"
        >
          Zásady ochrany osobných údajov
        </a>.
      </p>
    </div>
  );
}

function EnglishPolicy() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-forest/85">
      <p>
        This notice explains how we process personal data you provide through chvostikovo.sk.
      </p>
      <p>
        <strong>Operator:</strong> Marek Leder - Bellaris, Miškovecká 2, Košice,
        Company ID: 56 447 001.
      </p>
      <div>
        <h3 className="font-display font-bold text-forest">Data we process</h3>
        <p className="mt-1">
          Contact details such as your name and phone number, plus information you choose
          to provide in the form. Technical visit data may also be processed according to
          your cookie settings.
        </p>
      </div>
      <div>
        <h3 className="font-display font-bold text-forest">Why we use it</h3>
        <p className="mt-1">
          To handle your enquiry or application, communicate with you, provide our services
          and meet related legal obligations. Analytics and marketing processing is used
          only where the appropriate legal basis or consent applies.
        </p>
      </div>
      <div>
        <h3 className="font-display font-bold text-forest">Your rights</h3>
        <p className="mt-1">
          Depending on applicable law, you may request access, correction, deletion,
          restriction or portability of your data, and you may object in relevant cases.
          You can contact us at {EMAIL}.
        </p>
      </div>
      <p>
        You can also read the full{" "}
        <a
          href="/en/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-coral underline underline-offset-2"
        >
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}

export function PrivacyConsentCheckbox({
  language = "sk",
}: {
  language?: Language;
}) {
  const [open, setOpen] = useState(false);
  const isEnglish = language === "en";

  return (
    <>
      <label className="flex items-start gap-2 text-sm text-forest/80">
        <input
          type="checkbox"
          required
          className="mt-1 shrink-0 accent-[oklch(0.72_0.108_40)]"
        />
        <span>
          {isEnglish ? "I agree to the " : "Súhlasím so "}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen(true);
            }}
            className="font-semibold text-coral underline underline-offset-2 hover:text-coral-dark"
          >
            {isEnglish ? "processing of my personal data" : "spracovaním osobných údajov"}
          </button>
          . <span className="text-destructive">*</span>
        </span>
      </label>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] w-[calc(100%-1.25rem)] max-w-2xl overflow-y-auto rounded-3xl border-none bg-card p-5 shadow-2xl sm:p-7">
          <DialogHeader>
            <DialogTitle className="pr-7 font-display text-xl text-forest sm:text-2xl">
              {isEnglish ? "Privacy Policy" : "Spracovanie osobných údajov"}
            </DialogTitle>
          </DialogHeader>
          {isEnglish ? <EnglishPolicy /> : <SlovakPolicy />}
        </DialogContent>
      </Dialog>
    </>
  );
}
