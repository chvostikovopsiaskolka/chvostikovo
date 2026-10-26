type FirstVisitPhotoProps = {
  number: number | string;
  image: string;
  alt: string;
};

/** Visual only: no new requests or navigation and no connecting timeline lines. */
export function FirstVisitPhoto({ number, image, alt }: FirstVisitPhotoProps) {
  return (
    <div className="relative mx-auto mb-5 w-fit">
      <img
        src={image}
        alt={alt}
        width={140}
        height={140}
        loading="lazy"
        decoding="async"
        className="size-28 rounded-full object-cover shadow-card ring-4 ring-card sm:size-32"
      />
      <span
        aria-hidden="true"
        className="absolute -left-3 -top-2 grid size-12 place-items-center rounded-full bg-coral font-display text-xl font-bold text-white shadow-card sm:size-14 sm:text-2xl"
      >
        {String(number).padStart(2, "0")}
      </span>
    </div>
  );
}
