import { Link } from "@tanstack/react-router";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";

/** Route links, not a binary ARIA switch: both languages keep crawlable URLs. */
export function LanguageSwitch({ language, onNavigate, source = "language_switch" }: { language: "sk" | "en"; onNavigate?: () => void; source?: string }) {
  return (
    <nav data-language-switch={language} aria-label={language === "en" ? "Website language" : "Jazyk webu"} className="inline-flex shrink-0 items-center rounded-full bg-secondary p-1">
      {([{code:"sk",to:"/",label:"Slovenčina"},{code:"en",to:"/en/dog-daycare-kosice",label:"English"}] as const).map(({code,to,label}) => (
        <Link key={code} to={to} preload="intent" lang={code} hrefLang={code}
          aria-label={label} aria-current={code === language ? "page" : undefined}
          onClick={(event) => { if (code !== language && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { void trackCookielessInteraction("nav_click", source + "_" + code, language); onNavigate?.(); } }}
          className={"inline-flex min-h-11 lg:min-h-9 min-w-11 lg:min-w-10 items-center justify-center rounded-full px-2.5 font-display text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral " +
            (code === language ? "bg-[#ffa414] text-[#26322b] shadow-sm" : "text-forest/80 hover:text-forest")}>
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
