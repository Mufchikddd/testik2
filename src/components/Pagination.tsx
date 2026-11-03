import Link from 'next/link';
import { toSearchString } from '@/lib/query';
import type { CatalogQuery } from '@/lib/types';

interface Props {
  page: number;
  totalPages: number;
  query: CatalogQuery;
  defaultLang: string;
}

/** Первая, последняя и ±2 вокруг текущей; пропуски — null. */
function visiblePages(current: number, total: number): (number | null)[] {
  const wanted = new Set(
    [1, total, current - 2, current - 1, current, current + 1, current + 2].filter((n) => n >= 1 && n <= total),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  let previous = 0;
  for (const n of sorted) {
    if (n - previous > 1) result.push(null);
    result.push(n);
    previous = n;
  }
  return result;
}

const itemClass = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm transition-colors';

export function Pagination({ page, totalPages, query, defaultLang }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => `/${toSearchString({ ...query, page: p }, defaultLang)}#catalog`;

  return (
    <nav aria-label="Страницы каталога" className="mt-16 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${itemClass} border border-mist hover:border-aether/40`}>
          Назад
        </Link>
      )}

      {visiblePages(page, totalPages).map((n, index) =>
        n === null ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-haze">
            …
          </span>
        ) : n === page ? (
          <span key={n} aria-current="page" className={`${itemClass} bg-aether font-medium text-night`}>
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} className={`${itemClass} border border-mist hover:border-aether/40`}>
            {n}
          </Link>
        ),
      )}

      {page < totalPages && (
        <Link href={href(page + 1)} className={`${itemClass} border border-mist hover:border-aether/40`}>
          Дальше
        </Link>
      )}
    </nav>
  );
}
