import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IconArrowLeft,
  IconMapPin,
  IconMail,
  IconCheck,
  IconBuilding,
  IconBriefcase,
} from '@tabler/icons-react';
import sanitizeHtml from 'sanitize-html';
import { ehealthwaresApi } from '@/lib/api';
import { TYPE_STYLES } from '../typeStyles';
import { ApplicationForm } from './ApplicationForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const stripTags = (value: string | null | undefined) =>
  value ? value.replace(/<[^>]+>/g, '').trim() : '';

/**
 * Sanitize the backend-provided posting HTML server-side before it is injected
 * with dangerouslySetInnerHTML. Allow-list only the posting primitives; every
 * script, class, style attribute and inline event handler is stripped.
 */
function sanitizeDetail(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['mailto', 'tel', 'http', 'https'],
    allowedSchemesAppliedToAttributes: ['href'],
    disallowedTagsMode: 'discard',
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const careers = await ehealthwaresApi.getCareers();
  const career = careers?.find((c) => c.slug === slug);
  if (!career) return {};
  return {
    title: `${career.title} — Careers — eHealthwares`,
    description: stripTags(career.description) || career.title,
    alternates: { canonical: `/careers/${slug}` },
  };
}

export default async function CareerPage({ params }: PageProps) {
  const { slug } = await params;
  const careers = await ehealthwaresApi.getCareers();
  const career = careers?.find((c) => c.slug === slug);
  if (!career) notFound();

  const typeStyle = TYPE_STYLES[career.type] ?? TYPE_STYLES['full-time'];
  const hasDetail = Boolean(career.detailHtml && career.detailHtml.trim());
  const sanitizedHtml = hasDetail ? sanitizeDetail(career.detailHtml as string) : '';

  return (
    <div className="relative overflow-hidden">
      <section className="relative overflow-hidden bg-navy-900">
        <div className="pointer-events-none absolute inset-0 hex-pattern opacity-25" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-36 sm:pt-44">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <IconArrowLeft size={16} />
            All positions
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
            >
              {typeStyle.label}
            </span>
            {career.department && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
                <IconBuilding size={13} />
                {career.department}
              </span>
            )}
            {career.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70">
                <IconMapPin size={13} className="text-coral-400" />
                {career.location}
              </span>
            )}
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
            {career.title}
          </h1>
        </div>
      </section>

      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
            {/* LEFT — the posting */}
            <div className="min-w-0">
              {hasDetail ? (
                <div
                  className="max-w-none text-[15px] leading-relaxed text-navy-500
                    [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-navy-900
                    [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-navy-900
                    [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0
                    [&_p]:mt-4 [&_p]:leading-relaxed
                    [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5
                    [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5
                    [&_li]:leading-relaxed
                    [&_strong]:font-semibold [&_strong]:text-navy-800
                    [&_em]:italic
                    [&_a]:font-semibold [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700"
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              ) : (
                <>
                  {career.description && (
                    <p className="text-lg leading-relaxed text-navy-700">
                      {stripTags(career.description)}
                    </p>
                  )}

                  <div className="mt-10 rounded-2xl bg-gradient-to-r from-blue-50 to-violet-50 p-6">
                    <h2 className="font-display text-lg font-bold text-navy-900">How to apply</h2>
                    <p className="mt-2 text-sm leading-relaxed text-navy-600">
                      Send your CV and a short cover letter to our team — we typically respond
                      within one week.
                    </p>
                    <a
                      href={`mailto:info@ehealthwares.com?subject=Application: ${encodeURIComponent(career.title)}`}
                      className="btn-gradient mt-5 inline-flex !px-6 !py-3"
                    >
                      <IconMail size={16} />
                      Apply for this role
                    </a>
                  </div>

                  <div className="mt-10">
                    <h2 className="font-display text-lg font-bold text-navy-900">
                      Why eHealthwares?
                    </h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        'Real impact in African healthcare',
                        'Modern stack — NestJS, React, MongoDB, PostgreSQL',
                        'Remote-friendly and hybrid roles',
                        'Grow with the product and the platform',
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-sm text-navy-700">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                            <IconCheck size={12} stroke={3} />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — sticky application form */}
            <div className="lg:sticky lg:top-6">
              <div className="glass-card rounded-2xl p-6 sm:p-7">
                <div className="mb-5">
                  <span className="chip">Apply</span>
                  <h2 className="mt-3 font-display text-xl font-extrabold text-navy-900">
                    Apply for this role
                  </h2>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-400">
                    <IconBriefcase size={14} />
                    {career.title}
                  </p>
                </div>
                <ApplicationForm slug={career.slug} title={career.title} />
              </div>
            </div>
          </div>

          <div className="relative mt-16 overflow-hidden rounded-3xl bg-cta-gradient p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute inset-0 dots-pattern opacity-20" />
            <div className="relative">
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Don&apos;t see your role?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-white/75">
                Send your CV to info@ehealthwares.com — we are always open to great people.
              </p>
              <a
                href="mailto:info@ehealthwares.com"
                className="btn-gradient mt-7 !bg-white !px-8 !py-3.5 !text-base !text-navy-900"
              >
                <IconMail size={18} />
                Email Us Your CV
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
