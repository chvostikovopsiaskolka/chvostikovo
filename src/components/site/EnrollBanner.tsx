import { useState } from "react";
import { FormDialog } from "./FormDialog";
import { ShortForm } from "./Forms";

export function EnrollBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section className="px-4 pt-10 pb-10 sm:pt-14 sm:pb-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-4xl bg-secondary/70 px-5 py-6 text-center shadow-soft sm:px-10 sm:py-8 md:flex-row md:justify-between md:text-left">
        <div className="max-w-3xl">
          <h2 className="font-display text-xl font-bold text-forest sm:text-2xl">
            🐾 Prijímame nových škôlkarov
          </h2>
          <p className="mt-2 text-sm text-forest/80 sm:text-base">
            Prijímame stredné a veľké plemená psov aj šteniatka po ukončenom povinnom očkovaní.
            Chcete zistiť, či je Chvostíkovo vhodné aj pre vášho psíka? Radi vám odpovieme na všetky
            otázky.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-coral w-full shrink-0 px-6 py-3 text-sm sm:w-auto sm:text-base"
        >
          Vyplňte nezáväzný formulár
        </button>
      </div>

      <FormDialog open={open} onOpenChange={setOpen} title="Máte záujem o škôlku?">
        <ShortForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
      </FormDialog>
    </section>
  );
}
