import { withSentryConfig } from '@sentry/nextjs/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      // The Posts section replaced the old /articles/:slug route.
      { source: '/articles', destination: '/posts', permanent: true },
      { source: '/articles/:slug', destination: '/posts/:slug', permanent: true },
      // Partnerships left the primary nav; keep old links working.
      { source: '/partners', destination: '/partnerships', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'ehealthwares',
  project: process.env.SENTRY_PROJECT || 'ehealthwares-web',
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  // Source map upload only runs when SENTRY_AUTH_TOKEN is present at build time.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});

