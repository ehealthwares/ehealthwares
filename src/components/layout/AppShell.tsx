'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const STANDALONE_ROUTES = ['/products/emr', '/myaiha'];

/**
 * Renders the site chrome (header, padded main, footer) for regular pages.
 * Standalone routes ship their own chrome: the /products/emr landing page has
 * its own patienthub-style header/footer, and the MyAIha pages (marketing +
 * chat app) are full-viewport app surfaces — the marketing page links back to
 * ehealthwares itself and to the full app.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  );
}
