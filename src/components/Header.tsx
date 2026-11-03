import Link from 'next/link';

function LevitationMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor" aria-hidden>
      <circle cx="14" cy="10" r="7" />
      <ellipse cx="14" cy="24" rx="7" ry="1.8" opacity="0.35" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-mist/60 bg-night/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="text-aether">
            <LevitationMark />
          </span>
          <span className="font-display text-xl font-bold uppercase tracking-wide">Левитация</span>
        </Link>

        <nav aria-label="Разделы" className="flex items-center gap-5 text-sm font-medium text-haze">
          <Link href="/" className="transition-colors hover:text-ink">
            Главная
          </Link>
          <Link href="/#catalog" className="transition-colors hover:text-ink">
            Каталог
          </Link>
          <Link href="/watch" className="transition-colors hover:text-ink">
            Смотреть
          </Link>
        </nav>

        <form action="/" role="search" className="relative ml-auto hidden w-full max-w-sm sm:block">
          <label htmlFor="site-search" className="sr-only">
            Найти дораму
          </label>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-haze"
          >
            <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Найти дораму"
            autoComplete="off"
            className="h-10 w-full rounded-full border border-mist bg-dusk pl-10 pr-4 text-sm text-ink placeholder:text-haze/70 transition-colors hover:border-aether/40 focus-visible:border-aether"
          />
        </form>
      </div>
    </header>
  );
}
