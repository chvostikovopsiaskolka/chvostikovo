import type { CSSProperties } from "react";
import "./paw-trail-background.css";

// A footprint stays in place: the next step appears ahead of it, then fades.
// Coordinates are proportional to the hero, so the paths fit every viewport.
const trails = [
  { start: [4, 28], control: [35, -8], end: [97, 30], phase: 0 },
  { start: [100, 54], control: [73, 99], end: [34, 84], phase: 8 },
  { start: [-3, 78], control: [20, 115], end: [62, 96], phase: 16 },
] as const;

export function PawTrailBackground() {
  return (
    <div aria-hidden="true" className="paw-trail-background">
      {trails.map(({ start, control, end, phase }, trail) =>
        Array.from({ length: 24 }, (_, step) => {
          const t = step / 23;
          const x = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t ** 2 * end[0];
          const y = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t ** 2 * end[1];
          const dx = 2 * (1 - t) * (control[0] - start[0]) + 2 * t * (end[0] - control[0]);
          const dy = 2 * (1 - t) * (control[1] - start[1]) + 2 * t * (end[1] - control[1]);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          return (
            <svg
              key={`${trail}-${step}`}
              className="paw-trail-print"
              viewBox="0 0 32 36"
              style={{
                left: `${x}%`,
                top: `${y + (step % 2 ? 1.6 : -1.6)}%`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                animationDelay: `${phase + step * 0.48 - 12}s`,
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
      <div className="paw-trail-reading-space" />
    </div>
  );
}
