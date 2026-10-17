import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";

const dom = new Window({ url: "https://chvostikovo.sk/" });
Object.defineProperty(dom.navigator, "userAgent", { configurable: true, value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" });
Object.defineProperty(dom, "innerWidth", { configurable: true, writable: true, value: 390 });
Object.defineProperty(dom, "scrollY", { configurable: true, writable: true, value: 120 });
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "HTMLTextAreaElement", "HTMLButtonElement", "HTMLFormElement", "DocumentFragment", "Event", "CustomEvent", "MutationObserver", "Node", "NodeFilter", "Element", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
  const value = key === "window" ? dom : (dom as any)[key];
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: typeof value === "function" && /^(getComputedStyle|requestAnimationFrame|cancelAnimationFrame)$/.test(key) ? value.bind(dom) : value });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const viewport = new dom.EventTarget() as any;
Object.assign(viewport, { height: 750, offsetTop: 0, scale: 1 });
Object.defineProperty(dom, "visualViewport", { configurable: true, value: viewport });
const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { FormDialog } = await import("../src/components/site/FormDialog");
const container = dom.document.createElement("div");
dom.document.body.append(container);
const root = createRoot(container as any);
const settle = () => new Promise(resolve => setTimeout(resolve, 35));
const beforeStyle = dom.document.body.style.cssText;
let windowScrolls = 0;
let restoredTo: [number, number] | null = null;
dom.scrollTo = ((x: number, y: number) => { windowScrolls++; restoredTo = [x, y]; }) as typeof dom.scrollTo;
function render(open: boolean, twoDogs: boolean) {
  return <FormDialog open={open} onOpenChange={() => {}} title="Prihláška">
    <form>
      <input name="meno" autoComplete="name" />
      <input name="telefon" autoComplete="tel" />
      <input name="pes" autoComplete="off" />
      <textarea name="alergie" />
      <textarea name="povaha" />
      <select name="frekvencia"><option>Vyberte</option><option>Týždenne</option></select>
      {twoDogs && <input name="pes2" autoComplete="off" />}
    </form>
  </FormDialog>;
}
try {
  for (const twoDogs of [false, true]) {
    await React.act(async () => { root.render(render(true, twoDogs)); await settle(); });
    const modal = dom.document.querySelector<HTMLElement>("[data-form-dialog]")!;
    assert.ok(modal, "real Radix form modal renders");
    assert.equal(modal.dataset.formDialog, "simple-v299");
    assert.equal(dom.document.body.style.position, "fixed", "body frozen while form open");
    assert.equal(dom.document.body.style.top, "-120px", "retain existing background scroll position");
    assert.equal(dom.document.body.style.overflow, "hidden", "background does not scroll");
    assert.equal(dom.document.activeElement?.tagName, "H2", "title focused without keyboard on open");
    assert.equal(dom.document.querySelectorAll("[data-form-dialog]").length, 1);
    const scroller = modal.querySelector<HTMLElement>(".form-dialog-scroll")!;
    const originalCss = modal.style.cssText;
    scroller.scrollTop = 440;
    const name = modal.querySelector<HTMLInputElement>('[name="meno"]')!;
    name.value = "Silent iOS autofill"; // silent native autofill is not a React remount
    name.focus();
    viewport.height = 365;
    viewport.offsetTop = 120;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); viewport.dispatchEvent(new dom.Event("scroll")); await settle(); });
    assert.equal(modal.style.cssText, originalCss, "keyboard does not mutate modal position, width, height or radius");
    assert.equal(scroller.scrollTop, 440, "opening keyboard does not programmatically scroll modal");
    assert.equal(windowScrolls, twoDogs ? 1 : 0, "no page scrollTo while open");
    assert.equal(dom.document.body.style.position, "fixed", "keyboard cannot unlock background");
    const allergy = modal.querySelector<HTMLTextAreaElement>('[name="alergie"]')!;
    allergy.focus();
    scroller.scrollTop = 710; // native user scrolling: preserve exactly
    viewport.height = 750;
    viewport.offsetTop = 0;
    allergy.blur();
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(scroller.scrollTop, 710, "Done does not impose artificial scroll restore");
    assert.equal(modal.style.cssText, originalCss, "Done does not change frame geometry");
    await React.act(async () => { root.render(render(true, twoDogs)); await settle(); });
    assert.equal(modal.querySelector('[name="meno"]'), name, "autofilled input remains mounted");
    assert.equal(name.value, "Silent iOS autofill", "autofill value preserved");
    assert.equal(dom.document.body.style.position, "fixed");
    // Safari may push scrollTop to the end AFTER native contact autofill and
    // the keyboard's Done action. Recover ONLY that owner-name blur case.
    name.focus();
    name.blur();
    scroller.scrollTop = 845;
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 370)); });
    assert.equal(scroller.scrollTop, 0, "iOS Done after owner-name autofill returns to the start");
    assert.equal(name.value, "Silent iOS autofill", "restore never mutates autofilled name");
    // Switching directly to the next field must not fight Safari scrolling.
    name.focus();
    name.blur();
    const phone = modal.querySelector<HTMLInputElement>('[name="telefon"]')!;
    phone.focus();
    scroller.scrollTop = 360;
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 370)); });
    assert.equal(scroller.scrollTop, 360, "moving to the next field never resets scroll");
    // A user gesture during keyboard dismissal cancels the pending recovery.
    phone.blur();
    name.focus();
    name.blur();
    scroller.scrollTop = 490;
    scroller.dispatchEvent(new dom.Event("touchstart", { bubbles: true }));
    await React.act(async () => { await new Promise(resolve => setTimeout(resolve, 370)); });
    assert.equal(scroller.scrollTop, 490, "manual scrolling cancels the scheduled recovery");
    await React.act(async () => { root.render(render(false, twoDogs)); await settle(); });
    assert.equal(dom.document.querySelector("[data-form-dialog]"), null, "modal removed");
    assert.equal(dom.document.body.style.cssText, beforeStyle, "background style restored on close");
    assert.deepEqual(restoredTo, [0, 120], "page returns to exact pre-dialog position");
  }

  const css = readFileSync("src/styles.css", "utf8");
  const component = readFileSync("src/components/site/FormDialog.tsx", "utf8");
  const primitive = readFileSync("src/components/ui/dialog.tsx", "utf8");
  const forms = readFileSync("src/components/site/Forms.tsx", "utf8");
  assert.match(css, /\.form-dialog-scroll\s*\{[^}]*overflow-y:\s*auto/, "one native internal scroll owner");
  assert.match(css, /max-height:\s*calc\(100svh/, "modal height limited without forced fullscreen");
  assert.doesNotMatch(css, /\.form-dialog\[data-form-keyboard|top:\s*-100vh|(?:^|\n)\s*height:\s*calc\(100svh/m, "no fullscreen or keyboard mask hacks");
  for (const forbidden of ["window.visualViewport", "scrollRef.current", "addEventListener(", "scrollIntoView(", "--form-viewport", "--form-keyboard"]) { assert.equal(component.includes(forbidden), false, `no keyboard logic: ${forbidden}`); }
  assert.match(primitive, /<DialogOverlay \/>/, "ordinary dark backdrop used for all dialogs");
  assert.equal((forms.match(/<DogBinaryChoice /g) || []).length, 4, "dog sex/neuter inline buttons remain");
  assert.match(forms, /name="meno" autoComplete="name"/);
  assert.match(forms, /name="pes2" autoComplete="off"/);
  assert.match(css, /color-scheme: light;/);
  console.log("PASS v299 simple form modal + isolated iOS owner autofill Done correction: 1/2 dogs, frozen page, no keyboard geometry changes, stable internal scroll, title focus, autofill/node retention, close restores background and unchanged CRM fields. Physical iOS Safari/Android remain unverified.");
} finally {
  await React.act(async () => root.unmount());
  dom.happyDOM.abort();
}
