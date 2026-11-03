import 'server-only';
import { cached, type CacheOrigin } from './cache';
import { config, resolveProviderName } from './config';
import { getProviderByName } from './providers';
import { mockProvider } from './providers/mock';
import type { CatalogPage, CatalogQuery, DataSource, Drama } from './types';

export interface CatalogResult {
  page: CatalogPage;
  source: DataSource;
}
export interface DramaResult {
  drama: Drama | null;
  source: DataSource;
  /** true — не «нет такой дорамы», а «не удалось загрузить» (источник лежит, кэша нет). */
  failed?: boolean;
}

const toSource = (origin: CacheOrigin): DataSource =>
  origin === 'live' ? 'live' : origin === 'stale' ? 'stale' : 'cache';

async function mockCatalog(query: CatalogQuery): Promise<CatalogResult> {
  return { page: await mockProvider.fetchPage(query), source: 'mock' };
}

/** Страница каталога: кэш → источник → устаревший кэш → мок-данные. */
export async function getCatalogPage(query: CatalogQuery): Promise<CatalogResult> {
  const name = resolveProviderName();
  const provider = getProviderByName(name);
  if (!provider || provider.name === 'mock') return mockCatalog(query);

  try {
    const result = await cached(
      `catalog-${name}-${JSON.stringify(query)}`,
      () => provider.fetchPage(query),
      { ttlMs: config.cacheTtlMs },
    );
    return { page: result.data, source: toSource(result.origin) };
  } catch (error) {
    console.error('[catalog] источник недоступен, показываем мок-данные:', error);
    return mockCatalog(query);
  }
}

/** Полная карточка дорамы. `id` — как в URL: `<провайдер>-<id>`. */
export async function getDrama(id: string): Promise<DramaResult> {
  const separator = id.indexOf('-');
  const provider = separator > 0 ? getProviderByName(id.slice(0, separator)) : undefined;
  if (!provider) return { drama: null, source: 'live' };

  const rawId = id.slice(separator + 1);

  try {
    const result = await cached(`drama-${id}`, () => provider.fetchDrama(rawId), {
      ttlMs: config.cacheTtlMs,
      shouldStore: (drama) => drama !== null, // «не найдено» не кэшируем
    });
    return {
      drama: result.data,
      source: provider.name === 'mock' ? 'mock' : toSource(result.origin),
    };
  } catch (error) {
    console.error(`[drama] не удалось загрузить ${id}:`, error);
    return { drama: null, source: 'stale', failed: true };
  }
}
