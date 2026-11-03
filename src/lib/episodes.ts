import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cached } from './cache';
import { config } from './config';
import { fetchJson } from './http';
import type { Episode, FeedSource } from './types';

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

function isAllowedHost(url: URL): boolean {
  return (
    url.protocol === 'https:' &&
    config.episodes.allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
  );
}

/**
 * Приводит JSON студии к списку серий. Формат: массив (или { "episodes": [...] }) объектов
 *   { "episode": 1, "title": "Серия 1", "url": "https://.../ep1.m3u8", "dramaId": "tmdb-96648" }
 * `dramaId` необязателен: по нему серия привязывается к карточке дорамы в каталоге.
 * Записи с неверным номером, ссылкой не на https, чужим хостом или форматом не .m3u8/.mp4 отбрасываются.
 */
export function parseEpisodes(payload: unknown): Episode[] {
  const list = Array.isArray(payload) ? payload : isObj(payload) && Array.isArray(payload.episodes) ? payload.episodes : [];
  const byId = new Map<string, Episode>();

  for (const raw of list) {
    if (!isObj(raw)) continue;

    const episode = Number(raw.episode);
    if (!Number.isInteger(episode) || episode < 1) continue;

    let url: URL;
    try {
      url = new URL(String(raw.url));
    } catch {
      continue;
    }
    if (!isAllowedHost(url)) continue;

    const path = url.pathname.toLowerCase();
    const kind = path.endsWith('.m3u8') ? 'hls' : path.endsWith('.mp4') ? 'mp4' : null;
    if (!kind) continue;

    const dramaId =
      typeof raw.dramaId === 'string' && /^[a-z0-9-]{1,80}$/i.test(raw.dramaId) ? raw.dramaId : null;
    const title =
      typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 200) : `Серия ${episode}`;
    const id = dramaId ? `${dramaId}_${episode}` : String(episode);

    byId.set(id, { id, episode, title, url: url.toString(), kind, dramaId });
  }

  return [...byId.values()].sort(
    (a, b) => (a.dramaId ?? '').localeCompare(b.dramaId ?? '') || a.episode - b.episode,
  );
}

export interface EpisodesResult {
  episodes: Episode[];
  source: FeedSource;
}

/** Локальный файл с сериями: используется, пока не задан EPISODES_FEED_URL. */
const LOCAL_FILE = path.join(process.cwd(), 'data', 'episodes.json');

/**
 * Список серий. Источник один из двух:
 *  - EPISODES_FEED_URL — JSON студии по https (source: live / cache / stale);
 *  - иначе data/episodes.json в проекте (source: sample — тестовые данные для разработки).
 * Оба кэшируются в памяти и в JSON-файле на EPISODES_TTL_SECONDS (по умолчанию 300 с).
 * Если источник недоступен и кэша нет — пустой список (source: unavailable), а не тестовые видео.
 * Больше никуда сеть не ходит: страницы не парсятся, чужие сайты не запрашиваются.
 */
export async function getEpisodes(): Promise<EpisodesResult> {
  const { feedUrl } = config.episodes;

  const loader = feedUrl
    ? async () => parseEpisodes(await fetchJson<unknown>(feedUrl, { revalidate: config.episodesTtlSeconds }))
    : async () => parseEpisodes(JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')));

  try {
    const result = await cached(feedUrl ? 'episodes-feed' : 'episodes-file', loader, {
      ttlMs: config.episodesTtlMs,
    });
    const source: FeedSource = !feedUrl
      ? 'sample'
      : result.origin === 'live'
        ? 'live'
        : result.origin === 'stale'
          ? 'stale'
          : 'cache';
    return { episodes: result.data, source };
  } catch (error) {
    console.error('[episodes] не удалось получить список серий:', error);
    return { episodes: [], source: 'unavailable' };
  }
}

/** Серии конкретной дорамы: только те, у которых dramaId совпадает с id дорамы. */
export async function getEpisodesForDrama(dramaId: string): Promise<EpisodesResult> {
  const { episodes, source } = await getEpisodes();
  return { episodes: episodes.filter((e) => e.dramaId === dramaId), source };
}
