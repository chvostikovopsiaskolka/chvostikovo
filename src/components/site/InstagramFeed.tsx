import { useEffect, useState } from "react";
import { Instagram as InstagramIcon } from "lucide-react";
import { INSTAGRAM } from "@/content/site";

export function InstagramFeed() {
  return (
    <section id="instagram" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
          Instagram
        </span>
        <h2 className="section-title mt-2 text-3xl sm:text-4xl">Zo života v škôlke</h2>
        <p className="mx-auto mt-3 max-w-xl text-forest/80">
          Fotky a videá zo dňa našich škôlkárov pridávame priebežne na Instagram.
        </p>
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noreferrer"
          className="btn-coral mt-8 inline-flex items-center gap-2.5"
        >
          <InstagramIcon className="size-4.5" /> Sledujte nás na Instagrame
        </a>
      </div>
    </section>
  );
}
