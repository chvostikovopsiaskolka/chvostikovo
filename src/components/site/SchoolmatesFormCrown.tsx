import schoolmatesCta from "@/assets/skolkari-web-4.png";

export function SchoolmatesFormCrown({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="relative z-10 mx-auto -mb-5 h-[82px] w-full max-w-[330px] overflow-hidden"
        aria-hidden="true"
      >
        <img
          src={schoolmatesCta}
          alt=""
          loading="lazy"
          decoding="async"
          width={1200}
          height={630}
          className="absolute inset-x-0 bottom-[-10px] h-[124px] w-full scale-[1.04] object-cover object-bottom"
        />
      </div>
    );
  }

  return (
    <div
      className="relative z-10 mx-auto -mb-8 h-[142px] w-full max-w-[500px] overflow-hidden sm:h-[165px]"
      aria-hidden="true"
    >
      <img
        src={schoolmatesCta}
        alt=""
        loading="lazy"
        decoding="async"
        width={1200}
        height={630}
        className="absolute inset-x-0 bottom-[-14px] h-[185px] w-full scale-[1.07] object-cover object-bottom sm:h-[210px] sm:scale-[1.06]"
      />
    </div>
  );
}
