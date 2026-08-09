export function GoogleBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex w-full items-center justify-between gap-x-1.5 rounded-full bg-card/90 px-3 py-1.5 shadow-soft backdrop-blur-sm sm:gap-x-2 sm:px-4 sm:py-2 ${className}`}
    >
      <span className="text-xs leading-none tracking-tight text-[#F5B301] sm:text-base">
        ★★★★★
      </span>
      <span className="font-display text-[0.7rem] font-bold text-forest sm:text-sm">5.0</span>
      <span className="text-[0.68rem] font-semibold whitespace-nowrap text-forest sm:text-sm">
        na Google
      </span>
      <span className="text-forest/40">•</span>
      <span className="text-[0.68rem] font-semibold whitespace-nowrap text-forest sm:text-sm">
        100+ spokojných psíkov
      </span>
      <svg viewBox="0 0 48 48" className="size-3.5 shrink-0 sm:size-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.4 28.4a14.6 14.6 0 0 1 0-8.8l-7.8-6.1a23.9 23.9 0 0 0 0 21l7.8-6.1z"
        />
        <path
          fill="#34A853"
          d="M24 47.5c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.8 2.2-7.7 2.2-6.3 0-11.7-4.2-13.6-10l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
        />
      </svg>
    </div>
  );
}
