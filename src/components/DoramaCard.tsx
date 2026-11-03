import Link from 'next/link';
import type { Drama } from '@/lib/types';
import { Poster } from './Poster';
import { Rating } from './Rating';

/**
 * Карточка «левитирует»: при наведении постер поднимается,
 * а тень на «полу» сжимается и расплывается.
 */
export function DoramaCard({ drama, priority = false }: { drama: Drama; priority?: boolean }) {
  const meta = [drama.year, drama.genres[0]].filter(Boolean).join(', ');

  return (
    <li>
      <Link href={`/dorama/${drama.id}`} prefetch={false} className="group block rounded-2xl focus-visible:outline-offset-8">
        <div className="relative">
          {/* Тень идёт первой в DOM, чтобы постер перекрывал её */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-3 left-[10%] right-[10%] h-5 rounded-[50%] bg-black/70 blur-md transition duration-500 ease-out group-hover:translate-y-2 group-hover:scale-x-90 group-hover:opacity-50 group-hover:blur-xl group-focus-visible:translate-y-2 group-focus-visible:scale-x-90 group-focus-visible:opacity-50 group-focus-visible:blur-xl"
          />
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-dusk ring-1 ring-mist/70 transition duration-500 ease-out will-change-transform group-hover:-translate-y-3 group-hover:ring-aether/50 group-focus-visible:-translate-y-3">
            <Poster
              src={drama.posterUrl}
              title={drama.title}
              sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
            />
            <div className="absolute left-2 top-2">
              <Rating value={drama.rating} />
            </div>
          </div>
        </div>
        <h3 className="mt-5 line-clamp-2 text-sm font-medium leading-snug">{drama.title}</h3>
        {meta && <p className="mt-1 text-sm text-haze">{meta}</p>}
      </Link>
    </li>
  );
}
