import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconListSearch,
  IconUserCircle,
} from '@tabler/icons-react';
import { ehealthwaresApi } from '@/lib/api';
import { SiteImage } from '@/components/shared';
import {
  adjacentPosts,
  formatPostDate,
  getPostCategory,
  readingTime,
  relatedPosts,
  sortPosts,
  toPostListItem,
  withHeadingAnchors,
} from '@/lib/posts';
import { PostCard } from '../PostsExplorer';
import '../post.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ehealthwares.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findPost(slug: string) {
  const articles = await ehealthwaresApi.getArticles();
  return { articles: articles ?? [], post: articles?.find((a) => a.slug === slug) ?? null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await findPost(slug);
  if (!post) return {};

  const description = post.excerpt || post.title;
  const image = post.imageUrl?.startsWith('http') ? post.imageUrl : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: `/posts/${slug}`,
      publishedTime: post.publishedAt ?? undefined,
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const { articles, post } = await findPost(slug);
  if (!post) notFound();

  const posts = sortPosts(articles).filter((a) => a.isActive !== false);
  const theme = getPostCategory(post.category);
  const minutes = readingTime(post);
  const { html: body, headings } = withHeadingAnchors(post.body || '');
  const { previous, next } = adjacentPosts(posts, post);
  const related = relatedPosts(posts, post, 3);
  const toc = headings.filter((h) => h.level === 2);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.imageUrl ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.publishedAt ?? undefined,
    articleSection: theme.label,
    author: { '@type': 'Organization', name: 'eHealthwares' },
    publisher: {
      '@type': 'Organization',
      name: 'eHealthwares Informatics Limited',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-rect.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/posts/${slug}` },
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="pointer-events-none absolute inset-0 hex-pattern opacity-25" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse 55% 60% at 85% 10%, ${theme.color}, transparent 70%)`,
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-32 sm:pt-40">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <IconArrowLeft size={16} />
            All posts
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ backgroundColor: theme.color }}
            >
              {theme.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55">
              <IconCalendar size={14} />
              {formatPostDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55">
              <IconClock size={14} />
              {minutes} min read
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">{post.excerpt}</p>
          )}
          <div className="mt-7 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.color}, #0F2A43)`,
              }}
            >
              <IconUserCircle size={20} />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">eHealthwares Editorial</div>
              <div className="text-xs text-white/50">Connected healthcare perspectives</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured image */}
      {post.imageUrl && (
        <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-6">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border-4 border-white shadow-glass-lg sm:h-96">
            <SiteImage
              src={post.imageUrl}
              alt={post.title}
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        </div>
      )}

      {/* Body */}
      <section className="relative py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <div className="mx-auto max-w-3xl">
                <div
                  className="post-body"
                  dangerouslySetInnerHTML={{ __html: body }}
                />

                {/* Tags */}
                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-navy-100 pt-8">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-navy-300">
                    Filed under
                  </span>
                  <Link
                    href="/posts"
                    className="rounded-full border px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: theme.color, borderColor: theme.color }}
                  >
                    {theme.label}
                  </Link>
                </div>

                {/* Prev / next */}
                {(previous || next) && (
                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {previous ? (
                      <Link
                        href={`/posts/${previous.slug}`}
                        className="group rounded-2xl border border-navy-100 bg-white/70 p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-glass"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-300">
                          Previous
                        </span>
                        <p className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug text-navy-900 group-hover:text-blue-600">
                          {previous.title}
                        </p>
                      </Link>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <Link
                        href={`/posts/${next.slug}`}
                        className="group rounded-2xl border border-navy-100 bg-white/70 p-5 text-right transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-glass"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-navy-300">
                          Next
                        </span>
                        <p className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug text-navy-900 group-hover:text-blue-600">
                          {next.title}
                        </p>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                {toc.length > 1 && (
                  <nav
                    aria-label="On this page"
                    className="rounded-2xl border border-navy-100 bg-white/70 p-5"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-navy-400">
                      <IconListSearch size={14} />
                      In this post
                    </div>
                    <ul className="mt-3 space-y-2">
                      {toc.map((heading) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            className="block border-l-2 border-navy-100 pl-3 text-sm leading-snug text-navy-500 transition-colors hover:border-blue-500 hover:text-blue-600"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <div
                  className="rounded-2xl p-6 text-white"
                  style={{ backgroundImage: `linear-gradient(135deg, ${theme.color}, #0F2A43)` }}
                >
                  <h2 className="font-display text-base font-bold">Put this into practice</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Talk to the team building connected hospital, pharmacy and laboratory systems.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-900 transition-transform hover:-translate-y-0.5"
                  >
                    Contact us
                    <IconArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="relative border-t border-navy-100 bg-white/50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="chip">Keep reading</span>
                <h2 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.02em] text-navy-900 sm:text-3xl">
                  Related posts
                </h2>
              </div>
              <Link
                href="/posts"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
              >
                All posts
                <IconArrowRight size={16} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item._id ?? item.slug} post={toPostListItem(item)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
