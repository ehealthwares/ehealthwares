'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconArrowRight, IconMenu2, IconX } from '@tabler/icons-react';
import { AUTH_CHANGE_EVENT, getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';

function AuthButton() {
  const [authed, setAuthed] = useState(!!getCurrentUser());

  useEffect(() => {
    const sync = () => setAuthed(!!getCurrentUser());
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (authed) return <UserMenu />;
  return (
    <Link
      href="/sign-in"
      className="rounded-xl px-4 py-2 text-sm font-semibold text-navy-700 transition-colors hover:bg-navy-50 hover:text-blue-600"
    >
      Sign In
    </Link>
  );
}

const links = [
  { label: 'Products & Services', href: '/products-services' },
  { label: 'EMR', href: '/products/emr' },
  { label: 'Careers', href: '/careers' },
  { label: 'Posts', href: '/posts' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function HexLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label="eHealthWares icon"
      className="shrink-0 drop-shadow-sm"
    >
      <path d="M80.7 18.1 L95.42 26.6 L95.42 43.6 L80.7 52.1 L65.98 43.6 L65.98 26.6 Z" fill="#7C3AED" />
      <path d="M47.3 18.1 L62.02 26.6 L62.02 43.6 L47.3 52.1 L32.58 43.6 L32.58 26.6 Z" fill="#0F2A43" />
      <path d="M97.4 47 L112.12 55.5 L112.12 72.5 L97.4 81 L82.68 72.5 L82.68 55.5 Z" fill="#0D9488" />
      <path d="M30.6 47 L45.32 55.5 L45.32 72.5 L30.6 81 L15.88 72.5 L15.88 55.5 Z" fill="#16A34A" />
      <path d="M47.3 75.9 L62.02 84.4 L62.02 101.4 L47.3 109.9 L32.58 101.4 L32.58 84.4 Z" fill="#F59E0B" />
      <path d="M80.7 75.9 L95.42 84.4 L95.42 101.4 L80.7 109.9 L65.98 101.4 L65.98 84.4 Z" fill="#F43F5E" />
      <path
        fillRule="evenodd"
        d="M64 47 L78.72 55.5 L78.72 72.5 L64 81 L49.28 72.5 L49.28 55.5 Z M61 55 H67 V61 H73 V67 H67 V73 H61 V67 H55 V61 H61 Z"
        fill="#2563EB"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-[22px] font-bold tracking-[-0.02em] text-navy-900">
      eHealth<span className="text-blue-600">Wares</span>
    </span>
  );
}

export function Header() {
  const [opened, setOpened] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto mt-3 w-[calc(100%-24px)] max-w-7xl sm:w-[calc(100%-48px)]">
        <div className="glass flex h-16 items-center justify-between rounded-2xl px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="eHealthwares home">
            <HexLogo size={34} />
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-navy-700 hover:bg-navy-50 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <AuthButton />
            <Link href="/contact" className="btn-gradient !px-5 !py-2.5">
              Get in Touch
              <IconArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpened((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-navy-800 transition-colors hover:bg-navy-50 md:hidden"
            aria-label={opened ? 'Close menu' : 'Open menu'}
            aria-expanded={opened}
          >
            {opened ? <IconX size={22} /> : <IconMenu2 size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {opened && (
        <div className="mx-auto mt-2 w-[calc(100%-24px)] max-w-7xl md:hidden">
          <div className="glass rounded-2xl p-4">
            <nav className="flex flex-col" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpened(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-navy-100 pt-4">
                <AuthButton />
                <Link href="/contact" onClick={() => setOpened(false)} className="btn-gradient">
                  Get in Touch
                  <IconArrowRight size={16} />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
