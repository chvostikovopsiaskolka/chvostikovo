import { Link } from "@tanstack/react-router";
import { trackCookielessInteraction } from "@/lib/cookieless-interactions";
import logo from "@/assets/logo.png";

/** Route links, not a binary ARIA switch: both languages keep crawlable URLs. */
export function LanguageSwitch({ language }: { language: "sk" | "en" }) {
  return (
    <nav data-language-switch={language} aria-label={language === "en" ? "Website language" : "Jazyk webu"} className="inline-flex shrink-0 items-center rounded-full bg-secondary p-1">
      {([{code:"sk",to:"/",label:"Slovenčina"},{code:"en",to:"/en/dog-daycare-kosice",label:"English"}] as const).map(({code,to,label}) => (
        <Link key={code} to={to} preload="intent" lang={code} hrefLang={code}
          aria-label={label} aria-current={code === language ? "page" : undefined}
          onClick={() => { if (code !== language) void trackCookielessInteraction("nav_click", "language_switch_" + code, language); }}
          className={"inline-flex min-h-11 lg:min-h-9 min-w-10 items-center justify-center rounded-full px-2.5 font-display text-xs font-bold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral " +
            (code === language ? "bg-coral text-white shadow-sm" : "text-forest/80 hover:text-forest")}>
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
export function MobileLanguageHeader({ language }: { language: "sk" | "en" }) {
  return <div data-mobile-language-header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-2 lg:hidden">
    <img src={logo} alt="Chvostíkovo" className="h-5 w-auto" />
    <LanguageSwitch language={language} />
  </div>;
}
