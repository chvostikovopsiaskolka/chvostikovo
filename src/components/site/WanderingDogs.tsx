import { memo, useEffect, useRef } from "react";
import "./wandering-dogs.css";

type Point = { x: number; y: number };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Independent, decorative walkers. No React updates on animation frames. */
export const WanderingDogs = memo(function WanderingDogs() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const elements = Array.from(layer.querySelectorAll<HTMLElement>(".hero-wandering-dog"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = layer.clientWidth;
    let height = layer.clientHeight;
    let visible = true;
    let frame = 0;
    let last = 0;
    const walkers = elements.map((element, index) => ({
      element, index, node: index ? 5 : 1, next: index ? 4 : 2,
      progress: 0, duration: 18000, facing: index ? -1 : 1,
    }));

    // Perimeter corridors keep the headline/form centre clear. Adjacent corner
    // points give horizontal, vertical and diagonal travel without body rotation.
    function points(index: number): Point[] {
      const size = width < 640 ? (index ? 49 : 57) : (index ? 82 : 94);
      const left = 7;
      const right = Math.max(left, width - size - 7);
      const top = Math.min(80, height * .2);
      const bottom = Math.max(top, height - size * .58 - 8);
      const mid = (left + right) / 2;
      return [
        { x: left, y: top + 18 }, { x: mid, y: top }, { x: right, y: top + 22 },
        { x: right, y: mix(top, bottom, .53) }, { x: right - 12, y: bottom },
        { x: mid, y: bottom - 5 }, { x: left, y: bottom - 20 },
        { x: left, y: mix(top, bottom, .48) },
      ];
    }

    function draw(delta: number) {
      for (const walker of walkers) {
        const route = points(walker.index);
        walker.progress += delta / walker.duration;
        if (walker.progress >= 1) {
          walker.node = walker.next;
          const direction = Math.random() < .35 ? -1 : 1;
          walker.next = (walker.node + direction + route.length) % route.length;
          walker.progress = 0;
          const start = route[walker.node]!;
          const end = route[walker.next]!;
          walker.duration = Math.max(5000, Math.hypot(end.x - start.x, end.y - start.y) / (width < 640 ? 17 : 25) * 1000);
        }
        const start = route[walker.node]!;
        const end = route[walker.next]!;
        if (Math.abs(end.x - start.x) > 2) walker.facing = end.x > start.x ? 1 : -1;
        const t = walker.progress;
        const x = mix(start.x, end.x, t);
        const y = mix(start.y, end.y, t) + Math.sin(t * Math.PI) * (walker.index ? -8 : 8);
        walker.element.style.transform = `translate3d(${x}px,${y}px,0)`;
        const image = walker.element.firstElementChild as HTMLElement;
        image.style.transform = `scaleX(${walker.facing})`;
      }
    }

    function tick(now: number) {
      const delta = last ? Math.min(now - last, 64) : 0;
      last = now;
      draw(delta);
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    }
    const resize = new ResizeObserver(() => {
      width = layer.clientWidth;
      height = layer.clientHeight;
      draw(0);
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    resize.observe(layer);
    observer.observe(layer);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    draw(0);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={layerRef} className="hero-wandering-dogs" aria-hidden="true">
      <div className="hero-wandering-dog">
        <img src="/images/hero-dog-original-3.svg" alt="" width="670" height="340" draggable="false" />
      </div>
      <div className="hero-wandering-dog hero-wandering-dog-small">
        <img src="/images/hero-dog-original-3.svg" alt="" width="670" height="340" draggable="false" />
      </div>
    </div>
  );
});
