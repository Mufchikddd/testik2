'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  kind: 'hls' | 'mp4';
  title: string;
}

/**
 * Плеер на нативном <video>: mp4 и HLS в Safari играют сами, в остальных браузерах HLS (.m3u8)
 * подключается через hls.js, который подгружается только когда нужен.
 * Если видео лежит на другом домене, сервер студии должен отдавать CORS-заголовок
 * Access-Control-Allow-Origin для адреса сайта.
 */
export function VideoPlayer({ src, kind, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(false);

    let cancelled = false;
    let hls: { destroy(): void } | null = null;

    if (kind === 'mp4' || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      import('hls.js')
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) {
            setError(true);
            return;
          }
          const instance = new Hls();
          hls = instance;
          instance.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) setError(true);
          });
          instance.loadSource(src);
          instance.attachMedia(video);
        })
        .catch(() => setError(true));
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, kind, attempt]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        onError={() => setError(true)}
        className="h-full w-full"
      />
      {error && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night/90 p-6 text-center"
        >
          <p className="max-w-sm text-sm text-ink">
            Не удалось загрузить видео. Проверьте соединение и попробуйте ещё раз.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="h-10 rounded-xl bg-aether px-5 text-sm font-medium text-night transition-opacity hover:opacity-90"
          >
            Повторить
          </button>
        </div>
      )}
    </div>
  );
}
