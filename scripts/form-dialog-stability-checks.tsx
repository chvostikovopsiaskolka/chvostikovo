import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";

const dom = new Window({ url: "https://chvostikovo.sk/" });
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
    <form><input name="meno" autoComplete="name" />
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
    assert.equal(dialog.style.getPropertyValue("--form-viewport-top"), "30px");
    assert.equal(scroll.scrollTop, 420, "keyboard resize does not reset form scroll");
    await React.act(async () => { root.render(render(true, twoDogs)); await settle(); });
    assert.equal(dialog.querySelector('[name="meno"]'), name, "autofilled node remains mounted");
    assert.equal(name.value, "Synthetic Autofill");
    const select = dialog.querySelector<HTMLSelectElement>("select")!;
    select.focus();
    viewport.height = 750;
    viewport.offsetTop = 0;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(scroll.scrollTop, 420, "keyboard dismissal / select focus preserves position");
    assert.equal(dom.document.activeElement, select);
    assert.equal(backgroundScrolls, 0, "no programmatic background scrolling");
    viewport.scale = 2;
    viewport.height = 300;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.getPropertyValue("--form-viewport-height"), "750px", "pinch zoom is not counteracted");
    await React.act(async () => { root.render(render(false, twoDogs)); await settle(); });
    viewport.scale = 1;
    viewport.height = 750;
    const before = dialog.style.cssText;
    await React.act(async () => { viewport.dispatchEvent(new dom.Event("resize")); await settle(); });
    assert.equal(dialog.style.cssText, before, "closed dialog removed its viewport listeners");
  }
  const css = readFileSync("src/styles.css", "utf8");
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*\.form-dialog\[data-state\][\s\S]*left: 12px !important;[\s\S]*right: 12px !important;[\s\S]*transform: none !important;[\s\S]*translate: none !important;[\s\S]*animation: none !important;/);
  const forms = readFileSync("src/components/site/Forms.tsx", "utf8");
  assert.match(forms, /name="pes" autoComplete="off"/);
  assert.match(forms, /name="pes2" autoComplete="off"/);
  assert.match(forms, /name="meno" autoComplete="name"/);
  console.log("PASS actual Radix form dialog: 1/2 dogs, no input autofocus, viewport shrink/restore, native select focus, silent autofill/node stability, scroll preservation, zoom and cleanup. Physical iOS picker geometry remains a device check.");
} finally {
  await React.act(async () => root.unmount());
  dom.happyDOM.abort();
}
