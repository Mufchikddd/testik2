import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EpisodeList, FeedNotice } from '@/components/EpisodeList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { getDrama } from '@/lib/catalog';
import { getEpisodes } from '@/lib/episodes';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { episodes } = await getEpisodes();
  const episode = episodes.find((e) => e.id === decodeURIComponent(id));
  return { title: episode ? episode.title : 'Серия' };
}

const navLink =
  'inline-flex h-10 items-center rounded-xl border border-mist px-4 text-sm transition-colors hover:border-aether/40';

export default async function EpisodePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const rawFrom = (await searchParams).from;
  const fromParam = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const from = fromParam && /^[a-z0-9-]{1,80}$/i.test(fromParam) ? fromParam : undefined;
  const fromDrama = from ? (await getDrama(from)).drama : null;
  const suffix = fromDrama && from ? `?from=${encodeURIComponent(from)}` : '';
  const { episodes, source } = await getEpisodes();

  if (source === 'unavailable') {
    return (
      <section className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold">Серия сейчас недоступна</h1>
        <p className="mt-4 text-haze">Список серий не загружается. Обновите страницу чуть позже.</p>
        <Link href="/watch" className={`${navLink} mt-8`}>
          Все серии
        </Link>
      </section>
    );
  }

  const episode = episodes.find((e) => e.id === decodeURIComponent(id));
  if (!episode) notFound();

  // Предыдущая и следующая серии — только внутри той же дорамы
  const group = episodes.filter((e) => e.dramaId === episode.dramaId);
  const index = group.findIndex((e) => e.id === episode.id);
  const prev = group[index - 1];
  const next = group[index + 1];

  return (
    <article className="mx-auto max-w-5xl px-5 pb-24 pt-8 sm:px-8">
      <Link
        href={fromDrama ? `/dorama/${from}` : '/watch'}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-haze transition-colors hover:text-ink"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {fromDrama ? fromDrama.title : 'Все серии'}
      </Link>

      <FeedNotice source={source} />

      <div className="relative pb-6">
        <span
          aria-hidden
          className="absolute -bottom-1 left-[8%] right-[8%] h-6 rounded-[50%] bg-black/60 blur-xl"
        />
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-mist">
          <VideoPlayer src={episode.url} kind={episode.kind} title={episode.title} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{episode.title}</h1>
        <div className="flex gap-3">
          {prev && (
            <Link href={`/watch/${encodeURIComponent(prev.id)}${suffix}`} className={navLink}>
              Предыдущая
            </Link>
          )}
          {next && (
            <Link href={`/watch/${encodeURIComponent(next.id)}${suffix}`} className={navLink}>
              Следующая
            </Link>
          )}
        </div>
      </div>

      <h2 className="mb-5 mt-14 font-display text-xl font-medium">Все серии</h2>
      <EpisodeList episodes={group} currentId={episode.id} from={suffix ? from : undefined} />
    </article>
  );
}
