import 'server-only';
import { PROVIDER_NAMES, type DramaProvider, type ProviderName } from '../types';
import { dracinProvider } from './dracin';
import { mockProvider } from './mock';
import { tmdbProvider } from './tmdb';

// Чтобы добавить источник: реализуйте DramaProvider, добавьте имя в PROVIDER_NAMES и сюда.
const registry: Record<ProviderName, DramaProvider> = {
  tmdb: tmdbProvider,
  dracin: dracinProvider,
  mock: mockProvider,
};

export function getProviderByName(name: string): DramaProvider | undefined {
  return (PROVIDER_NAMES as readonly string[]).includes(name)
    ? registry[name as ProviderName]
    : undefined;
}
