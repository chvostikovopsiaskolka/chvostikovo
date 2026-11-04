import standMia from "@/assets/products/stand-mia.avif";
import standCori from "@/assets/products/stand-cori.avif";
import standWoody from "@/assets/products/stand-woody.avif";
import { EdgePhotoCarousel, type EdgeCarouselPhoto } from "./EdgePhotoCarousel";

const STANDS: readonly EdgeCarouselPhoto[] = [
  { src: standMia, alt: "Ručne vyrábaný drevený stojan MIA s menom psíka", position: "50% 56%" },
  { src: standCori, alt: "Tmavý drevený stojan CORI s nerezovými miskami", position: "50% 56%" },
  { src: standWoody, alt: "Biely drevený stojan WOODY s nerezovými miskami", position: "50% 56%" },
];

/** Exactly one MIA, CORI and WOODY, moving back and forth without cloned slides. */
export function StandGalleryLoop() {
  return (
    <EdgePhotoCarousel
      photos={STANDS}
      label="Galéria MIA, CORI a WOODY – fotografie sa pomaly posúvajú do strán"
      dataName="stand"
    />
  );
}
