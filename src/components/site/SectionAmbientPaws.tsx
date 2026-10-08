import { PawPrint } from "lucide-react";

type SectionAmbientPawsProps = {
  tone?: "light" | "dark";
};

const PAWS = [
  { pos: "top-[8%] left-[5%]", size: "size-8 sm:size-10", rotate: "-rotate-12" },
  { pos: "top-[22%] right-[7%]", size: "size-7 sm:size-9", rotate: "rotate-[18deg]" },
  { pos: "top-[39%] left-[46%]", size: "size-5 sm:size-7", rotate: "-rotate-[24deg]" },
  { pos: "top-[55%] left-[10%]", size: "size-6 sm:size-8", rotate: "rotate-[26deg]" },
  { pos: "top-[66%] right-[5%]", size: "size-5 sm:size-7", rotate: "rotate-[10deg]" },
  { pos: "bottom-[17%] right-[15%]", size: "size-8 sm:size-11", rotate: "-rotate-[18deg]" },
  { pos: "bottom-[7%] left-[40%]", size: "size-6 sm:size-8", rotate: "rotate-12" },
] as const;

export function SectionAmbientPaws({ tone = "light" }: SectionAmbientPawsProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {PAWS.map((paw, index) => (
        <PawPrint
          key={index}
          className={`absolute ${paw.pos} ${paw.size} ${paw.rotate} ${
            tone === "dark"
              ? "text-white/12"
              : index % 2 === 0
                ? "text-coral/13"
                : "text-forest/10"
          }`}
        />
      ))}
    </div>
  );
}
