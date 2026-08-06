import { REVIEWS } from "@/content/site";
import skolkariVideo from "@/assets/skolkari.mp4.asset.json";

export function Reviews() {
  return (
    <section className="bg-secondary/50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="font-display text-sm font-semibold tracking-wide text-coral uppercase">
          Recenzie klientov
        </span>
        <h2 className="section-title mt-2 text-3xl sm:text-4xl">100+ spokojných psíkov</h2>
        <p className="mt-3 text-forest/80">⭐ 5.0 z 5 na Google</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="flex h-full flex-col items-center rounded-3xl bg-card p-6 text-center shadow-card"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-forest">
                  {r.name.charAt(0)}
                </span>
                <div className="text-left">
                  <figcaption className="font-display text-sm font-bold text-forest">
                    {r.name}
                  </figcaption>
                  <span className="text-sm tracking-tight text-[#F5B301]">★★★★★</span>
                </div>
              </div>
              <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-forest/85">
                „{r.text}“
              </blockquote>
            </figure>
          ))}
        </div>

        <div className="mt-14 sm:mt-16">
          <h3 className="section-title text-2xl sm:text-3xl">
            Ako sa naši škôlkári tešia do škôlky
          </h3>
          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-[320px] overflow-hidden rounded-3xl bg-card shadow-card">
              <video
                src={skolkariVideo.url}
                className="aspect-[9/16] w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="Video zo psiej škôlky Chvostíkovo – škôlkári sa tešia do škôlky"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
