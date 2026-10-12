import { Clock3, MapPin } from "lucide-react";

/** Compact, consistent location/hours chips on advertised landing pages. */
export function LandingPracticalInfo({
  language = "sk",
  className = "",
}: {
  language?: "sk" | "en";
  className?: string;
}) {
  const isEnglish = language === "en";
  return (
    <div className={`mt-4 mb-4 flex flex-wrap justify-center gap-2 text-[10.5px] font-semibold sm:mb-5 sm:gap-2.5 sm:text-xs lg:justify-start lg:mb-0 ${className}`}>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-coral px-2.5 py-1.5 text-white shadow-card sm:px-3 sm:py-2">
        <MapPin className="size-3.5 shrink-0 text-white sm:size-4" />
        {isEnglish ? "Poľská 6, Košice" : "Poľská 6, Košice"}
      </span>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-coral px-2.5 py-1.5 text-white shadow-card sm:px-3 sm:py-2">
        <Clock3 className="size-3.5 shrink-0 text-white sm:size-4" />
        {isEnglish ? "Mon–Fri 7:00–17:00" : "Po–Pia 7:00–17:00"}
      </span>
    </div>
  );
}
