import standMia from "@/assets/products/stand-mia.avif";
import standCori from "@/assets/products/stand-cori.avif";
import standWoody from "@/assets/products/stand-woody.avif";
import standMlyncek from "@/assets/products/stand-mlyncek.avif";
import standAron from "@/assets/products/stand-aron.avif";
import standLoki from "@/assets/products/stand-loki.avif";
import standPlanetky from "@/assets/products/stand-planetky.avif";
import standAloy from "@/assets/products/stand-aloy.avif";
import standFeedingDog from "@/assets/products/stand-psik-pri-miskach.avif";
import standMaya from "@/assets/products/stand-maya.avif";
import standGael from "@/assets/products/stand-gael.avif";
import standLara from "@/assets/products/stand-lara.avif";
import standSafira from "@/assets/products/stand-safira.avif";
import standRose from "@/assets/products/stand-rose-hq.webp";
import standBuncaLinden from "@/assets/products/stand-bunca-linden-hq.webp";
import standArcanaAiden from "@/assets/products/stand-arcana-aiden-hq.webp";
import { EdgePhotoCarousel, type EdgeCarouselPhoto } from "./EdgePhotoCarousel";

const STANDS: readonly EdgeCarouselPhoto[] = [
  { src: standMia, alt: "Ručne vyrábaný drevený stojan MIA s menom psíka", position: "50% 56%", caption: "MIA" },
  { src: standCori, alt: "Tmavý drevený stojan CORI s nerezovými miskami", position: "50% 56%", caption: "CORI" },
  { src: standWoody, alt: "Biely drevený stojan WOODY s nerezovými miskami", position: "50% 56%", caption: "WOODY" },
  { src: standMlyncek, alt: "Svetlý drevený stojan MLYNČEK s dvoma nerezovými miskami", position: "50% 58%", caption: "MLYNČEK" },
  { src: standAron, alt: "Detail tmavého dreveného stojana ARON s menom psíka", position: "50% 58%", caption: "ARON" },
  { src: standLoki, alt: "Tmavý drevený stojan LOKI na dve misky", position: "50% 56%", caption: "LOKI" },
  { src: standPlanetky, alt: "Svetlý drevený stojan PLANÉTKY s nerezovými miskami", position: "50% 58%", caption: "PLANÉTKY" },
  { src: standAloy, alt: "Drevený stojan ALOY s hnedým psom pri miskách", position: "50% 55%", caption: "ALOY" },
  { src: standFeedingDog, alt: "Pes používa vyvýšený drevený stojan s dvoma nerezovými miskami", position: "50% 54%", caption: "STOJAN V PRAXI" },
  { src: standMaya, alt: "Detail svetlého dreveného stojana MAYA s vyrezávaným menom", position: "50% 55%", caption: "MAYA" },
  { src: standGael, alt: "Svetlý drevený stojan GAEL s dvoma miskami a psom", position: "50% 56%", caption: "GAEL" },
  { src: standLara, alt: "Biely stojan na misky LARA v exteriéri", position: "50% 55%", caption: "LARA" },
  { src: standSafira, alt: "Biely drevený stojan SAFIRA s nerezovými miskami", position: "50% 55%", caption: "SAFIRA" },
  { src: standRose, alt: "Biely drevený stojan na misky ROSE pre veľkého psa", position: "50% 53%", caption: "ROSE" },
  { src: standBuncaLinden, alt: "Drevený stojan na misky s menami BUNCA a LINDEN", position: "50% 55%", caption: "BUNCA & LINDEN" },
  { src: standArcanaAiden, alt: "Drevený stojan na misky s menami ARCANA a AIDEN pri írskom vlkodavovi", position: "50% 52%", caption: "ARCANA & AIDEN" },
];

/** One photo per realization, shared between product detail and blog guide. */
export function StandGalleryLoop() {
  return (
    <EdgePhotoCarousel
      photos={STANDS}
      label="Galéria našich realizácií drevených stojanov – fotografie sa pomaly posúvajú do strán"
      dataName="stand"
    />
  );
}
