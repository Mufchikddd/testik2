import Link from 'next/link';
import { CatalogFilters } from '@/components/CatalogFilters';
import { CountryTabs } from '@/components/CountryTabs';
import { DoramaCard } from '@/components/DoramaCard';
import { Hero, type HeroItem } from '@/components/Hero';
import { Pagination } from '@/components/Pagination';
import { getCatalogPage } from '@/lib/catalog';
import { config } from '@/lib/config';
import { getEpisodesForDrama } from '@/lib/episodes';
import { LANGUAGES, parseQuery } from '@/lib/query';
import type { DataSource } from '@/lib/types';

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const NOTICES: Partial<Record<DataSource, string>> = {
  mock: 'Показаны демо-данные: внешний источник не подключён или недоступен.',
  stale: 'Источник временно недоступен — показаны сохранённые ранее данные.',
};

const HERO_SIZE = 6;

export default async function HomePage({ searchParams }: PageProps) {
  const defaultLang = config.tmdb.originalLanguage;
  const query = parseQuery(await searchParams, defaultLang);

  const [{ page, source }, tabResults] = await Promise.all([
    getCatalogPage(query),
    // Первая страница каждой страны: из неё берутся счётчики во вкладках
    Promise.all(
      LANGUAGES.map((l) => getCatalogPage({ q: '', year: null, minRating: 0, sort: 'popular', lang: l.code, page: 1 })),
    ),
  ]);

  const totals: Record<string, number | null> = Object.fromEntries(
    LANGUAGES.map((l, i) => [l.code, tabResults[i].source === 'mock' ? null : tabResults[i].page.totalResults]),
  );

  // Герой показываем только на «чистой» главной, без поиска, фильтров и листания
  const isDefaultView =
    query.q === '' && query.year === null && query.minRating === 0 && query.sort === 'popular' && query.page === 1;

  let heroItems: HeroItem[] = [];
  if (isDefaultView) {
    const withArt = page.items.filter((d) => d.backdropUrl && d.overview);
    const chosen = (withArt.length >= 4 ? withArt : page.items).slice(0, HERO_SIZE);
    const country = LANGUAGES.find((l) => l.code === query.lang)?.country ?? '';

    heroItems = await Promise.all(
      chosen.map(async (d) => {
        const { episodes } = await getEpisodesForDrama(d.id);
        const first = episodes[0];
        return {
          id: d.id,
          title: d.title,
          posterUrl: d.posterUrl,
          backdropUrl: d.backdropUrl,
          overview: d.overview,
          year: d.year,
          rating: d.rating,
          genres: d.genres,
          episodes: d.episodes,
          country,
          watchHref: first ? `/watch/${encodeURIComponent(first.id)}?from=${encodeURIComponent(d.id)}` : null,
        };
      }),
    );
  }

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1989 }, (_, i) => thisYear - i);

  return (
    <>
      <h1 className="sr-only">Каталог дорам</h1>

      {heroItems.length > 0 && <Hero items={heroItems} />}

      <section id="catalog" aria-label="Каталог" className="mx-auto max-w-7xl scroll-mt-20 px-5 pt-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-mist/60">
          <CountryTabs query={query} defaultLang={defaultLang} totals={totals} />
          <Link href="/watch" className="pb-4 text-sm font-medium text-aether transition-opacity hover:opacity-80">
            Все серии
          </Link>
        </div>

        {NOTICES[source] && (
          <p role="status" className="mt-6 rounded-xl border border-mist bg-dusk px-4 py-3 text-sm text-haze">
            {NOTICES[source]}
          </p>
        )}

        <div className="mt-8">
          <CatalogFilters query={query} defaultLang={defaultLang} years={years} total={page.totalResults} />
        </div>

        {page.items.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-12 pt-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {page.items.map((drama, index) => (
              <DoramaCard key={drama.id} drama={drama} priority={!isDefaultView && page.page === 1 && index < 5} />
            ))}
          </ul>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-2xl font-semibold uppercase">Ничего не нашлось</p>
            <p className="mt-3 text-haze">Измените запрос или сбросьте фильтры.</p>
            <Link href="/" className="mt-6 inline-block text-aether hover:opacity-80">
              Сбросить фильтры
            </Link>
          </div>
        )}

        <Pagination page={page.page} totalPages={page.totalPages} query={query} defaultLang={defaultLang} />
      </section>
    </>
  );
}
