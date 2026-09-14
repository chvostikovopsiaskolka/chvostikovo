import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

export function ProductPageEnhancements() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname !== "/stojan-na-misky-pre-psa") return;

    const section = document.getElementById("konfigurator");
    if (!section) return;

    const orderButton = [...section.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
      button.textContent?.includes("Objednať stojan"),
    );
    const options = orderButton?.parentElement as HTMLElement | null;
    if (!options || options.dataset.collapsibleOrder === "true") return;

    options.dataset.collapsibleOrder = "true";
    options.hidden = true;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.className =
      "mt-6 flex w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 text-left shadow-card transition hover:bg-secondary/40";

    const label = document.createElement("span");
    label.className = "font-display text-sm font-bold text-forest";
    label.textContent = "Chcem si objednať stojan";

    const arrow = document.createElement("span");
    arrow.className = "text-lg leading-none text-forest/65";
    arrow.textContent = "⌄";

    toggle.append(label, arrow);
    options.before(toggle);

    const setOpen = (open: boolean, scroll = false) => {
      options.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      arrow.textContent = open ? "⌃" : "⌄";
      if (open && scroll) toggle.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const onToggle = () => setOpen(options.hidden);
    toggle.addEventListener("click", onToggle);

    const bottomOrderLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href="#konfigurator"]')].filter((link) =>
      link.textContent?.trim().startsWith("Objednať"),
    );
    const linkHandlers = bottomOrderLinks.map((link) => {
      const handler = (event: Event) => {
        event.preventDefault();
        setOpen(true, true);
      };
      link.addEventListener("click", handler);
      return [link, handler] as const;
    });

    return () => {
      toggle.removeEventListener("click", onToggle);
      linkHandlers.forEach(([link, handler]) => link.removeEventListener("click", handler));
      toggle.remove();
      options.hidden = false;
      delete options.dataset.collapsibleOrder;
    };
  }, [pathname]);

  return null;
}
