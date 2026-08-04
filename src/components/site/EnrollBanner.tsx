import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShortForm } from "./Forms";

export function EnrollBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section className="px-4 pb-10 sm:pb-14">
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
          Chcem sa informovať
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border-none bg-card p-5 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-left font-display text-lg text-forest sm:text-xl">
              Máte záujem o škôlku?
            </DialogTitle>
          </DialogHeader>
          <ShortForm onSent={() => setTimeout(() => setOpen(false), 2200)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
