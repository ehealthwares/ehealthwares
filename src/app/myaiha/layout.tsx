import type { Metadata, Viewport } from 'next';
import { PwaRegister } from './pwa-register';

/**
 * MyAIHA-only layout. Adds the scoped web-app manifest and service worker so
 * `/myaiha/*` can be installed as a PWA — the rest of ehealthwares.com is a
 * normal website (the root layout is unchanged).
 */
export const metadata: Metadata = {
  applicationName: 'MyAIha',
  manifest: '/myaiha/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'MyAIha',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/myaiha/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/myaiha/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/myaiha/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/myaiha/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  title: {
    default: 'MyAIha',
    template: '%s | MyAIha',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F2A43',
};

export default function MyAIhaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      {children}
    </>
  );
}
