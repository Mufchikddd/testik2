import type { Metadata } from 'next';
import { EpisodeList, FeedNotice } from '@/components/EpisodeList';
import { VideoPlayer } from '@/components/VideoPlayer';
import { getEpisodes } from '@/lib/episodes';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Смотреть' };

export default async function WatchPage() {
  const { episodes, source } = await getEpisodes();
  const first = episodes[0];

  return (
    <section className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <h1 className="font-display text-5xl font-bold uppercase leading-[1.0] sm:text-6xl">Смотреть</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze">Серии с озвучкой студии «Левитация».</p>

      <div className="mt-10">
        <FeedNotice source={source} />

        {first ? (
          <>
            <div className="relative pb-6">
              <span
                aria-hidden
                className="absolute -bottom-1 left-[8%] right-[8%] h-6 rounded-[50%] bg-black/60 blur-xl"
              />
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-mist">
                <VideoPlayer src={first.url} kind={first.kind} title={first.title} />
              </div>
            </div>
            <p className="mt-6 text-sm text-haze">Сейчас в плеере: {first.title}</p>

            <h2 className="mb-5 mt-12 font-display text-2xl font-semibold uppercase">Все серии</h2>
            <EpisodeList episodes={episodes} />
          </>
        ) : (
          source !== 'unavailable' && <p className="text-haze">Серий пока нет.</p>
        )}
      </div>
    </section>
  );
}
