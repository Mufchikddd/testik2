import { initials } from '@/lib/utils';
import { Poster } from './Poster';

export function CastAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-dusk ring-1 ring-mist">
      {photoUrl ? (
        <Poster src={photoUrl} title={name} sizes="48px" />
      ) : (
        <span aria-hidden className="flex h-full w-full items-center justify-center text-sm text-haze">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
