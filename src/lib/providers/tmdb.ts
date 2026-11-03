import 'server-only';
import { config } from '../config';
import { fetchJson, HttpError } from '../http';
import { MAX_PAGE } from '../query';
import type { CastMember, CatalogQuery, Drama, DramaProvider } from '../types';
import { parseYear, round1 } from '../utils';

const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const MAX_CAST = 12;

interface TmdbListItem {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}
interface TmdbList {
  results: TmdbListItem[];
  total_pages: number;
  total_results: number;
}
interface TmdbDetail extends Omit<TmdbListItem, 'genre_ids'> {
  genres: { id: number; name: string }[];
  number_of_episodes?: number;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
}

type Params = Record<string, string | number>;

function request<T>(path: string, params: Params = {}): Promise<T> {
  const { apiKey, readToken, language } = config.tmdb;
  const url = new URL(API + path);
  url.searchParams.set('language', language);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const headers: Record<string, string> = {};
  if (readToken) headers.Authorization = `Bearer ${readToken}`;
  else if (apiKey) url.searchParams.set('api_key', apiKey);
  else throw new Error('Не задан TMDB_API_KEY или TMDB_READ_TOKEN');

  return fetchJson<T>(url.toString(), { headers });
}

const image = (path: string | null, size: string) => (path ? `${IMG}/${size}${path}` : null);

const SORT_BY: Record<CatalogQuery['sort'], string> = {
  popular: 'popularity.desc',
  rating: 'vote_average.desc',
  newest: 'first_air_date.desc',
};

const EXCLUDED_GENRES = new Set(config.tmdb.excludeGenres);

/** Названия жанров не меняются, поэтому держим их в памяти процесса. */
let genreNames: Map<number, string> | null = null;
async function getGenreNames(): Promise<Map<number, string>> {
  if (!genreNames) {
    try {
      const res = await request<{ genres: { id: number; name: string }[] }>('/genre/tv/list');
      genreNames = new Map(res.genres.map((g) => [g.id, g.name]));
    } catch {
      return new Map(); // без жанров каталог всё равно работает
    }
  }
  return genreNames;
}

function toDrama(
  item: TmdbListItem | TmdbDetail,
  genres: string[],
  cast: CastMember[],
  detailsLoaded: boolean,
  episodes: number | null,
): Drama {
  return {
    id: `tmdb-${item.id}`,
    title: item.name,
    originalTitle: item.original_name !== item.name ? item.original_name : undefined,
    posterUrl: image(item.poster_path, 'w500'),
    backdropUrl: image(item.backdrop_path, 'w1280'),
    overview: item.overview ?? '',
    year: parseYear(item.first_air_date),
    rating: item.vote_count > 0 ? round1(item.vote_average) : null,
    genres,
    cast,
    episodes,
    detailsLoaded,
    source: 'tmdb',
  };
}

/** Каталог без текста запроса: все фильтры и сортировка выполняются на стороне TMDB. */
function discover(query: CatalogQuery) {
  const params: Params = {
    with_original_language: query.lang,
    sort_by: SORT_BY[query.sort],
    page: query.page,
  };
  if (config.tmdb.excludeGenres.length) params.without_genres = config.tmdb.excludeGenres.join('|');
  if (query.year) params.first_air_date_year = query.year;
  if (query.minRating > 0) params['vote_average.gte'] = query.minRating;
  // Без порога голосов «лучшими» станут тайтлы с одной оценкой 10
  if (query.sort === 'rating' || query.minRating > 0) params['vote_count.gte'] = 10;
  // В «Сначала новые» не показываем ещё не вышедшие
  if (query.sort === 'newest') params['first_air_date.lte'] = new Date().toISOString().slice(0, 10);
  return request<TmdbList>('/discover/tv', params);
}

/** Поиск по названию: TMDB не умеет фильтровать поиск по языку и рейтингу, поэтому дофильтровываем сами. */
function search(query: CatalogQuery) {
  const params: Params = { query: query.q, page: query.page };
  if (query.year) params.first_air_date_year = query.year;
  return request<TmdbList>('/search/tv', params);
}

export const tmdbProvider: DramaProvider = {
  name: 'tmdb',

  async fetchPage(query) {
    const searching = query.q !== '';
    const [names, res] = await Promise.all([
      getGenreNames(),
      searching ? search(query) : discover(query),
    ]);

    let results = res.results.filter(
      (item) => item.name && !item.genre_ids.some((id) => EXCLUDED_GENRES.has(id)),
    );
    if (searching) {
      results = results.filter(
        (item) =>
          item.original_language === query.lang &&
          (item.vote_count > 0 ? item.vote_average : 0) >= query.minRating,
      );
    }

    return {
      items: results.map((item) =>
        toDrama(
          item,
          item.genre_ids.map((id) => names.get(id)).filter((n): n is string => Boolean(n)),
          [],
          false,
          null,
        ),
      ),
      page: query.page,
      totalPages: Math.min(Math.max(res.total_pages, 1), MAX_PAGE),
      // При поиске число после дофильтрации неточное — не показываем его.
      totalResults: searching ? null : res.total_results,
    };
  },

  async fetchDrama(rawId) {
    if (!/^\d+$/.test(rawId)) return null;

    try {
      const detail = await request<TmdbDetail>(`/tv/${rawId}`, { append_to_response: 'credits' });

      // Для части тайтлов нет описания на выбранном языке — берём английское.
      if (!detail.overview && config.tmdb.language !== 'en-US') {
        const en = await request<TmdbDetail>(`/tv/${rawId}`, { language: 'en-US' }).catch(() => null);
        if (en?.overview) detail.overview = en.overview;
      }

      const cast: CastMember[] = (detail.credits?.cast ?? []).slice(0, MAX_CAST).map((c) => ({
        id: String(c.id),
        name: c.name,
        character: c.character || undefined,
        photoUrl: image(c.profile_path, 'w185'),
      }));

      return toDrama(
        detail,
        detail.genres.map((g) => g.name),
        cast,
        true,
        detail.number_of_episodes ?? null,
      );
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return null;
      throw error;
    }
  },
};
