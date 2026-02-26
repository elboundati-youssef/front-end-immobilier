import createNextIntlPlugin from 'next-intl/plugin';

// On précise bien le chemin pour éviter l'erreur de module introuvable
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);