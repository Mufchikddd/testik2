/** @type {import('next').NextConfig} */
const nextConfig = {
  // episodes.ts читает data/episodes.json во время работы — файл должен попасть в сборку
  outputFileTracingIncludes: { '/**': ['./data/**/*'] },
  images: {
    // Держите список в синхроне с OPTIMIZED_IMAGE_HOSTS в src/lib/utils.ts
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: 'cdn.dracinapi.com' },
    ],
  },
};

export default nextConfig;
