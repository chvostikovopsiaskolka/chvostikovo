/** Shared emphasis for inline and modal lead introductions. */
export function LeadFormIntro({ text }: { text: string }) {
  return <>{text.split(/(nezáväzný formulár|no-obligation enquiry)/gi).map((part, i) =>
    ["nezáväzný formulár", "no-obligation enquiry"].includes(part.toLocaleLowerCase("sk"))
      ? <strong key={i} className="font-bold text-forest">{part}</strong> : part)}</>;
}
