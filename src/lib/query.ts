import type { CatalogPage, CatalogQuery, Drama } from './types';

export const PAGE_SIZE = 20;
/** TMDB отдаёт не больше 500 страниц на один запрос. */
export const MAX_PAGE = 500;

export const LANGUAGES = [
  { code: 'ko', label: 'Корейские', country: 'Корея' },
  { code: 'zh', label: 'Китайские', country: 'Китай' },
  { code: 'ja', label: 'Японские', country: 'Япония' },
  { code: 'th', label: 'Тайские', country: 'Таиланд' },
] as const;

export const RATING_OPTIONS = [
  { value: 0, label: 'Любой' },
  { value: 7, label: '7 и выше' },
  { value: 8, label: '8 и выше' },
  { value: 8.5, label: '8,5 и выше' },
];

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'newest', label: 'Сначала новые' },
] as const;

type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Безопасно превращает searchParams в параметры каталога. */
export function parseQuery(params: RawParams, defaultLang: string): CatalogQuery {
  const sort = first(params.sort);
  const year = Number.parseInt(first(params.year) ?? '', 10);
  const rating = Number.parseFloat(first(params.rating) ?? '');
  const page = Number.parseInt(first(params.page) ?? '', 10);
  const lang = first(params.lang);

  return {
    q: (first(params.q) ?? '').trim().slice(0, 100),
    year: Number.isFinite(year) && year >= 1950 && year <= 2100 ? year : null,
    minRating: Number.isFinite(rating) && rating > 0 && rating <= 10 ? rating : 0,
    sort: sort === 'rating' || sort === 'newest' ? sort : 'popular',
    lang: LANGUAGES.find((l) => l.code === lang)?.code ?? defaultLang,
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Обратное преобразование: параметры → «?q=...&page=2». Значения по умолчанию опускаются. */
export function toSearchString(query: CatalogQuery, defaultLang: string): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.year) params.set('year', String(query.year));
  if (query.minRating > 0) params.set('rating', String(query.minRating));
  if (query.sort !== 'popular') params.set('sort', query.sort);
  if (query.lang !== defaultLang) params.set('lang', query.lang);
  if (query.page > 1) params.set('page', String(query.page));
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Фильтрация и листание готового списка в памяти — для мока и источников без серверных фильтров. */
export function paginateLocally(items: Drama[], query: CatalogQuery): CatalogPage {
  const needle = query.q.toLowerCase();
  const list = items.filter(
    (d) =>
      (!needle || `${d.title} ${d.originalTitle ?? ''}`.toLowerCase().includes(needle)) &&
      (!query.year || d.year === query.year) &&
      (d.rating ?? 0) >= query.minRating,
  );

  if (query.sort === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (query.sort === 'newest') list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  return {
    items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    totalPages,
    totalResults: list.length,
  };
}
