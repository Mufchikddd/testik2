import Image from 'next/image';
import { hashHue, isOptimizableImage } from '@/lib/utils';

interface PosterProps {
  src: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
}

/**
 * Заполняет ближайшего `relative`-родителя. Три режима:
 * постер с разрешённого CDN → next/image; чужой хост → обычный <img>;
 * нет картинки → типографическая заглушка с названием.
 */
export function Poster({ src, title, sizes, priority }: PosterProps) {
  if (!src) {
    const hue = hashHue(title);
    return (
      <div
        className="absolute inset-0 flex items-end p-4"
        style={{ background: `linear-gradient(160deg, hsl(${hue} 38% 27%), hsl(${(hue + 20) % 360} 40% 13%))` }}
      >
        <span className="font-display text-base leading-tight text-ink/90">{title}</span>
      </div>
    );
  }

  if (!isOptimizableImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`Постер: ${title}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    );
  }

  return <Image src={src} alt={`Постер: ${title}`} fill sizes={sizes} priority={priority} className="object-cover" />;
}
