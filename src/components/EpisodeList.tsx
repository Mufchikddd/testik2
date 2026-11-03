import Link from 'next/link';
import type { Episode, FeedSource } from '@/lib/types';

export const FEED_NOTICES: Partial<Record<FeedSource, string>> = {
  sample: 'Показаны тестовые серии: список студии ещё не подключён.',
  stale: 'Источник временно недоступен — показан сохранённый ранее список.',
  unavailable: 'Список серий временно недоступен. Обновите страницу чуть позже.',
};

export function FeedNotice({ source }: { source: FeedSource }) {
  const text = FEED_NOTICES[source];
  if (!text) return null;
  return (
    <p role="status" className="mb-6 rounded-xl border border-mist bg-dusk px-4 py-3 text-sm text-haze">
      {text}
    </p>
  );
}

/** `from` — id дорамы, с карточки которой пришёл зритель: по нему плеер знает, куда вернуть. */
export function EpisodeList({
  episodes,
  currentId,
  from,
}: {
  episodes: Episode[];
  currentId?: string;
  from?: string;
}) {
  return (
    <ul className="divide-y divide-mist/60 overflow-hidden rounded-2xl border border-mist">
      {episodes.map((episode) => {
        const current = episode.id === currentId;
        return (
          <li key={episode.id}>
            <Link
              href={`/watch/${encodeURIComponent(episode.id)}${from ? `?from=${encodeURIComponent(from)}` : ''}`}
              prefetch={false}
              aria-current={current ? 'page' : undefined}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-dusk ${current ? 'bg-dusk' : ''}`}
            >
              <span className="w-8 shrink-0 text-sm tabular-nums text-haze">{episode.episode}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{episode.title}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="shrink-0 text-aether">
                <path d="M5 3.2v9.6L12.6 8 5 3.2Z" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
