import { useEffect, useRef, useState } from "react";

type Photo = { src: string; alt: string; size: number; height?: number; position?: string };

/** Desktop Care photos share the existing mobile sources; never run an offscreen timer. */
export function CarePhotoSlideshow({ photos, language }: { photos: readonly Photo[]; language: "sk" | "en" }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
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
      if (!hovered && !focused && inView && desktop.matches && !reducedMotion.matches && !document.hidden) {
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
  }, [count, hovered, focused]);

  return (
    <figure
      ref={frame}
      aria-label={english ? "Photos of care at Chvostíkovo" : "Fotografie starostlivosti v Chvostíkove"}
      aria-description={english ? "Photos rotate every five seconds. Focus or hover over the photo to hold it." : "Fotografie sa striedajú každých päť sekúnd. Zaostrením alebo podržaním kurzora fotografiu pozastavíte."}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="care-photo-slideshow relative hidden min-h-[390px] overflow-hidden rounded-4xl bg-secondary shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest sm:block lg:min-h-[420px]"
    >
      {photos.map((photo, index) => (
        <img
          key={photo.src}
          src={photo.src}
          alt={index === active ? photo.alt : ""}
          aria-hidden={index !== active}
          width={photo.size}
          height={photo.height ?? photo.size}
          loading="lazy"
          decoding="async"
          data-active={index === active}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${photo.position ?? "object-center"} ${index === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </figure>
  );
}
