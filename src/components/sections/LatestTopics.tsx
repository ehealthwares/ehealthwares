import Link from 'next/link';
import { IconArrowRight, IconCalendar, IconClock } from '@tabler/icons-react';
import type { Article } from '@/lib/types';
import { SectionHeader, SiteImage } from '@/components/shared';
import { formatPostDate, getPostCategory, readingTime } from '@/lib/posts';

interface LatestTopicsProps {
  articles: Article[];
}

export function LatestTopics({ articles }: LatestTopicsProps) {
  if (!articles?.length) return null;

  return (
    <section className="relative overflow-hidden py-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          chip="Latest Posts"
          title={
            <>
              Insights from the <span className="text-gradient">digital health frontier</span>
            </>
          }
          subtitle="Practical thinking on interoperability, automation, and care delivery — from the team building it."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => {
            const theme = getPostCategory(article.category);
            return (
              <Link
                key={article._id}
                href={`/posts/${article.slug}`}
                className="bento-card group flex flex-col"
              >
                {article.imageUrl && (
                  <div className="relative h-44 w-full overflow-hidden">
                    <SiteImage
                      src={article.imageUrl}
                      alt={article.title}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 to-transparent" />
                    {article.category && (
                      <span
                        className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md"
                        style={{ backgroundColor: theme.color }}
                      >
                        {article.category}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-base font-bold leading-snug text-navy-900 transition-colors group-hover:text-blue-600">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-500">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400">
                      <IconClock size={14} />
                      {readingTime(article)} min
                      {article.publishedAt && (
                        <>
                          <span className="text-navy-200">•</span>
                          <IconCalendar size={13} />
                          {formatPostDate(article.publishedAt)}
                        </>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                      Read
                      <IconArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/posts" className="btn-outline-brand">
            View all posts
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
