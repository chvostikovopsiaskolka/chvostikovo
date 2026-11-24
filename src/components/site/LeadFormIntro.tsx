/** Shared emphasis for inline and modal lead introductions. */
export function LeadFormIntro({ text }: { text: string }) {
  return <>{text.split(/(nezáväzný formulár)/gi).map((part, i) =>
    part.toLocaleLowerCase("sk") === "nezáväzný formulár"
      ? <strong key={i} className="font-bold text-forest">{part}</strong> : part)}</>;
}
