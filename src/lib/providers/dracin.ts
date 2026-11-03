import 'server-only';
import { config } from '../config';
import { cached } from '../cache';
import { fetchJson } from '../http';
import { paginateLocally } from '../query';
import type { CastMember, Drama, DramaProvider } from '../types';
import { parseYear, round1 } from '../utils';

/**
 * ЭКСПЕРИМЕНТАЛЬНЫЙ адаптер DracinAPI (https://dracinapi.com).
 *
 * Публичная документация описывает методы (search / detail / feed / episodes),
 * но не формат JSON-ответов, поэтому:
 *   • пути и заголовок авторизации вынесены в .env (DRACIN_*);
 *   • ответ приводится к модели Drama «терпимым» нормализатором ниже.
 * После получения ключа сверьте с реальным ответом и поправьте списки ключей.
 *
 * Важно: это сервис коротких драм (DramaBox, ReelShort…). Год, рейтинг и актёры
 * там могут отсутствовать — для них UI покажет прочерк/заглушку.
 */

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const pick = (o: Raw, keys: string[]) =>
  keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');
const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v.trim() || undefined : typeof v === 'number' ? String(v) : undefined;
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(n) ? n : null;
};
const names = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.flatMap((item) => {
        const name = typeof item === 'string' ? item : isObj(item) ? str(pick(item, ['name', 'title'])) : undefined;
        return name ? [name] : [];
      })
    : [];

/** Достаёт массив объектов из ответов вида [..], {data:[..]}, {data:{list:[..]}} и т.п. */
function unwrapList(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload.filter(isObj);
  if (!isObj(payload)) return [];
  for (const key of ['data', 'results', 'list', 'items', 'dramas']) {
    const found = unwrapList(payload[key]);
    if (found.length) return found;
  }
  return [];
}

function unwrapObject(payload: unknown): Raw | null {
  if (!isObj(payload)) return null;
  return isObj(payload.data) ? payload.data : payload;
}

function normalize(raw: Raw, detailed: boolean): Drama | null {
  const id = str(pick(raw, ['id', 'drama_id', 'dramaId', 'book_id', 'bookId', 'shortPlayId']));
  const title = str(pick(raw, ['title', 'name', 'drama_name', 'dramaName', 'bookName']));
  if (!id || !title) return null;

  const rawCast = pick(raw, ['actors', 'cast', 'casts']);
  const cast: CastMember[] = Array.isArray(rawCast)
    ? rawCast.flatMap((item, i) => {
        const obj = isObj(item) ? item : null;
        const name = typeof item === 'string' ? item : obj ? str(pick(obj, ['name', 'actor_name'])) : undefined;
        if (!name) return [];
        return [
          {
            id: `${id}-actor-${i}`,
            name,
            character: obj ? str(pick(obj, ['role', 'character'])) : undefined,
            photoUrl: obj ? (str(pick(obj, ['avatar', 'photo', 'image'])) ?? null) : null,
          },
        ];
      })
    : [];

  const rating = num(pick(raw, ['rating', 'score', 'vote_average'])); // считаем шкалу 0–10

  return {
    id: `dracin-${id}`,
    title,
    posterUrl: str(pick(raw, ['cover', 'poster', 'image', 'thumb', 'coverUrl', 'cover_url'])) ?? null,
    backdropUrl: null,
    overview: str(pick(raw, ['description', 'desc', 'synopsis', 'introduction', 'intro'])) ?? '',
    year: parseYear(str(pick(raw, ['release_date', 'releaseDate', 'year', 'create_time']))),
    rating: rating === null ? null : round1(rating),
    genres: names(pick(raw, ['genres', 'tags', 'categories'])),
    cast,
    episodes: num(pick(raw, ['episodes', 'episode_count', 'total_episodes'])),
    detailsLoaded: detailed,
    source: 'dracin',
  };
}

function buildUrl(template: string, id?: string): string {
  const { baseUrl, platform } = config.dracin;
  const path = template
    .replace('{platform}', encodeURIComponent(platform))
    .replace('{id}', encodeURIComponent(id ?? ''));
  return baseUrl.replace(/\/$/, '') + path;
}

function authHeaders(): Record<string, string> {
  const { apiKey, authHeader, authPrefix } = config.dracin;
  if (!apiKey) throw new Error('Не задан DRACIN_API_KEY');
  return { [authHeader]: `${authPrefix}${apiKey}` };
}

export const dracinProvider: DramaProvider = {
  name: 'dracin',

  async fetchPage(query) {
    // Лента запрашивается целиком один раз и кэшируется, дальше фильтры и страницы — в памяти.
    const { data } = await cached(
      'dracin-feed',
      async () => {
        const payload = await fetchJson<unknown>(buildUrl(config.dracin.feedPath), {
          headers: authHeaders(),
        });
        return unwrapList(payload)
          .map((raw) => normalize(raw, false))
          .filter((d): d is Drama => d !== null);
      },
      { ttlMs: config.cacheTtlMs },
    );
    return paginateLocally(data, query);
  },

  async fetchDrama(rawId) {
    const payload = await fetchJson<unknown>(buildUrl(config.dracin.detailPath, rawId), {
      headers: authHeaders(),
    });
    const raw = unwrapObject(payload);
    return raw ? normalize(raw, true) : null;
  },
};
