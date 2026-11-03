import 'server-only';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Двухуровневый кэш: память процесса + JSON-файл на диске.
 *
 *  1. свежая запись в памяти        → origin "memory"
 *  2. свежий JSON-файл              → origin "file"
 *  3. запрос к источнику            → origin "live"  (и запись в оба уровня)
 *  4. источник упал, есть старое    → origin "stale" (лучше устаревшее, чем пустая страница)
 *  5. источник упал, ничего нет     → ошибка, наверх решает вызывающий (мок-данные)
 *
 * Файловый кэш best-effort: на read-only файловых системах (часть хостингов)
 * запись тихо пропускается, остаётся кэш в памяти.
 */

type Entry<T> = { savedAt: number; data: T };
export type CacheOrigin = 'memory' | 'file' | 'live' | 'stale';
export interface CacheResult<T> {
  data: T;
  origin: CacheOrigin;
}
interface CacheOptions<T> {
  ttlMs: number;
  /** Не сохранять результат (например, null для «не найдено»). */
  shouldStore?: (data: T) => boolean;
}

const CACHE_DIR = process.env.CACHE_DIR ?? path.join(os.tmpdir(), 'levitation-cache');
const FAILURE_BACKOFF_MS = 60_000;
const MAX_MEMORY_ENTRIES = 500;

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<CacheResult<unknown>>>();
const lastFailure = new Map<string, number>();

const filePath = (key: string) => {
  const readable = key.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40);
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 16);
  return path.join(CACHE_DIR, `${readable}-${hash}.json`);
};

async function readFromDisk<T>(key: string): Promise<Entry<T> | null> {
  try {
    return JSON.parse(await fs.readFile(filePath(key), 'utf8')) as Entry<T>;
  } catch {
    return null;
  }
}

async function writeToDisk<T>(key: string, entry: Entry<T>) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(filePath(key), JSON.stringify(entry));
  } catch {
    /* read-only FS — остаёмся на кэше в памяти */
  }
}

function remember<T>(key: string, entry: Entry<T>) {
  if (memory.size >= MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, entry);
}

async function resolveEntry<T>(
  key: string,
  loader: () => Promise<T>,
  { ttlMs, shouldStore }: CacheOptions<T>,
): Promise<CacheResult<T>> {
  const now = Date.now();
  const inMemory = memory.get(key) as Entry<T> | undefined;
  if (inMemory && now - inMemory.savedAt < ttlMs) return { data: inMemory.data, origin: 'memory' };

  const onDisk = await readFromDisk<T>(key);
  if (onDisk && now - onDisk.savedAt < ttlMs) {
    remember(key, onDisk);
    return { data: onDisk.data, origin: 'file' };
  }

  const candidates = [inMemory, onDisk].filter((e): e is Entry<T> => Boolean(e));
  const stale = candidates.sort((a, b) => b.savedAt - a.savedAt)[0];

  // После недавнего сбоя не долбим источник на каждый запрос.
  const failedAt = lastFailure.get(key);
  if (failedAt && now - failedAt < FAILURE_BACKOFF_MS && stale) {
    return { data: stale.data, origin: 'stale' };
  }

  try {
    const data = await loader();
    lastFailure.delete(key);
    if (!shouldStore || shouldStore(data)) {
      const entry = { savedAt: Date.now(), data };
      remember(key, entry);
      await writeToDisk(key, entry);
    }
    return { data, origin: 'live' };
  } catch (error) {
    lastFailure.set(key, Date.now());
    if (stale) {
      console.warn(`[cache] "${key}": источник недоступен, отдаём устаревшие данные`);
      return { data: stale.data, origin: 'stale' };
    }
    throw error;
  }
}

export function cached<T>(
  key: string,
  loader: () => Promise<T>,
  options: CacheOptions<T>,
): Promise<CacheResult<T>> {
  // Одновременные запросы с одним ключом делят один поход в сеть.
  const pending = inflight.get(key) as Promise<CacheResult<T>> | undefined;
  if (pending) return pending;
  const promise = resolveEntry(key, loader, options).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
