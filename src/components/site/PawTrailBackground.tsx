import { useEffect, useState, type CSSProperties } from "react";
import "./paw-trail-background.css";

// A footprint stays in place: the next step appears ahead of it, then fades.
// Coordinates are proportional to the hero, so the paths fit every viewport.
type Point = readonly [number, number];
type Trail = { start: Point; control: Point; end: Point; age: number; generation: number };

const initialTrails: Trail[] = [
  { start: [-3, 22], control: [42, 8], end: [103, 23], age: 3, generation: 0 },
  { start: [103, 25], control: [60, 11], end: [-3, 20], age: 8, generation: 0 },
  { start: [-3, 17], control: [54, 31], end: [103, 18], age: 13, generation: 0 },
  { start: [-3, 92], control: [43, 76], end: [103, 95], age: 4, generation: 0 },
  { start: [103, 88], control: [56, 105], end: [-3, 84], age: 9, generation: 0 },
  { start: [-3, 84], control: [50, 100], end: [103, 90], age: 14, generation: 0 },
];

const STEP_SECONDS = 0.42;
const STEP_COUNT = 28;
const PRINT_SECONDS = 6;
const RUN_SECONDS = (STEP_COUNT - 1) * STEP_SECONDS + PRINT_SECONDS;

function nextTrail(index: number, generation: number): Trail {
  const top = index < 3;
  const reverse = Math.random() < 0.5;
  const y = () => top ? 17 + Math.random() * 10 : 83 + Math.random() * 13;
  return {
    start: [reverse ? 103 : -3, y()],
    control: [35 + Math.random() * 30, top ? 8 + Math.random() * 18 : 80 + Math.random() * 23],
    end: [reverse ? -3 : 103, y()],
    age: 0,
    generation,
  };
}

export function PawTrailBackground() {
  const [trails, setTrails] = useState(initialTrails);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function schedule(index: number, age: number, generation: number) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        const next = nextTrail(index, generation + 1);
        setTrails((current) => current.map((trail, i) => i === index ? next : trail));
        schedule(index, 0, generation + 1);
      }, (RUN_SECONDS - age) * 1000);
      timers.add(timer);
    }
    initialTrails.forEach((trail, index) => schedule(index, trail.age, 0));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div aria-hidden="true" className="paw-trail-background">
      {trails.map(({ start, control, end, age, generation }, trail) =>
        Array.from({ length: STEP_COUNT }, (_, step) => {
          const t = step / (STEP_COUNT - 1);
          const x = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t ** 2 * end[0];
          const y = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t ** 2 * end[1];
          const dx = 2 * (1 - t) * (control[0] - start[0]) + 2 * t * (end[0] - control[0]);
          const dy = 2 * (1 - t) * (control[1] - start[1]) + 2 * t * (end[1] - control[1]);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          return (
            <svg
              key={`${trail}-${generation}-${step}`}
              className="paw-trail-print"
              viewBox="0 0 32 36"
              style={{
                left: `${x}%`,
                top: `${y + (step % 2 ? 1.6 : -1.6)}%`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                animationDelay: `${step * STEP_SECONDS - age}s`,
                animationDuration: `${PRINT_SECONDS}s`,
              } as CSSProperties}
            >
              <ellipse cx="5" cy="15" rx="3.6" ry="5" transform="rotate(-24 5 15)" />
              <ellipse cx="12" cy="7" rx="3.7" ry="5.2" transform="rotate(-8 12 7)" />
              <ellipse cx="21" cy="7" rx="3.7" ry="5.2" transform="rotate(8 21 7)" />
              <ellipse cx="28" cy="15" rx="3.6" ry="5" transform="rotate(24 28 15)" />
              <path d="M8 25C9 21 12 17 16 17S23 21 25 25C28 32 23 35 19 32Q16 30 13 32C8 35 4 31 8 25Z" />
            </svg>
          );
        }),
      )}
      <div className="hero-outline-dog">
        <svg className="hero-outline-dog-drawing" viewBox="0 0 128 72">
          <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <g className="hero-dog-leg hero-dog-leg-back">
              <path d="M31 42L27 59L21 65H31" />
              <path d="M40 43L46 60L52 65H44" opacity=".55" />
            </g>
            <g className="hero-dog-leg hero-dog-leg-front">
              <path d="M81 43L78 60L73 65H83" />
              <path d="M88 41L96 59L103 65H94" opacity=".55" />
            </g>
            <path d="M23 34Q18 17 37 19L67 21L77 9Q80 3 89 8L99 19L114 22Q120 24 115 29L100 31L91 43Q83 49 67 46L35 46Q24 44 23 34Z" fill="white" />
            <path d="M83 9Q72 8 75 23Q77 30 82 27L87 13" />
            <path className="hero-dog-tail" d="M23 29Q10 27 8 14Q7 10 11 12" />
            <path d="M99 34L104 34" />
            <circle cx="95" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <path d="M113 22L117 24L114 26Z" fill="currentColor" />
          </g>
        </svg>
      </div>
      <div className="paw-trail-reading-space" />
    </div>
  );
}
