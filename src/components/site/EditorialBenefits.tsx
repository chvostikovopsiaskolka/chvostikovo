import type { ReactNode } from "react";

type Props = {
  image: string;
  alt: string;
  secondImage: string;
  secondAlt: string;
  children: ReactNode;
  mobileTextOnly?: boolean;
};

/** Shared visual pattern: real daycare photos left, original benefits right. */
export function EditorialBenefits({ image, alt, secondImage, secondAlt, children, mobileTextOnly = false }: Props) {
  return (
    <div className={`${mobileTextOnly ? "block" : "grid grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)]"} items-stretch gap-3 text-left sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-7 lg:gap-12`}>
      <div className={`${mobileTextOnly ? "hidden" : "grid"} min-h-[370px] min-w-0 grid-rows-2 gap-2 sm:hidden`}>
        <img src={image} alt={alt} width={900} height={900} loading="lazy" decoding="async" className="h-full min-h-0 w-full rounded-[20px] object-cover" />
        <img src={secondImage} alt={secondAlt} width={900} height={900} loading="lazy" decoding="async" className="h-full min-h-0 w-full rounded-[20px] object-cover" />
      </div>
      <img src={image} alt={alt} width={900} height={900} loading="lazy" decoding="async" className="hidden h-full min-h-[380px] w-full rounded-4xl object-cover sm:block" />
      <div className="flex min-w-0 flex-col justify-center">{children}</div>
    </div>
  );
}
