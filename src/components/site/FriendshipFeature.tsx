import friendshipPhoto from "@/assets/friendship-feature.avif";
import { SectionAmbientPaws } from "./SectionAmbientPaws";

type FriendshipFeatureProps = {
  language?: "sk" | "en";
  embedded?: boolean;
};

export function FriendshipFeature({ language = "sk", embedded = false }: FriendshipFeatureProps) {
  const isEnglish = language === "en";
  const content = (
    <div className="grid overflow-hidden rounded-4xl bg-secondary/55 shadow-card ring-1 ring-forest/5 md:grid-cols-[1.05fr_0.95fr] md:items-center">
      <img
        src={friendshipPhoto}
        alt={isEnglish ? "Two daycare dogs resting close together on the sofa at Chvostíkovo" : "Dvaja psí kamaráti oddychujú spolu na gauči v Chvostíkove"}
        width={960}
        height={1280}
        loading="lazy"
        decoding="async"
        className="h-[275px] w-full object-cover object-[50%_53%] sm:h-[340px] md:h-[345px] lg:h-[390px]"
      />
      <div className="px-6 py-7 text-center sm:px-9 sm:py-10 md:text-left lg:px-12">
        <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-coral-dark">
          {isEnglish ? "More than playtime" : "Viac než len hra"}
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-forest sm:text-3xl lg:text-4xl">
          {isEnglish ? "Where dog friendships begin." : "Miesto, kde vznikajú psie priateľstvá."}
        </h2>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-forest/80 sm:text-base">
          {isEnglish
            ? "After playtime with their dog friends, there is also time to rest. At Chvostíkovo, every dog has space to enjoy the day at their own pace."
            : "Po hrách a šantení s kamošmi prichádza aj čas na oddych. V Chvostíkove má každý psík priestor užiť si deň vlastným tempom."}
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="mt-9">{content}</div>;
  }

  return (
    <section className="relative overflow-hidden bg-card pt-9 pb-6 sm:pt-12 sm:pb-8">
      <SectionAmbientPaws />
      <div className="relative z-10 mx-auto max-w-6xl px-4">{content}</div>
    </section>
  );
}
