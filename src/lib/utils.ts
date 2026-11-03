export function parseYear(date?: string | null): number | null {
  const year = date ? Number.parseInt(date.slice(0, 4), 10) : Number.NaN;
  return Number.isFinite(year) && year > 1900 ? year : null;
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Стабильный оттенок из строки — для заглушек постеров. Диапазон: от красно-коричневого до янтарного. */
export function hashHue(input: string, from = 8, span = 50): number {
  let hash = 0;
  for (const ch of input) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return from + (hash % span);
}

/** Хосты, которые разрешены в next.config.mjs → images.remotePatterns. */
export const OPTIMIZED_IMAGE_HOSTS = ['image.tmdb.org', 'cdn.dracinapi.com'];

export function isOptimizableImage(src: string): boolean {
  try {
    return OPTIMIZED_IMAGE_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
