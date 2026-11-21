import schoolmatesCta from "@/assets/skolkari-web-4.png";

export function SchoolmatesFormCrown({ compact = false, groundAccent = false, desktopWide = false }: { compact?: boolean; groundAccent?: boolean; desktopWide?: boolean }) {
  if (compact) {
    return (
      <div
        className={"relative z-10 mx-auto -mb-5 h-[82px] w-full max-w-[330px] -translate-y-5 overflow-hidden " + (desktopWide ? "lg:-mb-6 lg:h-[116px] lg:max-w-[460px] lg:-translate-y-6" : "")}
        aria-hidden="true"
      >
        <img
          src={schoolmatesCta}
          alt=""
          loading="lazy"
          decoding="async"
          width={1200}
          height={630}
          className={"absolute inset-x-0 bottom-[-10px] h-[124px] w-full scale-[1.04] object-cover object-bottom " + (desktopWide ? "lg:bottom-[-13px] lg:h-[177px] lg:scale-[1.06]" : "")}
        />
        {groundAccent && <span data-crown-ground className="pointer-events-none absolute inset-x-[13%] bottom-[1px] z-20 h-[7px] rounded-full bg-gradient-to-r from-transparent via-coral/45 to-transparent blur-[3px]" />}
      </div>
    );
  }

  return (
    <div
      className="relative z-10 mx-auto -mb-8 h-[142px] w-full max-w-[500px] -translate-y-8 overflow-hidden sm:h-[165px]"
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
      {groundAccent && <span data-crown-ground className="pointer-events-none absolute inset-x-[13%] bottom-[1px] z-20 h-[8px] rounded-full bg-gradient-to-r from-transparent via-coral/40 to-transparent blur-[4px]" />}
    </div>
  );
}
