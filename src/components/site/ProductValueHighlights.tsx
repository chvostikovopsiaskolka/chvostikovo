type ProductValueHighlightsProps = {
  label: string;
  headings: readonly [string, string, string];
};

/** Stručné rozhodovacie dôvody medzi fotkou výrobku a výberom variantu. */
export function ProductValueHighlights({ label, headings }: ProductValueHighlightsProps) {
  return (
    <div aria-label={label} className="mb-5 grid grid-cols-3 gap-2">
      {headings.map(heading => (
        <div key={heading}
          className="flex min-h-11 items-center justify-center rounded-xl border border-forest/10 bg-secondary/50 px-1.5 py-2 text-center font-display text-[clamp(10px,2.45vw,12px)] font-bold leading-tight text-forest sm:px-2.5">
          {heading}
        </div>
      ))}
    </div>
  );
}
