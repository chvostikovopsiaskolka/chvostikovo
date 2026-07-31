import { Instagram as InstagramIcon } from "lucide-react";
import { INSTAGRAM, GALLERY } from "@/content/site";

export function InstagramFeed() {
  const tiles = GALLERY.slice(0, 6);

  return (
    <section id="instagram" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
            Instagram
          </span>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">Zo života v škôlke</h2>
          <p className="mx-auto mt-3 max-w-xl text-forest/80">
            Fotky a videá zo dňa našich škôlkárov pridávame priebežne na Instagram.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((t) => (
            <a
              key={t.src}
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-3xl shadow-card"
            >
              <img
                src={t.src}
                alt={t.alt}
                loading="lazy"
                className="size-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-forest/45 opacity-0 transition group-hover:opacity-100">
                <InstagramIcon className="size-8 text-cream" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="btn-coral inline-flex items-center gap-2.5"
          >
            <InstagramIcon className="size-4.5" /> Sledujte nás na Instagrame
          </a>
        </div>
      </div>
    </section>
  );
}
