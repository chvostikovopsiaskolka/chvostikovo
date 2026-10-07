import { useEffect, useState, type CSSProperties } from "react";
import "./paw-trail-background.css";

type Point = readonly [number, number];
type Trail = {
  start: Point;
  control: Point;
  end: Point;
  age: number;
  generation: number;
};

type DogJourney = {
  y: number;
  reverse: boolean;
  duration: number;
  age: number;
  generation: number;
};

const STEP_SECONDS = 0.38;
const STEP_COUNT = 22;
const PRINT_SECONDS = 5.2;
const TRAIL_SECONDS = (STEP_COUNT - 1) * STEP_SECONDS + PRINT_SECONDS;
const TRAIL_PAUSE_SECONDS = 1.4;

const initialTrail: Trail = {
  start: [9, -4],
  control: [5, 48],
  end: [16, 104],
  age: 3.2,
  generation: 0,
};

const initialDogs: DogJourney[] = [
  { y: 15, reverse: false, duration: 29, age: 6, generation: 0 },
  { y: 86, reverse: true, duration: 35, age: 14, generation: 0 },
];

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function nextTrail(generation: number): Trail {
  const route = Math.floor(Math.random() * 4);
  const edgeA = between(7, 93);
  const edgeB = between(7, 93);

  if (route === 0) {
    return {
      start: [-4, edgeA],
      control: [between(30, 70), between(5, 95)],
      end: [104, edgeB],
      age: 0,
      generation,
    };
  }

  if (route === 1) {
    return {
      start: [104, edgeA],
      control: [between(30, 70), between(5, 95)],
      end: [-4, edgeB],
      age: 0,
      generation,
    };
  }

  if (route === 2) {
    return {
      start: [edgeA, -4],
      control: [between(5, 95), between(30, 70)],
      end: [edgeB, 104],
      age: 0,
      generation,
    };
  }

  return {
    start: [edgeA, 104],
    control: [between(5, 95), between(30, 70)],
    end: [edgeB, -4],
    age: 0,
    generation,
  };
}

function nextDog(index: number, generation: number): DogJourney {
  const topLane = index === 0;
  return {
    y: topLane ? between(12, 19) : between(82, 90),
    reverse: Math.random() < 0.5,
    duration: between(25, 38),
    age: 0,
    generation,
  };
}

function OutlineDog() {
  return (
    <svg className="hero-outline-dog-drawing" viewBox="0 0 128 72">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <g className="hero-dog-leg hero-dog-leg-a">
          <path d="M38 42Q36 51 36 58L30 66H39" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-b" opacity=".48">
          <path d="M49 43Q51 51 54 58L60 64H51" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-b">
          <path d="M82 42Q83 51 82 59L77 66H86" />
        </g>
        <g className="hero-dog-leg hero-dog-leg-a" opacity=".48">
          <path d="M91 41Q94 50 95 58L101 64H93" />
        </g>

        <path
          d="M23 34Q18 17 37 19L67 21L77 9Q80 3 89 8L99 19L114 22Q120 24 115 29L100 31L91 43Q83 49 67 46L35 46Q24 44 23 34Z"
          fill="white"
        />
        <path d="M83 9Q72 8 75 23Q77 30 82 27L87 13" />
        <path className="hero-dog-tail" d="M23 29Q10 27 8 14Q7 10 11 12" />
        <path d="M99 34L104 34" />
        <circle cx="95" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <path d="M113 22L117 24L114 26Z" fill="currentColor" />
      </g>
    </svg>
  );
}

export function PawTrailBackground() {
  const [trail, setTrail] = useState(initialTrail);
  const [dogs, setDogs] = useState(initialDogs);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let trailTimer: ReturnType<typeof setTimeout> | undefined;
    const dogTimers = new Set<ReturnType<typeof setTimeout>>();

    function scheduleTrail(age: number, generation: number) {
      trailTimer = setTimeout(() => {
        if (cancelled) return;
        const next = nextTrail(generation + 1);
        setTrail(next);
        scheduleTrail(0, next.generation);
      }, (TRAIL_SECONDS - age + TRAIL_PAUSE_SECONDS) * 1000);
    }

    function scheduleDog(index: number, journey: DogJourney) {
      const pause = between(2.5, 7);
      const timer = setTimeout(() => {
        dogTimers.delete(timer);
        if (cancelled) return;
        const next = nextDog(index, journey.generation + 1);
        setDogs((current) => current.map((dog, i) => (i === index ? next : dog)));
        scheduleDog(index, next);
      }, (journey.duration - journey.age + pause) * 1000);
      dogTimers.add(timer);
    }

    scheduleTrail(initialTrail.age, initialTrail.generation);
    initialDogs.forEach((dog, index) => scheduleDog(index, dog));

    return () => {
      cancelled = true;
      if (trailTimer) clearTimeout(trailTimer);
      dogTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div aria-hidden="true" className="paw-trail-background">
      {Array.from({ length: STEP_COUNT }, (_, step) => {
        const t = step / (STEP_COUNT - 1);
        const x =
          (1 - t) ** 2 * trail.start[0] +
          2 * (1 - t) * t * trail.control[0] +
          t ** 2 * trail.end[0];
        const y =
          (1 - t) ** 2 * trail.start[1] +
          2 * (1 - t) * t * trail.control[1] +
          t ** 2 * trail.end[1];
        const dx =
          2 * (1 - t) * (trail.control[0] - trail.start[0]) +
          2 * t * (trail.end[0] - trail.control[0]);
        const dy =
          2 * (1 - t) * (trail.control[1] - trail.start[1]) +
          2 * t * (trail.end[1] - trail.control[1]);
        const length = Math.hypot(dx, dy) || 1;
        const stride = (step % 2 ? 1 : -1) * 1.45;
        const xOffset = (-dy / length) * stride;
        const yOffset = (dx / length) * stride;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

        return (
          <svg
            key={`${trail.generation}-${step}`}
            className="paw-trail-print"
            viewBox="0 0 32 36"
            style={{
              left: `${x + xOffset}%`,
              top: `${y + yOffset}%`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              animationDelay: `${step * STEP_SECONDS - trail.age}s`,
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
      })}

      <div className="paw-trail-reading-space" />

      {dogs.map((dog, index) => (
        <div
          key={`${index}-${dog.generation}`}
          className={`hero-outline-dog ${index === 1 ? "hero-outline-dog-secondary" : ""} ${dog.reverse ? "hero-outline-dog-reverse" : "hero-outline-dog-forward"}`}
          style={{
            top: `${dog.y}%`,
            animationDuration: `${dog.duration}s`,
            animationDelay: `-${dog.age}s`,
          }}
        >
          <OutlineDog />
        </div>
      ))}
    </div>
  );
}
