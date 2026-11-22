import Link from 'next/link';
import { IconMail, IconPhone, IconMapPin, IconArrowUpRight } from '@tabler/icons-react';
import { HexLogo } from './Header';

const productLinks = [
  { label: 'PrognoCare EMR', href: '/products/emr' },
  { label: 'RxSoft Pharmacy', href: '/products/rxsoft-pharmacy' },
  { label: 'Laboratory Information System', href: '/products/lis' },
  { label: 'Radiology Information System', href: '/products/ris' },
  { label: 'Telemedicine', href: '/products/telemedicine' },
  { label: 'Interoperability', href: '/products/healthcare-interoperability' },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Posts', href: '/posts' },
  { label: 'Partnerships', href: '/partnerships' },
  { label: 'Products & Services', href: '/products-services' },
  { label: 'Contact', href: '/contact' },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-900 text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 hex-pattern opacity-40" />

      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <HexLogo size={36} />
              <span className="font-display text-2xl font-bold tracking-[-0.02em] text-white">
                eHealth<span className="text-blue-400">Wares</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Building connected healthcare technology ecosystems — one intelligent module at a
              time.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {['#2563EB', '#0D9488', '#16A34A', '#7C3AED', '#F59E0B', '#F43F5E'].map((c) => (
                <span
                  key={c}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Products
            </h3>
            <ul className="mt-5 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                    <IconArrowUpRight
                      size={13}
                      className="opacity-0 transition-all group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                    <IconArrowUpRight
                      size={13}
                      className="opacity-0 transition-all group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Contact
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <IconMail size={17} className="mt-0.5 shrink-0 text-blue-400" />
                <a href="mailto:info@ehealthwares.com" className="transition-colors hover:text-white">
                  info@ehealthwares.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <IconPhone size={17} className="mt-0.5 shrink-0 text-teal-400" />
                <a href="tel:+2348022224166" className="transition-colors hover:text-white">
                  +234-80-2222-4166
                </a>
              </li>
              <li className="flex items-start gap-3">
                <IconMapPin size={17} className="mt-0.5 shrink-0 text-violet-400" />
                <span>Lagos, Nigeria</span>
              </li>
            </ul>
            <Link
              href="/contact"
              className="btn-gradient mt-6 !px-5 !py-2.5 text-sm"
            >
              Start a Conversation
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/45">
            &copy; {new Date().getFullYear()} eHealthwares Informatics Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/45">
            <span className="font-medium text-white/55">eHealthWares · Healthier with every step</span>
            <Link href="/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link href="/data-deletion" className="transition-colors hover:text-white">
              Data Deletion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
