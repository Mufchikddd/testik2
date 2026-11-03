import { PROVIDER_NAMES, type ProviderName } from './types';

const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const cacheTtlSeconds = positiveInt(process.env.CATALOG_TTL_SECONDS, 6 * 60 * 60);
const episodesTtlSeconds = positiveInt(process.env.EPISODES_TTL_SECONDS, 5 * 60);

export const config = {
  cacheTtlSeconds,
  cacheTtlMs: cacheTtlSeconds * 1000,
  episodesTtlSeconds,
  episodesTtlMs: episodesTtlSeconds * 1000,
  requestTimeoutMs: positiveInt(process.env.REQUEST_TIMEOUT_MS, 8000),

  tmdb: {
    apiKey: process.env.TMDB_API_KEY,
    readToken: process.env.TMDB_READ_TOKEN,
    language: process.env.TMDB_LANGUAGE ?? 'ru-RU',
    originalLanguage: process.env.TMDB_ORIGINAL_LANGUAGE ?? 'ko',
    // Жанры, которые не считаем дорамами: реалити, ток-шоу, новости, документальные, детские
    excludeGenres: (process.env.TMDB_EXCLUDE_GENRES ?? '10764,10767,10763,99,10762')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0),
  },

  episodes: {
    // Только https: адрес JSON-файла студии
    feedUrl: process.env.EPISODES_FEED_URL?.startsWith('https://') ? process.env.EPISODES_FEED_URL : undefined,
    // Видео разрешено только с этих хостов (и их поддоменов). Тестовый хост уберите перед запуском.
    allowedHosts: (process.env.EPISODES_ALLOWED_HOSTS ?? 'le-vitation.tv,test-streams.mux.dev')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  },

  dracin: {
    apiKey: process.env.DRACIN_API_KEY,
    baseUrl: process.env.DRACIN_BASE_URL ?? 'https://dracinapi.com',
    platform: process.env.DRACIN_PLATFORM ?? 'dramabox',
    feedPath: process.env.DRACIN_FEED_PATH ?? '/api/{platform}/feed',
    detailPath: process.env.DRACIN_DETAIL_PATH ?? '/api/{platform}/detail/{id}',
    authHeader: process.env.DRACIN_AUTH_HEADER ?? 'x-api-key',
    authPrefix: process.env.DRACIN_AUTH_PREFIX ?? '',
  },
};

/** Какой провайдер основной: явный выбор → TMDB при наличии ключа → мок. */
export function resolveProviderName(): ProviderName {
  const explicit = process.env.DRAMA_PROVIDER as ProviderName | undefined;
  if (explicit && PROVIDER_NAMES.includes(explicit)) return explicit;
  return config.tmdb.apiKey || config.tmdb.readToken ? 'tmdb' : 'mock';
}
