import { MAP_LINK } from "@/content/site";
import arrivalMap from "@/assets/chvostikovo-prijazd.webp";

/** Static local image, never a third-party iframe. The destination is the existing business pin.
 * The illustration is approximate; the click opens the authoritative business location. */
export function DaycareArrivalMap({ className = "", onOpen }: { className?: string; onOpen?: () => void }) {
  return (
    <a data-daycare-arrival-map href={MAP_LINK} target="_blank" rel="noopener noreferrer"
      onClick={onOpen} aria-label="Orientačná mapa príjazdu – Chvostíkovo, Poľská 6, Košice. Otvoriť v Google Maps (nová karta)"
      className={"relative block min-w-0 overflow-hidden rounded-3xl bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral " + className}>
      <img src={arrivalMap} width={1536} height={1024} loading="lazy" decoding="async"
        alt="Orientačná ilustrovaná mapa príjazdu po Poľskej od Rastislavovej, zastávka Poľská (12, 54), parkovisko pri škôlke"
        className="block h-auto w-full object-contain lg:h-full" />
      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-forest">Orientačná mapa</span>
    </a>
  );
}
