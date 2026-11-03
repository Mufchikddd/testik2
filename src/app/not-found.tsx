import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center sm:px-8">
      <h1 className="font-display text-3xl font-semibold">Такой дорамы нет в каталоге</h1>
      <p className="mt-4 text-haze">Возможно, ссылка устарела. Вернитесь в каталог и найдите её через поиск.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center rounded-xl bg-aether px-6 font-medium text-night transition-opacity hover:opacity-90"
      >
        Открыть каталог
      </Link>
    </section>
  );
}
