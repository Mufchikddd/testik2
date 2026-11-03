export function Rating({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-night/80 px-2 py-1 text-xs font-medium text-halo backdrop-blur">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
        <path d="m6 .8 1.6 3.4 3.7.5-2.7 2.6.7 3.7L6 9.2l-3.3 1.8.7-3.7L.7 4.7l3.7-.5L6 .8Z" />
      </svg>
      <span className="sr-only">Рейтинг:</span>
      {value.toFixed(1)}
    </span>
  );
}
