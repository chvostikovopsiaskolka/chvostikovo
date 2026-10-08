import { PawPrint } from "lucide-react";

type SectionAmbientPawsProps = {
  tone?: "light" | "dark";
};

const PAWS = [
  { pos: "top-[10%] left-[5%]", size: "size-7 sm:size-9", rotate: "-rotate-12" },
  { pos: "top-[24%] right-[7%]", size: "size-6 sm:size-8", rotate: "rotate-[18deg]" },
  { pos: "top-[54%] left-[11%]", size: "size-5 sm:size-7", rotate: "rotate-[26deg]" },
  { pos: "bottom-[18%] right-[13%]", size: "size-7 sm:size-10", rotate: "-rotate-[18deg]" },
  { pos: "bottom-[8%] left-[42%]", size: "size-5 sm:size-7", rotate: "rotate-12" },
] as const;

export function SectionAmbientPaws({ tone = "light" }: SectionAmbientPawsProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {PAWS.map((paw, index) => (
        <PawPrint
          key={index}
          className={`absolute ${paw.pos} ${paw.size} ${paw.rotate} ${
            tone === "dark"
              ? "text-white/10"
              : index % 2 === 0
                ? "text-coral/10"
                : "text-forest/8"
          }`}
        />
      ))}
    </div>
  );
}
