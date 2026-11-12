import { ChevronRight, CircleHelp, Star, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DELIVERY_OPTIONS = [
  {
    location: "Košice",
    description: "Osobný dovoz v rámci mesta.",
    price: "Zadarmo",
  },
  {
    location: "Okolie Košíc a Prešov",
    description: "Osobný dovoz po dohode.",
    price: "5 €",
  },
  {
    location: "Vzdialenejšie lokality",
    description: "Doručenie podľa možností a aktuálneho cenníka kuriérskej spoločnosti.",
    price: "Individuálne",
  },
];

/** Zdieľané informácie o recenziách a doprave na oboch produktových detailoch. */
export function ProductDeliveryDetails({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mt-4">
      {!compact && <div className="flex items-center gap-1.5 whitespace-nowrap">
        <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-0.5 text-coral-dark">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="size-2.5 min-[375px]:size-3 sm:size-3.5" strokeWidth={1.8} />
          ))}
        </span>
        <span className="text-[10px] font-medium text-forest/70 min-[375px]:text-xs sm:text-sm">
          Recenzie spokojných zákazníkov čoskoro
        </span>
      </div>}

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={compact ? "mt-2 inline-flex min-h-10 items-center gap-1.5 font-display text-xs font-semibold text-coral-dark underline underline-offset-4 transition hover:text-forest focus-visible:outline-2 focus-visible:outline-coral" : "mt-4 inline-flex items-center gap-2 rounded-2xl border border-forest/15 bg-card px-4 py-3 font-display text-sm font-semibold text-forest shadow-card transition hover:border-coral/50 hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"}
          >
            {compact ? <CircleHelp aria-hidden="true" className="size-4" /> : <Truck aria-hidden="true" className="size-4 text-coral-dark" />}
            Ako je to s doručením?
            {!compact && <ChevronRight aria-hidden="true" className="size-4 text-forest/55" />}
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-forest/10 bg-background p-5 shadow-soft sm:max-w-lg sm:p-7">
          <DialogHeader className="pr-7 text-left">
            <DialogTitle className="font-display text-2xl leading-tight text-forest">
              Doprava a doručenie
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed text-forest/70">
              Stojany aj targety doručujeme osobne v Košiciach a okolí. Do vzdialenejších lokalít vieme dohodnúť doručenie kuriérom.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-forest/10 overflow-hidden rounded-2xl border border-forest/10 bg-card">
            {DELIVERY_OPTIONS.map((option) => (
              <div key={option.location} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <p className="font-display text-sm font-bold text-forest">{option.location}</p>
                  <p className="mt-1 text-xs leading-relaxed text-forest/65">{option.description}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold text-coral-dark">
                  {option.price}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-forest/60">
            Spôsob doručenia a prípadnú cenu kuriéra vám potvrdíme vopred pri vybavovaní dopytu.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
