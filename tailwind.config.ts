import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#15110E', // фон страницы
        dusk: '#221B16', // поверхности: поля, плейсхолдеры
        mist: '#3B3028', // границы
        ink: '#F6F1EA', // основной текст
        haze: '#AC9F92', // вторичный текст
        aether: '#F59E4B', // акцент
        halo: '#F8B96B', // рейтинг
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        drift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'shadow-drift': {
          '0%, 100%': { transform: 'scaleX(1)', opacity: '0.7' },
          '50%': { transform: 'scaleX(0.8)', opacity: '0.35' },
        },
      },
      animation: {
        fade: 'fade 0.7s ease-out',
        drift: 'drift 6s ease-in-out infinite',
        'shadow-drift': 'shadow-drift 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
