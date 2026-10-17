import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";

const dom = new Window({ url: "https://chvostikovo.sk/" });
Object.defineProperty(dom, "innerWidth", { configurable: true, writable: true, value: 390 });
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
let backgroundScrolls = 0;
dom.scrollTo = () => { backgroundScrolls++; };

function render(open: boolean, twoDogs: boolean) {
  return <FormDialog open={open} onOpenChange={() => {}} title="Prihláška">
    <form><input name="meno" autoComplete="name" /><textarea name="alergie" />
      <select name="pohlavie"><option>Vyberte</option><option>Pes</option><option>Suka</option></select>
      {twoDogs && <input name="pes2" autoComplete="off" />}
    </form>
  </FormDialog>;
}

try {
  for (const twoDogs of [false, true]) {
    await React.act(async () => { root.render(render(true, twoDogs)); await settle(); });
    await React.act(settle);
    const dialog = dom.document.querySelector<HTMLElement>("[data-form-dialog]")!;
    assert.ok(dialog, "actual Radix dialog mounted");
    assert.equal(dialog.getAttribute("data-form-dialog"), "candidate-v297");
    assert.equal(dialog.style.getPropertyValue("left"), "12px", "mobile form anchored within viewport");
    assert.equal(dialog.style.getPropertyValue("right"), "12px", "right edge anchored");
    assert.equal(dialog.style.getPropertyPriority("left"), "important", "mobile anchor wins over base CSS");
    assert.equal(dialog.style.getPropertyValue("translate"), "none", "Radix translation disabled");
    assert.equal(dialog.style.getPropertyValue("transform"), "none", "no transformed native picker ancestor");
    assert.equal(dialog.style.getPropertyValue("--form-viewport-height"), "750px");
    assert.equal(dom.document.activeElement?.tagName, "H2", "opening announces title without focusing a text field");
    const scroll = dialog.querySelector<HTMLElement>(".form-dialog-scroll")!;
    scroll.scrollTop = 420;
    const name = dialog.querySelector<HTMLInputElement>('[name="meno"]')!;
    name.value = "Synthetic Autofill"; // Silent browser autofill, without React input state.
    name.focus();
    viewport.height = 390;
    viewport.offsetTop = 30;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); viewport.dispatchEvent(new dom.Event("scroll")); await settle(); });
    assert.equal(dialog.style.getPropertyValue("--form-viewport-height"), "390px");
    assert.equal(dialog.style.getPropertyValue("--form-keyboard-top"), "30px", "visual viewport panning is compensated only with keyboard open");
    assert.equal(dialog.style.getPropertyValue("top"), "calc(var(--form-keyboard-top, 0px) + 12px + env(safe-area-inset-top, 0px))");
    assert.equal(dialog.dataset.formKeyboard, "open", "keyboard opens an edge-to-edge sheet");
    assert.equal(dialog.style.getPropertyValue("left"), "12px", "same horizontal geometry while keyboard is open");
    assert.equal(dialog.style.getPropertyValue("right"), "12px", "form never switches to a full-width sheet");
    assert.match(dialog.style.getPropertyValue("height"), /100svh/, "outer dialog height does not depend on keyboard height");
    assert.match(scroll.style.getPropertyValue("max-height"), /px$/, "only inner scroll height adapts to keyboard");
    assert.equal(scroll.scrollTop, 420, "keyboard resize does not reset form scroll");
    await React.act(async () => { root.render(render(true, twoDogs)); await settle(); });
    assert.equal(dialog.querySelector('[name="meno"]'), name, "autofilled node remains mounted");
    assert.equal(name.value, "Synthetic Autofill");
    // Simulate Safari moving the form during a keyboard session: tapping Done
    // must put the viewport back at the position it had before text editing.
    scroll.scrollTop = 670;
    const select = dialog.querySelector<HTMLSelectElement>("select")!;
    select.focus();
    viewport.height = 750;
    viewport.offsetTop = 0;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    await React.act(settle); // post-viewport rAF where Safari lays out the expanded scroller
    assert.equal(scroll.scrollTop, 420, "Done restores pre-focus scroll despite Safari-induced 670px movement");
    assert.equal(dialog.dataset.formKeyboard, "closed");
    assert.match(dialog.style.getPropertyValue("height"), /100svh/, "closing keyboard keeps the same outer frame");
    assert.equal(scroll.style.getPropertyValue("max-height"), "", "closing keyboard removes only inner scroll constraint");
    assert.equal(dialog.style.getPropertyValue("left"), "12px", "no margin changes while dismissing keyboard");
    // Mock only geometry, to exercise the real inner-scroll correction (not window scroll).
    const allergies = dialog.querySelector<HTMLTextAreaElement>('[name="alergie"]')!;
    const originalScrollerRect = scroll.getBoundingClientRect.bind(scroll);
    const originalAllergiesRect = allergies.getBoundingClientRect.bind(allergies);
    (scroll as any).getBoundingClientRect = () => ({ top: 100, bottom: 360, height: 260 });
    (allergies as any).getBoundingClientRect = () => ({ top: 410, bottom: 515, height: 105 });
    const beforeAllergies = scroll.scrollTop;
    allergies.focus();
    viewport.height = 345;
    viewport.offsetTop = 110;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.ok(scroll.scrollTop > beforeAllergies, "focused allergies textarea is scrolled inside the dialog");
    assert.equal(dialog.style.getPropertyValue("--form-keyboard-top"), "110px", "iOS visual viewport offset is bounded and only applied while keyboard open");
    assert.equal(dialog.dataset.formKeyboard, "open");
    assert.equal(dialog.style.getPropertyValue("left"), "12px", "textarea focus must not enlarge the modal");
    assert.equal(backgroundScrolls, 0, "focus never calls window scrollTo");
    const overlayGesture = new dom.Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(overlayGesture, "touches", { value: [{ clientY: 220 }] });
    dom.document.body.dispatchEvent(overlayGesture);
    assert.equal(overlayGesture.defaultPrevented, true, "scrolling behind a modal is blocked");
    allergies.blur();
    (scroll as any).getBoundingClientRect = originalScrollerRect;
    (allergies as any).getBoundingClientRect = originalAllergiesRect;
    viewport.height = 750;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    await React.act(settle);
    assert.equal(scroll.scrollTop, 420, "Done after lower textarea restores pre-keyboard scroll instead of jumping down");
    select.focus(); // Restore native select focus after explicitly blurring the textarea.
    assert.equal(dom.document.activeElement, select);
    assert.equal(backgroundScrolls, 0, "no programmatic background scrolling");
    (dom as any).innerWidth = 900;
    await React.act(async () => { dom.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.getPropertyValue("left"), "", "desktop removes forced mobile positioning");
    (dom as any).innerWidth = 390;
    await React.act(async () => { dom.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.getPropertyValue("left"), "12px", "mobile anchoring restored after rotation");
    viewport.scale = 2;
    viewport.height = 300;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.getPropertyValue("--form-viewport-height"), "750px", "pinch zoom is not counteracted");
    assert.equal(dialog.style.getPropertyValue("left"), "12px");
    assert.match(dialog.style.getPropertyValue("height"), /100svh/);
    await React.act(async () => { root.render(render(false, twoDogs)); await settle(); });
    viewport.scale = 1;
    viewport.height = 750;
    const before = dialog.style.cssText;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.cssText, before, "closed dialog removed its viewport listeners");
  }
  const css = readFileSync("src/styles.css", "utf8");
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.form-dialog\[data-state\][\s\S]*left: 12px !important;[\s\S]*right: 12px !important;[\s\S]*transform: none !important;[\s\S]*translate: none !important;[\s\S]*animation: none !important;/);
  assert.doesNotMatch(css, /\.form-dialog\[data-form-keyboard="open"\][\s\S]*?left: 0 !important;/, "do not reintroduce v293 fullscreen keyboard sheet");
  assert.match(css, /height: calc\(100svh - 24px/, "stable frame does not collapse to visualViewport.height");
  const formsFile = readFileSync("src/components/site/Forms.tsx", "utf8");
  assert.equal((formsFile.match(/<DogBinaryChoice /g) || []).length, 4, "one- and two-dog sex/neuter fields avoid native picker popups");
  const cssColor = readFileSync("src/styles.css", "utf8");
  assert.match(cssColor, /color-scheme: light;/);
  const dialogComponent = readFileSync("src/components/ui/dialog.tsx", "utf8");
  assert.match(dialogComponent, /positioning === "form"/, "shared form opts out of Radix default centering");
  const forms = readFileSync("src/components/site/Forms.tsx", "utf8");
  assert.match(forms, /name="pes" autoComplete="off"/);
  assert.match(forms, /name="pes2" autoComplete="off"/);
  assert.match(forms, /name="meno" autoComplete="name"/);
  console.log("PASS candidate v297: 1/2 dogs, keyboard Done scroll recovery, constant outer keyboard/no-keyboard frame, inner scroll clipping, focus/textarea visibility, autofill value/node stability, background scroll blocked and zoom cleanup. Real physical Safari and Android remain unverified.");
} finally {
  await React.act(async () => root.unmount());
  dom.happyDOM.abort();
}
