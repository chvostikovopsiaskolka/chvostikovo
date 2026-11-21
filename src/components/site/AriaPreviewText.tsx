import { REQUIREMENTS } from "@/content/site";

// Preview-specific copy: the published lead and other pages keep their own content.
export const ARIA_PREVIEW_REQUIREMENTS = REQUIREMENTS.map((item) => ({
  ...item,
  text: item.title === "Zdravotný stav"
    ? item.text
      .replace("klinicky zdravých psíkov bez krátkodobých či prenosných ochorení", "klinicky zdravých psíkov bez prenosných ochorení")
      .replace("Fenky počas hárania", "Sučky počas hárania")
    : item.text,
}));

const IMPORTANT = [
  "stredné a veľké psy",
  "nad 20 kg",
  "očkované šteniatka",
  "nad 15 kg",
  "Vyžadujeme očkovania, dobrý zdravotný stav a vhodnosť do kolektívu",
  "Nie každý psík si zvykne rovnako rýchlo.",
  "môžeme odporučiť ešte 2–3 kratšie návštevy",
  "Veľmi dôležité je, aby nám majiteľ o svojom psíkovi povedal pravdivo všetko – nielen to dobré.",
  "Čím lepšie psíka poznáme, tým lepšie vieme jeho prvé návštevy prispôsobiť.",
  "besnote",
  "infekčným ochoreniam",
  "kotercovému kašľu",
  "Pred nástupom do škôlky",
  "každý nový psík",
  "vstupnú návštevu",
  "očkovací preukaz",
  "povinnými vakcínami",
  "pravidelne odčervovaný",
  "nekonfliktný voči iným psom aj ľuďom",
  "Neprijímame agresívne psy",
  "psy označené ako nebezpečné alebo ťažko zvládnuteľné v kolektíve",
  "základné hygienické návyky",
  "klinicky zdravých psíkov bez prenosných ochorení",
  "V prípade chronických ochorení nás prosím informujte vopred",
  "Sučky počas hárania",
  "celodenným dohľadom",
  "minimálne dvaja skúsení opatrovatelia",
  "úvodná návšteva",
  "prvú návštevu",
  "základné podmienky",
].sort((a, b) => b.length - a.length);

const escapeRx = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const importantRx = new RegExp("(" + IMPORTANT.map(escapeRx).join("|") + ")", "gi");
const importantSet = new Set(IMPORTANT.map((phrase) => phrase.toLocaleLowerCase("sk")));

export function AriaHighlightedText({ text }: { text: string }) {
  return <>{text.split(importantRx).map((part, i) =>
    importantSet.has(part.toLocaleLowerCase("sk"))
      ? <strong key={i} className="font-bold text-forest">{part}</strong>
      : part
  )}</>;
}
