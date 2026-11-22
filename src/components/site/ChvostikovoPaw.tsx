/** Site paw silhouette shared with the existing PawTrailBackground artwork. */
export function ChvostikovoPaw({ className = "size-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 33 36" fill="currentColor" className={className} focusable="false">
      <ellipse cx="5" cy="15" rx="3.6" ry="5" transform="rotate(-24 5 15)" />
      <ellipse cx="12" cy="7" rx="3.7" ry="5.2" transform="rotate(-8 12 7)" />
      <ellipse cx="21" cy="7" rx="3.7" ry="5.2" transform="rotate(8 21 7)" />
      <ellipse cx="28" cy="15" rx="3.6" ry="5" transform="rotate(24 28 15)" />
      <path d="M8 25C9 21 12 17 16 17S23 21 25 25C28 32 23 35 19 32Q16 30 13 32C8 35 4 31 8 25Z" />
    </svg>
  );
}
