import data from '../data/mock-dramas.json';
import { paginateLocally } from '../query';
import type { Drama, DramaProvider } from '../types';

const dramas = data as unknown as Drama[];

/** Запасной источник: сайт работает без сети и без ключей. */
export const mockProvider: DramaProvider = {
  name: 'mock',
  async fetchPage(query) {
    return paginateLocally(dramas, query);
  },
  async fetchDrama(rawId) {
    return dramas.find((d) => d.id === `mock-${rawId}`) ?? null;
  },
};
