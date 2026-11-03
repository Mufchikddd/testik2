import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CastAvatar } from '@/components/CastAvatar';
import { EpisodeList } from '@/components/EpisodeList';
import { Poster } from '@/components/Poster';
import { getDrama } from '@/lib/catalog';
import { getEpisodesForDrama } from '@/lib/episodes';

export const revalidate = 21600;

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { drama } = await getDrama(decodeURIComponent(id));
  if (!drama) return { title: 'Не найдено' };
  return {
    title: drama.title,
    description: drama.overview ? drama.overview.slice(0, 160) : undefined,
  };
}

export default async function DoramaPage({ params }: PageProps) {
  const { id } = await params;
  const { drama, source, failed } = await getDrama(decodeURIComponent(id));

  if (failed) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold">Не удалось загрузить дораму</h1>
        <p className="mt-4 text-haze">Источник данных сейчас не отвечает. Обновите страницу через минуту.</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-aether px-6 font-medium text-night transition-opacity hover:opacity-90"
        >
          Вернуться в каталог
        </Link>
      </section>
    );
  }
  if (!drama) notFound();

  const { episodes: studioEpisodes, source: feedSource } = await getEpisodesForDrama(drama.id);
  const firstEpisode = studioEpisodes[0];

  return (
    <article className="relative isolate">
      {/* Размытый фон из постера */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[32rem] overflow-hidden">
        <div className="absolute inset-0 scale-110 opacity-30 blur-3xl">
          <Poster src={drama.backdropUrl ?? drama.posterUrl} title={drama.title} sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-night" />
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-8">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-haze transition-colors hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Все дорамы
        </Link>

        <div className="grid gap-12 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
          {/* Парящий постер с тенью на «полу» */}
          <div className="mx-auto w-full max-w-[280px] pb-8 md:mx-0 md:max-w-none">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -bottom-7 left-[12%] right-[12%] h-6 animate-shadow-drift rounded-[50%] bg-black/70 blur-xl"
              />
              <div className="relative aspect-[2/3] animate-drift overflow-hidden rounded-3xl bg-dusk ring-1 ring-mist">
                <Poster src={drama.posterUrl} title={drama.title} sizes="(min-width: 768px) 320px, 280px" priority />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="font-display text-4xl font-bold uppercase leading-[1.0] sm:text-6xl">
              {drama.title}
            </h1>
            {drama.originalTitle && <p className="mt-3 text-lg text-haze">{drama.originalTitle}</p>}

            {drama.genres.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {drama.genres.map((genre) => (
                  <li key={genre} className="rounded-full border border-mist px-3 py-1 text-sm text-ink/80">
                    {genre}
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <dt className="text-sm text-haze">Рейтинг</dt>
                <dd className="mt-1 font-display text-3xl text-halo">
                  {drama.rating !== null ? drama.rating.toFixed(1) : '—'}
                  {drama.rating !== null && <span className="text-base text-haze"> / 10</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-haze">Год выхода</dt>
                <dd className="mt-1 font-display text-3xl">{drama.year ?? '—'}</dd>
              </div>
              {drama.episodes !== null && (
                <div>
                  <dt className="text-sm text-haze">Серий</dt>
                  <dd className="mt-1 font-display text-3xl">{drama.episodes}</dd>
                </div>
              )}
            </dl>

            {firstEpisode ? (
              <div className="mt-10">
                <Link
                  href={`/watch/${encodeURIComponent(firstEpisode.id)}?from=${encodeURIComponent(drama.id)}`}
                  className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-aether px-7 font-medium text-night transition-opacity hover:opacity-90"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <path d="M5 3.2v9.6L12.6 8 5 3.2Z" />
                  </svg>
                  Смотреть
                </Link>
                {feedSource === 'sample' && (
                  <p className="mt-3 text-sm text-haze">Тестовое видео: серии студии ещё не подключены.</p>
                )}
              </div>
            ) : (
              feedSource !== 'unavailable' && feedSource !== 'sample' && (
                <p className="mt-10 text-haze">Серии этой дорамы пока не добавлены.</p>
              )
            )}

            <p className="mt-8 max-w-[65ch] text-lg leading-relaxed text-ink/85">
              {drama.overview || 'Описание пока не добавлено.'}
            </p>

            <section aria-labelledby="cast-title" className="mt-14">
              <h2 id="cast-title" className="font-display text-xl font-medium">
                В ролях
              </h2>
              {drama.cast.length > 0 ? (
                <ul className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {drama.cast.map((person) => (
                    <li key={person.id} className="flex items-center gap-3">
                      <CastAvatar name={person.name} photoUrl={person.photoUrl} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{person.name}</p>
                        {person.character && <p className="truncate text-sm text-haze">{person.character}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-haze">Список актёров сейчас недоступен.</p>
              )}
            </section>

            {studioEpisodes.length > 0 && (
              <section aria-labelledby="watch-title" className="mt-14">
                <h2 id="watch-title" className="mb-5 font-display text-2xl font-semibold uppercase">
                  Серии
                </h2>
                <EpisodeList episodes={studioEpisodes} from={drama.id} />
              </section>
            )}

            {source === 'stale' && (
              <p role="status" className="mt-10 text-sm text-haze">
                Источник данных временно недоступен — показана сохранённая ранее версия.
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
