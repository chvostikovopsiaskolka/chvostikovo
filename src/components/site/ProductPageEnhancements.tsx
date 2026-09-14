import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

export function ProductPageEnhancements() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
    if (normalizedPathname !== "/stojan-na-misky-pre-psa") return;

    let cancelled = false;
    let retryTimer: number | undefined;
    let cleanup = () => {};
    let attempts = 0;

    const setup = () => {
      if (cancelled) return;

      const section = document.getElementById("konfigurator");
      const orderButton = section
        ? [...section.querySelectorAll<HTMLButtonElement>("button")].find((button) =>
            button.textContent?.includes("Objednať stojan"),
          )
        : undefined;
      const options = orderButton?.parentElement as HTMLElement | null;

      if (!section || !options) {
        if (attempts++ < 30) retryTimer = window.setTimeout(setup, 100);
        return;
      }

      // Keep every product photo in exactly the same 4:3 frame on mobile and desktop.
      const mainImage = section.querySelector<HTMLImageElement>('img[fetchpriority="high"]');
      const mainFrame = mainImage?.parentElement as HTMLElement | null;
      if (mainImage && mainFrame) {
        mainFrame.style.aspectRatio = "4 / 3";
        mainFrame.style.display = "flex";
        mainFrame.style.alignItems = "center";
        mainFrame.style.justifyContent = "center";
        mainImage.style.width = "100%";
        mainImage.style.height = "100%";
        mainImage.style.aspectRatio = "auto";
        mainImage.style.objectFit = "cover";
        mainImage.style.objectPosition = "center center";
      }

      const gallery = mainFrame?.parentElement;
      gallery?.querySelectorAll<HTMLImageElement>("button img").forEach((image) => {
        image.style.width = "100%";
        image.style.aspectRatio = "4 / 3";
        image.style.objectFit = "cover";
        image.style.objectPosition = "center center";
      });

      if (options.dataset.collapsibleOrder === "true") return;
      options.dataset.collapsibleOrder = "true";
      options.style.display = "none";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.className =
        "mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-forest/10 bg-card px-4 py-3 text-left shadow-card transition hover:bg-secondary/40";

      const label = document.createElement("span");
      label.className = "font-display text-sm font-bold text-forest";
      label.textContent = "Chcem si objednať stojan";

      const arrow = document.createElement("span");
      arrow.className = "text-lg leading-none text-forest/65";
      arrow.textContent = "⌄";

      toggle.append(label, arrow);
      options.before(toggle);

      const setOpen = (open: boolean, scroll = false) => {
        options.style.display = open ? "" : "none";
        toggle.setAttribute("aria-expanded", String(open));
        arrow.textContent = open ? "⌃" : "⌄";
        if (open && scroll) toggle.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      const onToggle = () => setOpen(options.style.display === "none");
      toggle.addEventListener("click", onToggle);

      const bottomOrderLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[href="#konfigurator"]')].filter(
        (link) => link.textContent?.trim().startsWith("Objednať"),
      );
      const linkHandlers = bottomOrderLinks.map((link) => {
        const handler = (event: Event) => {
          event.preventDefault();
          setOpen(true, true);
        };
        link.addEventListener("click", handler);
        return [link, handler] as const;
      });

      cleanup = () => {
        toggle.removeEventListener("click", onToggle);
        linkHandlers.forEach(([link, handler]) => link.removeEventListener("click", handler));
        toggle.remove();
        options.style.display = "";
        delete options.dataset.collapsibleOrder;
      };
    };

    setup();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      cleanup();
    };
  }, [pathname]);

  return null;
}
