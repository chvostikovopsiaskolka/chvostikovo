import { useEffect, useMemo, useState } from "react";
import "./paw-trail-background.css";

type Point = readonly [number, number];

type Trail = {
  id: number;
  start: Point;
  control: Point;
  end: Point;
  startedAt: number;
  stepGap: number;
  holdMs: number;
  fadeMs: number;
};

const STEP_COUNT = 18;
const CLOCK_TICK_MS = 90;
const SPAWN_EVERY_MS = 4300;
const MAX_TRAILS = 3;
const AMBIENT_OPACITY = 0.055;

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

function edgePoint(edge: number): Point {
  const position = between(10, 90);
  if (edge === 0) return [-6, position];
  if (edge === 1) return [106, position];
  if (edge === 2) return [position, -6];
  return [position, 106];
}

function routeSamples(trail: Pick<Trail, "start" | "control" | "end">) {
  return Array.from({ length: 11 }, (_, index) =>
    pointOnCurve(trail.start, trail.control, trail.end, index / 10),
  );
}

function routeSeparation(
  candidate: Pick<Trail, "start" | "control" | "end">,
  existing: Trail[],
) {
  if (!existing.length) return 100;

  const candidatePoints = routeSamples(candidate);
  let closest = Infinity;

  for (const trail of existing) {
    const existingPoints = routeSamples(trail);
    for (const [x1, y1] of candidatePoints) {
      for (const [x2, y2] of existingPoints) {
        const distance = Math.hypot(x1 - x2, y1 - y2);
        if (distance < closest) closest = distance;
      }
    }
  }

  return closest;
}

function randomRoute(existing: Trail[]) {
  let best:
    | {
        start: Point;
        control: Point;
        end: Point;
        score: number;
      }
    | undefined;

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const startEdge = Math.floor(Math.random() * 4);
    let endEdge = Math.floor(Math.random() * 4);
    while (endEdge === startEdge) endEdge = Math.floor(Math.random() * 4);

    const start = edgePoint(startEdge);
    const end = edgePoint(endEdge);

    // Keep the bend away from the exact centre so the paths feel organic
    // instead of repeatedly crossing in the middle of the hero.
    const control: Point = [
      Math.random() < 0.5 ? between(16, 43) : between(57, 84),
      Math.random() < 0.5 ? between(16, 43) : between(57, 84),
    ];

    const score = routeSeparation({ start, control, end }, existing);
    if (!best || score > best.score) best = { start, control, end, score };
  }

  return (
    best ?? {
      start: [-6, 22] as Point,
      control: [35, 18] as Point,
      end: [106, 34] as Point,
      score: 0,
    }
  );
}

function createTrail(id: number, startedAt: number, existing: Trail[]): Trail {
  const route = randomRoute(existing);

  return {
    id,
    start: route.start,
    control: route.control,
    end: route.end,
    startedAt,
    stepGap: between(245, 330),
    holdMs: between(6200, 7600),
    fadeMs: between(2300, 3300),
  };
}

function initialTrails(): Trail[] {
  const first: Trail = {
    id: 1,
    start: [-6, 24],
    control: [31, 13],
    end: [76, 106],
    startedAt: -9300,
    stepGap: 285,
    holdMs: 7100,
    fadeMs: 2900,
  };

  const second: Trail = {
    id: 2,
    start: [84, -6],
    control: [77, 34],
    end: [106, 77],
    startedAt: -5200,
    stepGap: 270,
    holdMs: 6800,
    fadeMs: 2800,
  };

  const third: Trail = {
    id: 3,
    start: [106, 53],
    control: [65, 72],
    end: [21, 106],
    startedAt: -950,
    stepGap: 275,
    holdMs: 7000,
    fadeMs: 3000,
  };

  return [first, second, third];
}

function printOpacity(age: number, holdMs: number, fadeMs: number) {
  if (age < 0) return AMBIENT_OPACITY;

  const fadeInMs = 360;
  if (age < fadeInMs) {
    return AMBIENT_OPACITY + (age / fadeInMs) * (0.5 - AMBIENT_OPACITY);
  }

  if (age < holdMs) return 0.5;

  if (age < holdMs + fadeMs) {
    const progress = (age - holdMs) / fadeMs;
    return Math.max(AMBIENT_OPACITY, 0.5 * (1 - progress));
  }

  return AMBIENT_OPACITY;
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

export function PawTrailBackground() {
  const [clock, setClock] = useState(0);
  const [trails, setTrails] = useState<Trail[]>(initialTrails);
  const [nextId, setNextId] = useState(4);

  useEffect(() => {
    let last = performance.now();

    const clockTimer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(250, now - last);
      last = now;
      setClock((value) => value + delta);
    }, CLOCK_TICK_MS);

    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const spawnTimer = window.setInterval(() => {
      setTrails((current) => {
        const newest = createTrail(nextId, clock, current.slice(-2));
        return [...current.slice(-(MAX_TRAILS - 1)), newest];
      });
      setNextId((value) => value + 1);
    }, SPAWN_EVERY_MS);

    return () => window.clearInterval(spawnTimer);
  }, [clock, nextId]);

  const renderedPrints = useMemo(
    () =>
      trails.flatMap((trail) =>
        Array.from({ length: STEP_COUNT }, (_, step) => {
          const t = step / (STEP_COUNT - 1);
          const [x, y] = pointOnCurve(trail.start, trail.control, trail.end, t);
          const [dx, dy] = tangentOnCurve(trail.start, trail.control, trail.end, t);
          const length = Math.hypot(dx, dy) || 1;
          const stride = (step % 2 ? 1 : -1) * 1.25;
          const xOffset = (-dy / length) * stride;
          const yOffset = (dx / length) * stride;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          const age = clock - trail.startedAt - step * trail.stepGap;

          return {
            key: `${trail.id}-${step}`,
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
      {renderedPrints.map((print) => (
        <svg
          key={print.key}
          className="paw-trail-print"
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
