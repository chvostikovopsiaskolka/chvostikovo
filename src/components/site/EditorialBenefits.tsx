import type { ReactNode } from "react";

export function EditorialBenefits({ image, alt, children }: { image: string; alt: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] items-center gap-3 sm:grid-cols-2 sm:gap-8">
      <img src={image} alt={alt} loading="lazy" width={900} height={900} className="h-full min-h-[320px] w-full rounded-3xl object-cover" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
