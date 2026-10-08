/** Opt-in production QA: writes clearly labelled test leads using real React forms. */
import assert from "node:assert/strict";
import { Window } from "happy-dom";
if (process.env['CHVOSTIKOVO_LIVE_FORM_QA'] !== "1") throw new Error("Set CHVOSTIKOVO_LIVE_FORM_QA=1 to run production QA.");
const dom = new Window({ url: "https://chvostikovo.sk/psia-skolka-kosice" });
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "HTMLFormElement", "FormData", "Event", "CustomEvent", "MutationObserver", "Node"] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === "window" ? dom : (dom as any)[key] });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { ShortForm } = await import("../src/components/site/Forms");
const fetcher = globalThis.fetch;
let request: Promise<Response> | undefined;
let savedPayload: any;
globalThis.fetch = (async (url: any, init: any) => {
  if (!String(url).endsWith("/web-form-submit")) return Response.json({ ok: true });
  savedPayload = JSON.parse(init.body);
  request = fetcher(url, { ...init, headers: { ...init.headers, Origin: "https://chvostikovo.sk" } });
  return request;
}) as typeof fetch;
const agents = [
  ["iOS Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"],
  ["Android Instagram", "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Mobile Safari/537.36 Instagram 350.0.0.0 Android"],
  ["Android Facebook", "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/500.0.0.0]"],
];
let index = 0;
try {
  for (const [label, agent] of agents) for (const mode of ["manual", "silent-autofill"]) {
    Object.defineProperty(dom.navigator, "userAgent", { configurable: true, value: agent });
    dom.happyDOM.setURL(`https://chvostikovo.sk/psia-skolka-kosice?utm_source=qa&utm_medium=social&utm_campaign=urgent-attribution-20261008&fbclid=${"x".repeat(650)}`);
    dom.sessionStorage.clear();
    dom.localStorage.clear();
    const container = dom.document.createElement("div");
    dom.document.body.append(container);
    const root = createRoot(container as any);
    await React.act(async () => root.render(<ShortForm trackingSource="lead_landing_mobile_below_hero" />));
    const form = container.querySelector("form")!;
    form.querySelector<HTMLInputElement>('input[name="meno"]')!.value = `QA attribution 20261008 ${++index}`;
    form.querySelector<HTMLInputElement>('input[type="tel"]')!.value = `+421 912 000 ${String(900 + index)}`;
    const interest = form.querySelector<HTMLSelectElement>('select[name="zaujem"]')!;
    interest.value = "Mám záujem o pravidelné návštevy";
    form.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked = true;
    if (mode === "manual") for (const input of form.querySelectorAll("input")) input.dispatchEvent(new dom.Event("input", { bubbles: true }) as any);
    assert(form.checkValidity());
    request = undefined;
    await React.act(async () => {
      form.requestSubmit();
      assert(request, "Backend not called");
      const response = await request;
      assert.equal(response.status, 201);
      assert.equal((await response.clone().json()).ok, true);
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    assert(!container.querySelector("form"), "Frontend success state missing");
    assert(container.textContent?.includes("Ďakujeme za váš záujem."));
    assert(!savedPayload.source_ref.includes("fbclid"));
    console.log(JSON.stringify({ simulatedAgent: label, mode, success: true, attemptId: savedPayload.form_attempt_id }));
    await React.act(async () => root.unmount());
    container.remove();
  }
} finally {
  globalThis.fetch = fetcher;
  await dom.happyDOM.abort();
}
