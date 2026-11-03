'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hashHue } from '@/lib/utils';
import { Poster } from './Poster';

export interface HeroItem {
  id: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  year: number | null;
  rating: number | null;
  genres: string[];
  episodes: number | null;
  country: string;
  /** Ссылка на первую серию, если у дорамы есть серии студии. */
  watchHref: string | null;
}

const ROTATE_MS = 9000;

const primaryButton =
  'inline-flex h-12 items-center gap-2.5 rounded-xl bg-aether px-7 font-medium text-night transition-opacity hover:opacity-90';
const secondaryButton =
  'inline-flex h-12 items-center rounded-xl bg-ink/10 px-7 font-medium text-ink transition-colors hover:bg-ink/15';

/**
 * Герой главной: крупная подача одной дорамы и лента миниатюр, по которым герой переключается.
 * Сам листает каждые 9 секунд, пока на него не навели курсор или фокус и если у человека не
 * включено «уменьшение движения».
 */
export function Hero({ items }: { items: HeroItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || items.length < 2) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reducedMotion, items.length]);

  const item = items[active];
  if (!item) return null;

  const stats = [
    item.year ? String(item.year) : null,
    item.episodes ? `${item.episodes} серий` : null,
    item.genres.length ? item.genres.slice(0, 3).join(', ') : null,
  ].filter((v): v is string => Boolean(v));

  return (
    <section
      aria-label="Рекомендуем"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative isolate overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div key={item.id} className="absolute inset-0 animate-fade">
          {item.backdropUrl ? (
            <Poster src={item.backdropUrl} title={item.title} sizes="100vw" priority={active === 0} />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `hsl(${hashHue(item.title)} 35% 18%)` }}
            />
          )}
        </div>
        {/* Затемнение слева и снизу — чтобы текст читался на любом кадре */}
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/25 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[32rem] max-w-7xl flex-col justify-center px-5 pb-10 pt-16 sm:px-8 lg:min-h-[38rem]">
        <p className="flex items-center gap-2 text-sm font-medium text-aether">
          <span aria-hidden className="size-2 rounded-full bg-aether" />
          Сейчас популярно, {item.country}
        </p>

        <h2
          key={item.id}
          className="mt-5 max-w-3xl animate-fade font-display text-5xl font-bold uppercase leading-[0.95] sm:text-7xl lg:text-8xl"
        >
          {item.title}
        </h2>

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-medium">
          {item.rating !== null && (
            <span className="inline-flex items-center gap-1.5 text-halo">
              <svg width="15" height="15" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <path d="m6 .8 1.6 3.4 3.7.5-2.7 2.6.7 3.7L6 9.2l-3.3 1.8.7-3.7L.7 4.7l3.7-.5L6 .8Z" />
              </svg>
              <span className="sr-only">Рейтинг:</span>
              {item.rating.toFixed(1)}
            </span>
          )}
          {stats.map((stat) => (
            <span key={stat} className="flex items-center gap-3">
              <span aria-hidden className="text-haze">
                /
              </span>
              {stat}
            </span>
          ))}
        </p>

        {item.overview && (
          <p className="mt-5 line-clamp-3 max-w-2xl text-lg leading-relaxed text-ink/85">{item.overview}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {item.watchHref && (
            <Link href={item.watchHref} className={primaryButton}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M5 3.2v9.6L12.6 8 5 3.2Z" />
              </svg>
              Смотреть
            </Link>
          )}
          <Link href={`/dorama/${item.id}`} className={item.watchHref ? secondaryButton : primaryButton}>
            Подробнее
          </Link>
        </div>
      </div>

      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 pb-10 sm:grid-cols-3 sm:px-8 lg:grid-cols-6">
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Показать: ${it.title}`}
              className="group block w-full text-left"
            >
              <div
                className={`relative aspect-video overflow-hidden rounded-xl ring-2 transition ${
                  i === active ? 'ring-aether' : 'opacity-70 ring-transparent group-hover:opacity-100'
                }`}
              >
                <Poster
                  src={it.backdropUrl ?? it.posterUrl}
                  title={it.title}
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                />
              </div>
              <div className="mt-3 h-0.5 overflow-hidden bg-mist/70">
                {i === active && (
                  <div
                    key={`${active}-${paused}`}
                    className="h-full origin-left bg-aether"
                    style={
                      paused || reducedMotion
                        ? undefined
                        : { animation: `hero-progress ${ROTATE_MS}ms linear forwards` }
                    }
                  />
                )}
              </div>
              <p className={`mt-2 truncate text-sm font-medium ${i === active ? 'text-ink' : 'text-haze'}`}>
                {it.title}
              </p>
              <p className="truncate text-sm text-haze">
                {[it.year, it.genres[0]].filter(Boolean).join(', ')}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
