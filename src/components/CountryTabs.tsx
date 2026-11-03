import Link from 'next/link';
import { LANGUAGES, toSearchString } from '@/lib/query';
import type { CatalogQuery } from '@/lib/types';

interface Props {
  query: CatalogQuery;
  defaultLang: string;
  /** Сколько тайтлов в каждой стране; null — неизвестно. */
  totals: Record<string, number | null>;
}

export function CountryTabs({ query, defaultLang, totals }: Props) {
  return (
    <nav aria-label="Страна" className="flex flex-wrap items-end gap-x-8 gap-y-2">
      {LANGUAGES.map((language) => {
        const active = language.code === query.lang;
        const total = totals[language.code];
        return (
          <Link
            key={language.code}
            href={`/${toSearchString({ ...query, lang: language.code, page: 1 }, defaultLang)}#catalog`}
            prefetch={false}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px flex items-baseline gap-2 border-b-2 pb-4 font-display text-2xl font-semibold uppercase tracking-wide transition-colors ${
              active ? 'border-aether text-ink' : 'border-transparent text-haze hover:text-ink'
            }`}
          >
            {language.country}
            {total != null && (
              <span className="font-sans text-sm font-normal normal-case tracking-normal text-haze">
                {total.toLocaleString('ru-RU')}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
