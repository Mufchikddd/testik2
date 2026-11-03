'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { RATING_OPTIONS, SORT_OPTIONS, toSearchString } from '@/lib/query';
import type { CatalogQuery, SortKey } from '@/lib/types';

interface Props {
  query: CatalogQuery;
  defaultLang: string;
  years: number[];
  /** null — точное число неизвестно (поиск). */
  total: number | null;
}

const controlClass =
  'h-11 w-full rounded-xl border border-mist bg-dusk px-4 text-ink placeholder:text-haze/70 transition-colors hover:border-aether/40 focus-visible:border-aether disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-haze">
      <span>{label}</span>
      {children}
    </label>
  );
}

/**
 * Фильтры живут в адресной строке (?q=&year=&rating=&sort=&lang=&page=):
 * любой выбор — это переход на новый URL, а сервер отдаёт нужную страницу каталога.
 * Так фильтры работают по всей базе, а ссылкой на результат можно поделиться.
 */
export function CatalogFilters({ query, defaultLang, years, total }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(query.q);
  const lastSent = useRef(query.q);

  const go = (patch: Partial<CatalogQuery>, mode: 'push' | 'replace' = 'push') => {
    const href = `/${toSearchString({ ...query, ...patch, page: 1 }, defaultLang)}`;
    startTransition(() => {
      router[mode](href, { scroll: false });
    });
  };

  // Поиск с задержкой, чтобы не слать запрос на каждую букву
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === query.q) return;
    const timer = setTimeout(() => {
      lastSent.current = trimmed;
      go({ q: trimmed }, 'replace');
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Кнопки «назад/вперёд» браузера меняют q снаружи — подтягиваем поле
  useEffect(() => {
    if (query.q !== lastSent.current) {
      lastSent.current = query.q;
      setText(query.q);
    }
  }, [query.q]);

  const hasFilters =
    query.q !== '' ||
    query.year !== null ||
    query.minRating > 0 ||
    query.sort !== 'popular';

  const reset = () => {
    lastSent.current = '';
    setText('');
    go({ q: '', year: null, minRating: 0, sort: 'popular' });
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.8fr_0.8fr_1fr_1.2fr]">
        <Field label="Поиск по названию">
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Например, Goblin"
            autoComplete="off"
            className={controlClass}
          />
        </Field>
        <Field label="Год">
          <select
            value={query.year ?? 'all'}
            onChange={(e) => go({ year: e.target.value === 'all' ? null : Number(e.target.value) })}
            className={controlClass}
          >
            <option value="all">Все годы</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Рейтинг">
          <select
            value={query.minRating}
            onChange={(e) => go({ minRating: Number(e.target.value) })}
            className={controlClass}
          >
            {RATING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Сортировка">
          <select
            value={query.sort}
            onChange={(e) => go({ sort: e.target.value as SortKey })}
            disabled={query.q !== ''}
            title={query.q !== '' ? 'При поиске результаты идут по совпадению с запросом' : undefined}
            className={controlClass}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6 flex min-h-8 items-center justify-between text-sm text-haze">
        <p aria-live="polite">
          {pending
            ? 'Обновляем список…'
            : total === null
              ? 'Результаты поиска'
              : `Найдено: ${total.toLocaleString('ru-RU')}`}
        </p>
        {hasFilters && (
          <button type="button" onClick={reset} className="text-aether transition-opacity hover:opacity-80">
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
}
