import type { Metadata } from 'next';
import Link from 'next/link';
import { IconArrowRight, IconMapPin, IconMail } from '@tabler/icons-react';
import { ehealthwaresApi } from '@/lib/api';
import { SectionHeader } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Careers — Join the eHealthwares Team',
  description:
    'Explore career opportunities at eHealthwares. We build enterprise healthcare technology — EMR, pharmacy, laboratory, radiology, telemedicine, and interoperability platforms — and we are always looking for talented people.',
  alternates: { canonical: '/careers' },
};

const FALLBACK_CAREERS = [
  {
    _id: 'fallback-1',
    title: 'Healthcare Software Engineer',
    location: 'Lagos, Nigeria (Hybrid)',
    type: 'full-time',
    department: 'Engineering',
    description:
      'Build and scale enterprise healthcare platforms — EMR, pharmacy, laboratory, and interoperability solutions.',
  },
  {
    _id: 'fallback-2',
    title: 'Integration Engineer (HL7 / FHIR)',
    location: 'Lagos, Nigeria',
    type: 'full-time',
    department: 'Interoperability',
    description:
      'Design and deliver HL7, FHIR, and DICOM integrations that connect health systems across the care ecosystem.',
  },
  {
    _id: 'fallback-3',
    title: 'Product Manager — Clinical Systems',
    location: 'Remote',
    type: 'full-time',
    department: 'Product',
    description:
      'Own the roadmap for clinical products, working with clinicians and customers to shape modern healthcare software.',
  },
  {
    _id: 'fallback-4',
    title: 'Healthcare Data Scientist / Healthcare Informatics',
    location: 'Lagos, Nigeria (Hybrid)',
    type: 'full-time',
    department: 'Data & Analytics',
    description:
      'Turn healthcare and pharmacy data into clinical and operational insight — data pipelines, entity resolution and analytics over RxSoft, EMR and formulary datasets, applying healthcare informatics standards (ICD, LOINC, SNOMED).',
  },
  {
    _id: 'fallback-5',
    title: 'Healthcare Coder',
    location: 'Lagos, Nigeria (Hybrid)',
    type: 'full-time',
    department: 'Health Information Management',
    description:
      'Translate clinical documentation into accurate ICD-10/ICD-11, CPT and procedure codes, and support coding quality, audit and reimbursement workflows across EMR and billing systems.',
  },
];

const TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  'full-time': { label: 'Full-time', bg: 'rgba(37,99,235,0.12)', text: '#1D4ED8' },
  contract: { label: 'Contract', bg: 'rgba(245,158,11,0.15)', text: '#B45309' },
  remote: { label: 'Remote', bg: 'rgba(13,148,136,0.12)', text: '#0F766E' },
};

export default async function CareersPage() {
  let careers: any[] = [];
  try {
    careers = (await ehealthwaresApi.getCareers()) ?? [];
  } catch (e) {
    console.error('CareersPage data fetch failed:', e);
  }
  const list = careers.length > 0 ? careers : FALLBACK_CAREERS;

  return (
    <div className="relative overflow-hidden">
      <section className="relative overflow-hidden bg-navy-900">
        <div className="pointer-events-none absolute inset-0 hex-pattern opacity-25" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-36 sm:pt-44">
          <span className="chip chip-dark">Careers</span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl">
            Build software that <span className="text-gradient">matters</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            We are building the connected healthcare technology ecosystem — EMR, pharmacy,
            laboratory, radiology, telemedicine, and interoperability platforms that transform
            care delivery. If you want to build software that matters, we want to hear from you.
          </p>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            chip="Open Positions"
            title={
              <>
                Current <span className="text-gradient">opportunities</span>
              </>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {list.map((career) => {
              const typeStyle = TYPE_STYLES[career.type] ?? TYPE_STYLES['full-time'];
              return (
                <div key={career._id} className="glass-card flex flex-col rounded-2xl p-7">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                    >
                      {typeStyle.label}
                    </span>
                    {career.department && (
                      <span className="rounded-full border border-navy-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-500">
                        {career.department}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold leading-snug text-navy-900">
                    {career.title}
                  </h3>
                  {career.location && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-navy-500">
                      <IconMapPin size={15} className="text-coral-500" />
                      {career.location}
                    </span>
                  )}
                  {career.description && (
                    <p className="mt-3 text-sm leading-relaxed text-navy-500">
                      {career.description.replace(/<[^>]+>/g, '')}
                    </p>
                  )}
                  <div className="mt-auto pt-6">
                    <Link
                      href={`mailto:info@ehealthwares.com?subject=Application: ${encodeURIComponent(career.title)}`}
                      className="btn-gradient w-full !py-2.5"
                    >
                      Apply Now
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
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
