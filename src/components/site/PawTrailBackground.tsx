import { useEffect, useState } from "react";
import "./paw-trail-background.css";

type Point = readonly [number, number];

type Trail = {
  zone: number;
  start: Point;
  control: Point;
  end: Point;
  startedAt: number;
  stepGap: number;
  holdMs: number;
  fadeMs: number;
  pauseMs: number;
  generation: number;
};


const STEP_COUNT = 19;
const TRAIL_ZONES: ReadonlyArray<readonly [number, number]> = [
  [4, 29],
  [37, 63],
  [71, 96],
];

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pointOnCurve(start: Point, control: Point, end: Point, t: number): Point {
  return [
    (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t ** 2 * end[0],
    (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t ** 2 * end[1],
  ];
}

function tangentOnCurve(start: Point, control: Point, end: Point, t: number): Point {
  return [
    2 * (1 - t) * (control[0] - start[0]) + 2 * t * (end[0] - control[0]),
    2 * (1 - t) * (control[1] - start[1]) + 2 * t * (end[1] - control[1]),
  ];
}

function createTrail(zone: number, generation: number, startedAt: number): Trail {
  const bounds = TRAIL_ZONES[zone] ?? ([4, 29] as const);
  const minX = bounds[0];
  const maxX = bounds[1];
  const downward = Math.random() > 0.5;
  const start: Point = [between(minX, maxX), downward ? -5 : 105];
  const end: Point = [between(minX, maxX), downward ? 105 : -5];
  const control: Point = [between(minX + 2, maxX - 2), between(34, 66)];

  return {
    zone,
    start,
    control,
    end,
    startedAt,
    stepGap: between(285, 390),
    holdMs: between(6200, 7600),
    fadeMs: between(1200, 1750),
    pauseMs: between(700, 1800),
    generation,
  };
}

function initialTrails(): Trail[] {
  return [
    {
      zone: 0,
      start: [9, -5],
      control: [25, 47],
      end: [17, 105],
      startedAt: -2200,
      stepGap: 320,
      holdMs: 7000,
      fadeMs: 1500,
      pauseMs: 900,
      generation: 0,
    },
    {
      zone: 1,
      start: [54, 105],
      control: [42, 52],
      end: [58, -5],
      startedAt: -4700,
      stepGap: 350,
      holdMs: 6900,
      fadeMs: 1450,
      pauseMs: 1300,
      generation: 0,
    },
    {
      zone: 2,
      start: [88, -5],
      control: [74, 54],
      end: [81, 105],
      startedAt: -3300,
      stepGap: 305,
      holdMs: 7300,
      fadeMs: 1600,
      pauseMs: 1100,
      generation: 0,
    },
  ];
}

function PawPrint() {
  return (
    <>
      <ellipse cx="5" cy="15" rx="3.6" ry="5" transform="rotate(-24 5 15)" />
      <ellipse cx="12" cy="7" rx="3.7" ry="5.2" transform="rotate(-8 12 7)" />
      <ellipse cx="21" cy="7" rx="3.7" ry="5.2" transform="rotate(8 21 7)" />
      <ellipse cx="28" cy="15" rx="3.6" ry="5" transform="rotate(24 28 15)" />
      <path d="M8 25C9 21 12 17 16 17S23 21 25 25C28 32 23 35 19 32Q16 30 13 32C8 35 4 31 8 25Z" />
    </>
  );
}

function printOpacity(age: number, holdMs: number, fadeMs: number) {
  if (age < 0) return 0;
  const fadeIn = 420;
  if (age < fadeIn) return (age / fadeIn) * 0.5;
  if (age < holdMs) return 0.5;
  if (age < holdMs + fadeMs) return 0.5 * (1 - (age - holdMs) / fadeMs);
  return 0;
}

export function PawTrailBackground() {
  const [clock, setClock] = useState(3600);
  const [trails, setTrails] = useState<Trail[]>(initialTrails);

  useEffect(() => {
    let last = performance.now();
    const interval = window.setInterval(() => {
      const current = performance.now();
      const delta = Math.min(220, current - last);
      last = current;
      setClock((value) => value + delta);
    }, 70);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setTrails((current) => {
      let changed = false;
      const next = current.map((trail) => {
        const trailEnd =
          trail.startedAt +
          (STEP_COUNT - 1) * trail.stepGap +
          trail.holdMs +
          trail.fadeMs +
          trail.pauseMs;

        if (clock <= trailEnd) return trail;
        changed = true;
        return createTrail(trail.zone, trail.generation + 1, clock);
      });
      return changed ? next : current;
    });

  }, [clock]);

  return (
    <div aria-hidden="true" className="paw-trail-background">
      {trails.flatMap((trail) =>
        Array.from({ length: STEP_COUNT }, (_, step) => {
          const t = step / (STEP_COUNT - 1);
          const [x, y] = pointOnCurve(trail.start, trail.control, trail.end, t);
          const [dx, dy] = tangentOnCurve(trail.start, trail.control, trail.end, t);
          const length = Math.hypot(dx, dy) || 1;
          const stride = (step % 2 ? 1 : -1) * 1.3;
          const xOffset = (-dy / length) * stride;
          const yOffset = (dx / length) * stride;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          const age = clock - trail.startedAt - step * trail.stepGap;
          const opacity = printOpacity(age, trail.holdMs, trail.fadeMs);

          return (
            <svg
              key={`${trail.zone}-${trail.generation}-${step}`}
              className={`paw-trail-print paw-trail-zone-${trail.zone}`}
              viewBox="0 0 32 36"
              style={{
                left: `${x + xOffset}%`,
                top: `${y + yOffset}%`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                opacity,
              }}
            >
              <PawPrint />
            </svg>
          );
        }),
      )}
    </div>
  );
}
