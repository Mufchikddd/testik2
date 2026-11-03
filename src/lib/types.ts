export const PROVIDER_NAMES = ['tmdb', 'dracin', 'mock'] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];

/** Откуда реально пришли данные на этот запрос. */
export type DataSource = 'live' | 'cache' | 'stale' | 'mock';

export interface CastMember {
  id: string;
  name: string;
  character?: string;
  photoUrl: string | null;
}

/** Единая модель дорамы. Все провайдеры приводят свои данные к ней. */
export interface Drama {
  /** Формат `<провайдер>-<id в источнике>`, например `tmdb-96648`. Используется в URL. */
  id: string;
  title: string;
  originalTitle?: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  year: number | null;
  /** Шкала 0–10 или null, если оценок ещё нет. */
  rating: number | null;
  genres: string[];
  cast: CastMember[];
  episodes: number | null;
  /** false — пришло из списка (без актёров), true — загружена полная карточка. */
  detailsLoaded: boolean;
  source: ProviderName;
}

export type SortKey = 'popular' | 'rating' | 'newest';

/** Параметры каталога — они же живут в адресной строке (?q=&year=&page=...). */
export interface CatalogQuery {
  q: string;
  year: number | null;
  minRating: number;
  sort: SortKey;
  /** Язык оригинала: ko, zh, ja, th... */
  lang: string;
  page: number;
}

export interface CatalogPage {
  items: Drama[];
  page: number;
  totalPages: number;
  /** null — точное число неизвестно (например, при поиске). */
  totalResults: number | null;
}

/** Контракт, который реализует каждый источник данных. */
export interface DramaProvider {
  name: ProviderName;
  /** Одна страница каталога с учётом фильтров. Актёры здесь могут отсутствовать. */
  fetchPage(query: CatalogQuery): Promise<CatalogPage>;
  /** Полная карточка. `rawId` — id без префикса провайдера. null — если не найдено. */
  fetchDrama(rawId: string): Promise<Drama | null>;
}

/** Серия из официального JSON-файла студии. */
export interface Episode {
  /** Стабильный id для URL: `<dramaId>_<номер>` или просто номер, если дорама не указана. */
  id: string;
  episode: number;
  title: string;
  /** Прямая ссылка на видеофайл (проверена: https и разрешённый хост). */
  url: string;
  kind: 'hls' | 'mp4';
  /** id дорамы из каталога (например `tmdb-96648`), если студия его указала. */
  dramaId: string | null;
}

export type FeedSource = 'live' | 'cache' | 'stale' | 'sample' | 'unavailable';
