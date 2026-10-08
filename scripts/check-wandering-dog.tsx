import { Window } from "happy-dom";
import assert from "node:assert/strict";

const browser = new Window({ url: "https://chvostikovo.sk" });
for (const key of ["window", "document", "navigator", "HTMLElement", "SVGElement", "Element", "Node", "Event"] as const) {
  Object.defineProperty(globalThis, key, { value: key === "window" ? browser : browser[key], configurable: true });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(browser.document, "hidden", { value: false, configurable: true });
let viewportWidth = 390;
let viewportHeight = 620;
Object.defineProperty(browser.HTMLElement.prototype, "clientWidth", { get: () => viewportWidth });
Object.defineProperty(browser.HTMLElement.prototype, "clientHeight", { get: () => viewportHeight });
Object.defineProperty(browser.HTMLElement.prototype, "offsetWidth", { get: () => viewportWidth < 640 ? 68 : 98 });
// Deliberately omit ResizeObserver: WebView fallback must also work.
Object.defineProperty(globalThis, "ResizeObserver", { value: undefined, configurable: true });
let now = 0;
const timers = new Map<number, () => void>();
let timerId = 0;
Object.defineProperty(globalThis, "performance", { value: { now: () => now }, configurable: true });
Object.assign(globalThis, {
  setInterval: (fn: () => void) => { timers.set(++timerId, fn); return timerId; },
  clearInterval: (id: number) => timers.delete(id),
});
const { act, createElement } = await import("react");
const { createRoot } = await import("react-dom/client");
const { WanderingDog } = await import("../src/components/site/WanderingDog");
const random = Math.random;
let seed = 42;
Math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
for (const [w, h] of [[390, 620], [768, 670], [1440, 730]]) {
  viewportWidth = w!; viewportHeight = h!;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(createElement(WanderingDog)));
  assert.equal(container.querySelectorAll("svg").length, 1);
  assert.equal(timers.size, 1);
  const dog = container.querySelector<HTMLElement>(".hero-wandering-dog")!;
  const first = dog.style.transform;
  const part = container.querySelector(".front-near")!;
  const firstLeg = part.getAttribute("transform");
  now += 200;
  await act(async () => { for (const fn of timers.values()) fn(); });
  assert.notEqual(dog.style.transform, first, "Dog must move immediately without a click");
  assert.notEqual(part.getAttribute("transform"), firstLeg, "Leg must move with the same clock");
  assert.ok(container.querySelector(".tail")!.getAttribute("transform")?.startsWith("rotate("));
  const directions = new Set<string>();
  const ys: number[] = [];
  await act(async () => {
    for (let i = 0; i < 4000; i++) {
      now += 40;
      for (const fn of timers.values()) fn();
      const coords = dog.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)!;
      assert.ok(coords, "Finite 2D transform on every frame");
      assert.ok(+coords[1]! >= 0 && +coords[1]! < w!);
      assert.ok(+coords[2]! >= 0 && +coords[2]! < h!);
      ys.push(+coords[2]!);
      directions.add(container.querySelector<HTMLElement>(".hero-wandering-dog-facing")!.style.transform);
    }
  });
  assert.equal(directions.size, 2, "Dog must face both directions over random routes");
  assert.ok(Math.max(...ys) - Math.min(...ys) > h! * .35, "Routes must also travel vertically");
  await act(async () => window.dispatchEvent(new Event("pagehide")));
  assert.equal(timers.size, 0);
  await act(async () => window.dispatchEvent(new Event("pageshow")));
  assert.equal(timers.size, 1, "Resume on WebView return without duplicate clocks");
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  assert.equal(timers.size, 1);
  await act(async () => root.unmount());
  assert.equal(timers.size, 0);
  container.remove();
  console.log(`PASS ${w}x${h}: one dog, body/legs/tail moving, random routes, resume and cleanup`);
}
Math.random = random;
