import 'server-only';
import { config } from './config';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Не пишем ключи в логи и тексты ошибок. */
const redact = (url: string) => url.replace(/(api_key|key)=[^&]+/gi, '$1=***');

export async function fetchJson<T>(
  url: string,
  init: { headers?: Record<string, string>; revalidate?: number } = {},
): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...init.headers },
    signal: AbortSignal.timeout(config.requestTimeoutMs),
    // Data Cache Next.js — первый слой кэша. Второй (JSON-файл) — в cache.ts.
    next: { revalidate: init.revalidate ?? config.cacheTtlSeconds },
  });
  if (!res.ok) throw new HttpError(res.status, `HTTP ${res.status}: ${redact(url)}`);
  return (await res.json()) as T;
}
