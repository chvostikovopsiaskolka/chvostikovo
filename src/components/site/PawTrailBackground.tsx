import { useEffect, useMemo, useState } from "react";
import "./paw-trail-background.css";

type Point = readonly [number, number];
type Lane = 0 | 1 | 2;

type Trail = {
  lane: Lane;
  id: number;
  start: Point;
  control: Point;
  end: Point;
  startedAt: number;
  stepGap: number;
  holdMs: number;
  fadeMs: number;
  variant: number;
};

const STEP_COUNT = 16;
const CLOCK_TICK_MS = 90;
const MAX_OPACITY = 0.48;

const AMBIENT_PAWS = [
  { x: 9, y: 14, size: 22, rotate: -18, tone: "coral", mobile: true },
  { x: 54, y: 8, size: 20, rotate: 18, tone: "forest", mobile: true },
  { x: 23, y: 79, size: 17, rotate: 24, tone: "forest", mobile: true },
  { x: 36, y: 20, size: 15, rotate: 12, tone: "forest", mobile: false },
  { x: 44, y: 88, size: 20, rotate: -8, tone: "coral", mobile: false },
  { x: 58, y: 16, size: 18, rotate: 20, tone: "coral", mobile: false },
  { x: 66, y: 82, size: 16, rotate: -24, tone: "forest", mobile: true },
  { x: 78, y: 31, size: 21, rotate: 14, tone: "forest", mobile: true },
  { x: 91, y: 72, size: 18, rotate: -12, tone: "coral", mobile: true },
  { x: 14, y: 52, size: 14, rotate: 30, tone: "forest", mobile: false },
  { x: 86, y: 10, size: 15, rotate: -28, tone: "coral", mobile: false },
  { x: 18, y: 46, size: 22, rotate: -31, tone: "coral", mobile: true },
  { x: 49, y: 68, size: 20, rotate: 17, tone: "forest", mobile: true },
  { x: 70, y: 55, size: 21, rotate: -11, tone: "coral", mobile: true },
] as const;

const LANDING_BOTTOM_PAWS = [
  { x: 11, y: 90, size: 21, rotate: -22, tone: "coral" },
  { x: 52, y: 96, size: 18, rotate: 16, tone: "forest" },
  { x: 89, y: 91, size: 20, rotate: 27, tone: "coral" },
] as const;

const LEFT_ROUTES: ReadonlyArray<readonly [Point, Point, Point]> = [
  [[-6, 22], [17, 32], [42, 94]],
  [[30, -6], [13, 35], [-6, 79]],
  [[40, 106], [20, 70], [-6, 53]],
  [[-6, 67], [19, 55], [38, -6]],
];

const RIGHT_ROUTES: ReadonlyArray<readonly [Point, Point, Point]> = [
  [[106, 22], [83, 32], [58, 94]],
  [[70, -6], [87, 35], [106, 79]],
  [[60, 106], [80, 70], [106, 53]],
  [[106, 67], [81, 55], [62, -6]],
];

const CENTER_ROUTES: ReadonlyArray<readonly [Point, Point, Point]> = [
  [[48, -6], [46, 34], [54, 106]],
  [[55, 106], [52, 65], [47, -6]],
  [[44, 8], [50, 48], [56, 94]],
  [[56, 12], [49, 54], [45, 100]],
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

function jitterPoint(point: Point, lane: Lane): Point {
  const [x, y] = point;
  const minX = lane === 0 ? -8 : lane === 1 ? 56 : 44;
  const maxX = lane === 0 ? 44 : lane === 1 ? 108 : 56;
  const xJitter = lane === 2 ? between(-1.8, 1.8) : between(-3.5, 3.5);

  return [
    Math.min(maxX, Math.max(minX, x + xJitter)),
    Math.min(108, Math.max(-8, y + between(-4, 4))),
  ];
}

function makeTrail(
  lane: Lane,
  id: number,
  startedAt: number,
  previousVariant = -1,
): Trail {
  const routes = lane === 0 ? LEFT_ROUTES : lane === 1 ? RIGHT_ROUTES : CENTER_ROUTES;
  let variant = Math.floor(Math.random() * routes.length);
  if (routes.length > 1) {
    while (variant === previousVariant) variant = Math.floor(Math.random() * routes.length);
  }

  const route = routes[variant] ?? routes[0];
  if (!route) {
    throw new Error("Paw trail route is missing");
  }

  const reverse = Math.random() < 0.5;
  const [baseStart, baseControl, baseEnd] = route;
  const start = jitterPoint(reverse ? baseEnd : baseStart, lane);
  const control = jitterPoint(baseControl, lane);
  const end = jitterPoint(reverse ? baseStart : baseEnd, lane);

  return {
    lane,
    id,
    start,
    control,
    end,
    startedAt,
    stepGap: between(205, 245),
    holdMs: between(2350, 2850),
    fadeMs: between(1050, 1450),
    variant,
  };
}

function trailLifetime(trail: Trail) {
  return (STEP_COUNT - 1) * trail.stepGap + trail.holdMs + trail.fadeMs;
}

function initialTrails(): Trail[] {
  return [
    {
      lane: 0,
      id: 1,
      start: [-6, 25],
      control: [18, 37],
      end: [41, 96],
      startedAt: -2200,
      stepGap: 225,
      holdMs: 2600,
      fadeMs: 1250,
      variant: 0,
    },
    {
      lane: 1,
      id: 2,
      start: [106, 65],
      control: [82, 55],
      end: [64, -6],
      startedAt: 900,
      stepGap: 220,
      holdMs: 2550,
      fadeMs: 1200,
      variant: 3,
    },
    {
      lane: 2,
      id: 3,
      start: [49, -6],
      control: [47, 37],
      end: [53, 106],
      startedAt: -850,
      stepGap: 228,
      holdMs: 2450,
      fadeMs: 1150,
      variant: 0,
    },
  ];
}

function printOpacity(age: number, holdMs: number, fadeMs: number) {
  if (age < 0) return 0;

  const fadeInMs = 260;
  if (age < fadeInMs) {
    return (age / fadeInMs) * MAX_OPACITY;
  }

  if (age < holdMs) return MAX_OPACITY;

  if (age < holdMs + fadeMs) {
    return MAX_OPACITY * (1 - (age - holdMs) / fadeMs);
  }

  return 0;
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

export function PawTrailBackground({ landingBottomPaws = false }: { landingBottomPaws?: boolean } = {}) {
  const [clock, setClock] = useState(0);
  const [trails, setTrails] = useState<Trail[]>(initialTrails);

  useEffect(() => {
    let last = performance.now();

    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(240, now - last);
      last = now;
      setClock((value) => value + delta);
    }, CLOCK_TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setTrails((current) => {
      let changed = false;

      const next = current.map((trail) => {
        const elapsed = clock - trail.startedAt;
        if (elapsed <= trailLifetime(trail)) return trail;

        changed = true;
        return makeTrail(
          trail.lane,
          trail.id + 2,
          clock,
          trail.variant,
        );
      });

      return changed ? next : current;
    });
  }, [clock]);

  const renderedPrints = useMemo(
    () =>
      trails.flatMap((trail) =>
        Array.from({ length: STEP_COUNT }, (_, step) => {
          const t = step / (STEP_COUNT - 1);
          const [x, y] = pointOnCurve(trail.start, trail.control, trail.end, t);
          const [dx, dy] = tangentOnCurve(trail.start, trail.control, trail.end, t);
          const length = Math.hypot(dx, dy) || 1;
          const stride = (step % 2 ? 1 : -1) * 1.35;
          const xOffset = (-dy / length) * stride;
          const yOffset = (dx / length) * stride;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          const age = clock - trail.startedAt - step * trail.stepGap;

          return {
            key: `${trail.lane}-${trail.id}-${step}`,
            lane: trail.lane,
            x: x + xOffset,
            y: y + yOffset,
            angle,
            opacity: printOpacity(age, trail.holdMs, trail.fadeMs),
          };
        }),
      ),
    [clock, trails],
  );

  return (
    <div aria-hidden="true" className="paw-trail-background">
      <div className="paw-ambient-layer">
        {AMBIENT_PAWS.map((paw, index) => (
          <svg
            key={`ambient-${index}`}
            className={`paw-ambient-print paw-ambient-${paw.tone} ${paw.mobile ? "" : "paw-ambient-desktop"}`}
            viewBox="0 0 32 36"
            style={{
              left: `${paw.x}%`,
              top: `${paw.y}%`,
              width: `${paw.size}px`,
              transform: `translate(-50%, -50%) rotate(${paw.rotate}deg)`,
            }}
          >
            <PawPrint />
          </svg>
        ))}
        {landingBottomPaws &&
          LANDING_BOTTOM_PAWS.map((paw, index) => (
            <svg
              key={`landing-bottom-${index}`}
              className={`paw-ambient-print paw-ambient-${paw.tone} sm:hidden`}
              viewBox="0 0 32 36"
              style={{
                left: `${paw.x}%`,
                top: `${paw.y}%`,
                width: `${paw.size}px`,
                transform: `translate(-50%, -50%) rotate(${paw.rotate}deg)`,
              }}
            >
              <PawPrint />
            </svg>
          ))}
      </div>

      {renderedPrints.map((print) => (
        <svg
          key={print.key}
          className={`paw-trail-print paw-trail-lane-${print.lane}`}
          viewBox="0 0 32 36"
          style={{
            left: `${print.x}%`,
            top: `${print.y}%`,
            transform: `translate(-50%, -50%) rotate(${print.angle}deg)`,
            opacity: print.opacity,
          }}
        >
          <PawPrint />
        </svg>
      ))}
    </div>
  );
}
