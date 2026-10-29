import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type Photo = { src: string; alt: string; size: number; position?: string };

/** Desktop Care photos share the existing mobile sources; never run an offscreen timer. */
export function CarePhotoSlideshow({ photos, language }: { photos: readonly Photo[]; language: "sk" | "en" }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const frame = useRef<HTMLElement>(null);
  const count = photos.length;
  const english = language === "en";

  useEffect(() => {
    const element = frame.current;
    if (!element || count < 2) return;
    const desktop = window.matchMedia("(min-width: 640px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const synchronize = () => {
      clearInterval(timer);
      timer = undefined;
      if (!paused && inView && desktop.matches && !reducedMotion.matches && !document.hidden) {
        timer = setInterval(() => setActive(index => (index + 1) % count), 5000);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      synchronize();
    });
    observer.observe(element);
    desktop.addEventListener("change", synchronize);
    reducedMotion.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      desktop.removeEventListener("change", synchronize);
      reducedMotion.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [count, paused]);

  return (
    <figure
      ref={frame}
      aria-label={english ? "Photos of care at Chvostíkovo" : "Fotografie starostlivosti v Chvostíkove"}
      className="care-photo-slideshow relative hidden min-h-[390px] overflow-hidden rounded-4xl bg-secondary shadow-card sm:block lg:min-h-[420px]"
    >
      {photos.map((photo, index) => (
        <img
          key={photo.src}
          src={photo.src}
          alt={index === active ? photo.alt : ""}
          aria-hidden={index !== active}
          width={photo.size}
          height={photo.size}
          loading="lazy"
          decoding="async"
          data-active={index === active}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${photo.position ?? "object-center"} ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-8">
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            aria-label={english ? `Show photo ${index + 1} of ${count}` : `Zobraziť fotografiu ${index + 1} z ${count}`}
            aria-pressed={active === index}
            onClick={() => { setActive(index); setPaused(true); }}
            className="grid size-11 place-items-center rounded-full text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden className={`h-2.5 rounded-full ${active === index ? "w-6 bg-white" : "w-2.5 bg-white/55"}`} />
          </button>
        ))}
        <button
          type="button"
          aria-label={english ? (paused ? "Resume photo rotation" : "Pause photo rotation") : (paused ? "Spustiť striedanie fotografií" : "Pozastaviť striedanie fotografií")}
          onClick={() => setPaused(value => !value)}
          className="grid size-11 place-items-center rounded-full text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white motion-reduce:hidden"
        >
          {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
        </button>
      </div>
    </figure>
  );
}
