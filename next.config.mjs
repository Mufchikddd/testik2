/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Держите список в синхроне с OPTIMIZED_IMAGE_HOSTS в src/lib/utils.ts
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: 'cdn.dracinapi.com' },
    ],
  },
};

export default nextConfig;
