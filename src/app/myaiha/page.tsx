import type { Metadata } from 'next';
import Link from 'next/link';
import { MyAIhaHeroChat } from './MyAIhaHeroChat';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ehealthwares.com';

export const metadata: Metadata = {
  title: 'MyAIha — Conversational AI for Connected Care',
  description:
    'MyAIha listens across WhatsApp, SMS, web and voice, then routes each conversation to the right specialist, service or record — turning scattered patient messages into coordinated care.',
  alternates: { canonical: '/myaiha' },
  keywords: [
    'healthcare chatbot',
    'conversational AI healthcare',
    'patient engagement',
    'medical triage chatbot',
    'WhatsApp health assistant',
    'eHealthwares MyAIha',
  ],
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/myaiha`,
    siteName: 'eHealthwares',
    title: 'MyAIha — Conversational AI for Connected Care',
    description:
      'Every patient message becomes a connected care action. MyAIha listens across channels and routes each conversation to the right specialist, service or record.',
    images: [{ url: '/logo-rect.png', width: 512, height: 512, alt: 'MyAIha' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyAIha — Conversational AI for Connected Care',
    description:
      'Every patient message becomes a connected care action — across WhatsApp, SMS, web and voice.',
    images: ['/logo-rect.png'],
  },
};

const CAPABILITIES = [
  {
    icon: '💬',
    title: 'Conversational intake',
    text: 'Understands symptoms and requests in plain language, on the channel a patient already uses.',
  },
  {
    icon: '🧭',
    title: 'Smart routing',
    text: 'Directs each conversation to the right specialist, department or facility automatically.',
  },
  {
    icon: '🔁',
    title: 'Patient engagement',
    text: 'Follows up on appointments, refills and reviews without manual outreach.',
  },
  {
    icon: '⚙️',
    title: 'Workflow automation',
    text: 'Handles scheduling, reminders and triage steps across your care teams.',
  },
  {
    icon: '🔗',
    title: 'Connected operations',
    text: 'Works alongside PrognoCare EMR, RxSoft and your interoperability gateway.',
  },
  {
    icon: '📊',
    title: 'Clinical intelligence',
    text: 'Surfaces patterns across conversations to support better-informed care decisions.',
  },
] as const;

const STEPS = [
  {
    step: 'Step 1',
    title: 'Ask',
    text: 'A patient reaches out on WhatsApp, SMS, web chat or voice.',
  },
  {
    step: 'Step 2',
    title: 'Understand',
    text: 'MyAIha interprets intent and urgency from the conversation.',
  },
  {
    step: 'Step 3',
    title: 'Route',
    text: 'The request reaches the right specialist, pharmacy or facility.',
  },
  {
    step: 'Step 4',
    title: 'Act',
    text: 'Care happens, and the record updates automatically.',
  },
] as const;

const STATS = [
  { value: '12+', label: 'Markets served' },
  { value: '500+', label: 'Facilities empowered' },
  { value: '99.97%', label: 'Platform uptime' },
  { value: '200+', label: 'System integrations' },
] as const;

export default function MyAIhaPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-extrabold">
              e
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              eHealthWares
              <span className="ml-2 rounded-full bg-teal-500/15 px-2 py-0.5 text-[11px] font-bold text-teal-300">
                MyAIha
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-navy-200 md:flex">
            <a href="#capabilities" className="hover:text-white">Capabilities</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/myaiha/app"
              className="rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/myaiha/app"
              className="rounded-full bg-teal-500 px-4 py-2 text-[13px] font-bold text-teal-950 transition hover:bg-teal-400"
            >
              Launch app
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-hero-dark">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 md:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-navy-100">
              🩺 eHealthwares Informatics Limited
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
              Every patient message becomes a connected care action
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-navy-100">
              MyAIha listens across WhatsApp, SMS, web and voice, then routes each
              conversation to the right specialist, service or record — turning
              scattered messages into coordinated care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/myaiha/app"
                className="rounded-full bg-teal-500 px-6 py-3 text-sm font-bold text-teal-950 transition hover:bg-teal-400"
              >
                Start with MyAIha
              </Link>
              <a
                href="#how"
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>
          </div>

          <MyAIhaHeroChat />
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-y border-white/10 bg-navy-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 text-center md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-extrabold text-white md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs font-medium text-navy-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Capabilities ---------- */}
      <section id="capabilities" className="bg-white py-24 text-navy-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight">What MyAIha does</h2>
            <p className="mt-3 text-[15px] text-navy-500">
              One assistant, wired into the rest of your eHealthwares stack — from
              the pharmacy counter to the patient record.
            </p>
          </div>
          <div className="grid gap-x-12 md:grid-cols-2">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="flex gap-4 border-t border-navy-100 py-6 last:border-b"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-teal-50 text-lg">
                  {cap.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold">{cap.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-navy-500">
                    {cap.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="bg-hero-gradient py-24 text-navy-900">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight">
              From message to outcome, in four steps
            </h2>
            <p className="mt-3 text-[15px] text-navy-500">
              MyAIha sits between the patient and your care teams, keeping every
              step connected.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="text-xs font-extrabold uppercase tracking-wider text-teal-600">
                  {s.step}
                </div>
                <h3 className="mt-2 text-base font-bold">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-navy-500">
                  {s.text}
                </p>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-[-14px] top-3 hidden h-px w-6 bg-navy-200 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA band ---------- */}
      <section id="contact" className="bg-navy-900 py-20 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6">
          <div>
            <h2 className="max-w-lg text-2xl font-extrabold tracking-tight md:text-3xl">
              Ready to bring MyAIha into your care pathways?
            </h2>
            <p className="mt-3 max-w-lg text-sm text-navy-100">
              Talk to our solutions team about a walkthrough tailored to your
              organization — or try the assistant now.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/myaiha/app"
              className="rounded-full bg-teal-500 px-6 py-3 text-sm font-bold text-teal-950 transition hover:bg-teal-400"
            >
              Open MyAIha
            </Link>
            <a
              href="mailto:info@ehealthwares.com"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-navy-950 pb-10 pt-14 text-sm text-navy-300">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-white">
                eHealthWares
                <span className="h-2 w-2 rounded-full bg-teal-500" />
              </div>
              <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-navy-300">
                Building connected healthcare technology ecosystems across Africa —
                one intelligent module at a time.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">
                Products
              </h4>
              <Link href="/products/emr" className="block py-1 hover:text-white">PrognoCare EMR</Link>
              <Link href="/products-services" className="block py-1 hover:text-white">RxSoft Pharmacy</Link>
              <Link href="/myaiha" className="block py-1 hover:text-white">MyAIha</Link>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">
                Contact
              </h4>
              <a href="mailto:info@ehealthwares.com" className="block py-1 hover:text-white">
                info@ehealthwares.com
              </a>
              <a href="tel:+2348022224166" className="block py-1 hover:text-white">
                +234-80-2222-4166
              </a>
              <span className="block py-1">Lagos, Nigeria</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-xs text-navy-400">
            <span>© {new Date().getFullYear()} eHealthwares Informatics Limited.</span>
            <span>Healthier with every step</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
