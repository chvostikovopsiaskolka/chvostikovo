import { useEffect, useMemo, useState } from "react";
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

type DogJourney = {
  start: Point;
  control: Point;
  end: Point;
  startedAt: number;
  durationMs: number;
  pauseMs: number;
  generation: number;
  variant: 0 | 1;
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
  const [minX, maxX] = TRAIL_ZONES[zone];
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

function randomEdgePoint(edge: number): Point {
  if (edge === 0) return [-8, between(8, 92)];
  if (edge === 1) return [108, between(8, 92)];
  if (edge === 2) return [between(8, 92), -8];
  return [between(8, 92), 108];
}

function createDogJourney(variant: 0 | 1, generation: number, startedAt: number): DogJourney {
  const startEdge = Math.floor(Math.random() * 4);
  let endEdge = Math.floor(Math.random() * 4);
  while (endEdge === startEdge) endEdge = Math.floor(Math.random() * 4);

  return {
    start: randomEdgePoint(startEdge),
    control: [between(12, 88), between(12, 88)],
    end: randomEdgePoint(endEdge),
    startedAt,
    durationMs: between(18000, 28500),
    pauseMs: between(1400, 4200),
    generation,
    variant,
  };
}

function initialDogs(): DogJourney[] {
  return [
    {
      start: [-8, 22],
      control: [48, 6],
      end: [108, 46],
      startedAt: -5200,
      durationMs: 23500,
      pauseMs: 2200,
      generation: 0,
      variant: 0,
    },
    {
      start: [86, 108],
      control: [66, 56],
      end: [18, -8],
      startedAt: -10600,
      durationMs: 26800,
      pauseMs: 3000,
      generation: 0,
      variant: 1,
    },
  ];
}

function HoundDog() {
  return (
    <svg className="hero-outline-dog-drawing" viewBox="0 0 136 78">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <g className="hero-dog-leg hero-dog-leg-a">
          <path d="M38 43Q37 53 39 60L45 67H54" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-b" opacity=".55">
          <path d="M49 44Q48 54 51 61L57 68H66" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-b">
          <path d="M79 43Q78 53 80 60L86 67H95" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-a" opacity=".55">
          <path d="M89 42Q89 53 91 60L97 67H106" />
        </g>

        <path
          d="M24 35Q22 21 40 19L72 20Q79 20 84 15L90 8Q94 4 101 10L108 18L121 21Q127 23 123 27L110 30L102 39Q96 47 80 46L41 46Q26 45 24 35Z"
          fill="white"
        />
        <path d="M94 9Q84 7 86 21Q88 29 94 27L99 13" />
        <path className="hero-dog-tail" d="M25 29Q13 25 10 13Q9 9 13 11" />
        <circle cx="104" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <path d="M121 21L126 24L122 26Z" fill="currentColor" />
      </g>
    </svg>
  );
}

function FluffyDog() {
  return (
    <svg className="hero-outline-dog-drawing" viewBox="0 0 132 82">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <g className="hero-dog-leg hero-dog-leg-b">
          <path d="M38 47Q37 56 40 63L46 70H55" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-a" opacity=".55">
          <path d="M50 48Q50 57 53 64L59 71H68" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-a">
          <path d="M76 47Q76 56 79 63L85 70H94" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-b" opacity=".55">
          <path d="M87 46Q88 55 91 62L97 69H106" />
        </g>

        <path
          d="M27 39Q25 24 42 20Q52 16 63 20L76 22Q82 21 86 15Q90 8 99 11Q107 13 111 20L119 24Q124 27 120 31L108 34Q105 44 95 48Q85 52 72 48L43 49Q30 48 27 39Z"
          fill="white"
        />
        <path d="M91 14Q83 16 84 28Q86 35 91 31L96 16" />
        <path d="M102 13Q108 8 113 15" />
        <path className="hero-dog-tail" d="M29 31Q16 32 14 22Q13 16 18 17Q25 18 22 24" />
        <path d="M109 35Q105 39 101 38" />
        <circle cx="106" cy="22" r="1.5" fill="currentColor" stroke="none" />
        <path d="M119 24L124 27L120 30Z" fill="currentColor" />
        <path d="M39 21L35 17M46 20L44 15M74 23L77 18" opacity=".65" />
      </g>
    </svg>
  );
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
  const [dogs, setDogs] = useState<DogJourney[]>(initialDogs);

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

    setDogs((current) => {
      let changed = false;
      const next = current.map((dog) => {
        if (clock <= dog.startedAt + dog.durationMs + dog.pauseMs) return dog;
        changed = true;
        return createDogJourney(dog.variant, dog.generation + 1, clock);
      });
      return changed ? next : current;
    });
  }, [clock]);

  const renderedDogs = useMemo(
    () =>
      dogs.map((dog) => {
        const elapsed = clock - dog.startedAt;
        const rawT = elapsed / dog.durationMs;
        const active = rawT >= 0 && rawT <= 1;
        const t = Math.max(0, Math.min(1, rawT));
        const [x, y] = pointOnCurve(dog.start, dog.control, dog.end, t);
        const [dx] = tangentOnCurve(dog.start, dog.control, dog.end, t);
        const edgeFade = Math.min(1, t / 0.07, (1 - t) / 0.07);
        return { dog, x, y, facing: dx >= 0 ? 1 : -1, opacity: active ? Math.max(0, edgeFade) : 0 };
      }),
    [dogs, clock],
  );

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

      {renderedDogs.map(({ dog, x, y, facing, opacity }) => (
        <div
          key={`${dog.variant}-${dog.generation}`}
          className={`hero-outline-dog ${dog.variant === 1 ? "hero-outline-dog-fluffy" : "hero-outline-dog-hound"}`}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            opacity,
            transform: `translate(-50%, -50%) scaleX(${facing})`,
          }}
        >
          {dog.variant === 0 ? <HoundDog /> : <FluffyDog />}
        </div>
      ))}
    </div>
  );
}
