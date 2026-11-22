import type { Metadata } from 'next';
import Link from 'next/link';
import {
  IconArrowRight,
  IconBook2,
  IconClock,
  IconSparkles,
} from '@tabler/icons-react';
import { ehealthwaresApi } from '@/lib/api';
import { SiteImage } from '@/components/shared';
import {
  POST_CATEGORIES,
  formatPostDate,
  getPostCategory,
  readingTime,
  sortPosts,
  toPostListItem,
} from '@/lib/posts';
import { PostsExplorer } from './PostsExplorer';

export const metadata: Metadata = {
  title: 'Posts — Healthcare insights from eHealthwares',
  description:
    'Thought leadership on healthcare access and information exchange, hospital, pharmacy and laboratory management, patient experience, conversational AI, and connected healthcare systems in Africa.',
  alternates: { canonical: '/posts' },
  openGraph: {
    type: 'website',
    title: 'Posts — Healthcare insights from eHealthwares',
    description:
      'Thought leadership on connected healthcare: access and information exchange, management systems, patient experience, conversational AI, and digital health.',
    url: '/posts',
  },
};

export default async function PostsPage() {
  const articles = await ehealthwaresApi.getArticles();
  const posts = sortPosts(articles ?? []).filter((post) => post.isActive !== false);
  const featured = posts[0] ?? null;
  const rest = (featured ? posts.slice(1) : posts).map(toPostListItem);

  const counts = POST_CATEGORIES.map((category) => ({
    ...category,
    count: posts.filter((post) => post.category === category.label).length,
  })).filter((category) => category.count > 0);

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="pointer-events-none absolute inset-0 hex-pattern opacity-25" />
        <div className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-36 sm:pt-44">
          <span className="chip chip-dark">
            <IconSparkles size={13} className="text-amber-300" />
            Insights &amp; Analysis
          </span>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.025em] text-white sm:text-5xl lg:text-6xl">
            Thinking in public about{' '}
            <span className="text-gradient">healthcare that connects</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            The problems eHealthwares exists to solve — access to competent professionals and
            useful information, connected hospital workflows, a better patient experience, and
            conversational AI that stays accountable to real clinicians.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
            <div>
              <div className="font-display text-3xl font-extrabold text-white">{posts.length}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Long-form posts
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-extrabold text-white">
                {counts.length || POST_CATEGORIES.length}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Editorial themes
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-extrabold text-white">One</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Connected thesis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section className="relative border-b border-navy-100 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {counts.map((theme) => (
              <div
                key={theme.slug}
                className="rounded-2xl border border-navy-100 bg-white/80 p-4"
              >
                <span
                  className="inline-flex h-2 w-8 rounded-full"
                  style={{ backgroundColor: theme.color }}
                />
                <h2 className="mt-3 font-display text-sm font-bold leading-snug text-navy-900">
                  {theme.label}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-navy-400">
                  {theme.count} {theme.count === 1 ? 'post' : 'posts'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="relative py-16">
          <div className="mx-auto max-w-7xl px-6">
            <Link
              href={`/posts/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-navy-100 bg-white shadow-glass transition-shadow hover:shadow-glass-lg lg:grid-cols-2"
            >
              <div className="relative h-64 overflow-hidden lg:h-full lg:min-h-[380px]">
                {featured.imageUrl ? (
                  <SiteImage
                    src={featured.imageUrl}
                    alt={featured.title}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${getPostCategory(featured.category).color}, #0F2A43)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent lg:bg-gradient-to-r" />
                <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy-900 shadow">
                  Featured post
                </span>
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <span
                  className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                  style={{ backgroundColor: getPostCategory(featured.category).color }}
                >
                  {getPostCategory(featured.category).label}
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-[-0.02em] text-navy-900 sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-4 text-base leading-relaxed text-navy-500">
                    {featured.excerpt}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-navy-400">
                  <span className="inline-flex items-center gap-1.5">
                    <IconClock size={14} />
                    {readingTime(featured)} min read
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconBook2 size={14} />
                    {formatPostDate(featured.publishedAt)}
                  </span>
                </div>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
                  Read the post
                  <IconArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Archive */}
      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <PostsExplorer posts={rest} />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy-900 py-20">
        <div className="pointer-events-none absolute inset-0 hex-pattern opacity-25" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
            The ideas are the easy part. <span className="text-gradient">Let&apos;s build them.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Whether you run a hospital, a pharmacy chain, a laboratory or a health programme —
            start a conversation about connecting your information.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="btn-gradient">
              Talk to our team
              <IconArrowRight size={16} />
            </Link>
            <Link href="/products-services" className="btn-ghost-light">
              Explore products &amp; services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
