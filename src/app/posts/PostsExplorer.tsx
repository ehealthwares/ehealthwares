'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  IconArrowRight,
  IconClock,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import {
  POST_CATEGORIES,
  formatPostDate,
  getPostCategory,
  type PostListItem,
} from '@/lib/posts';
import { SiteImage } from '@/components/shared';

interface PostsExplorerProps {
  posts: PostListItem[];
}

const ALL = 'All';

export function PostsExplorer({ posts }: PostsExplorerProps) {
  const [category, setCategory] = useState<string>(ALL);
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      const label = getPostCategory(post.category).label;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return POST_CATEGORIES.filter((c) => counts.has(c.label)).map((c) => ({
      ...c,
      count: counts.get(c.label) ?? 0,
    }));
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        category === ALL || getPostCategory(post.category).label === category;
      if (!matchesCategory) return false;
      if (!needle) return true;
      const haystack = `${post.title} ${post.excerpt ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [posts, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by theme">
          <button
            type="button"
            onClick={() => setCategory(ALL)}
            aria-pressed={category === ALL}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
              category === ALL
                ? 'border-navy-900 bg-navy-900 text-white shadow-md'
                : 'border-navy-200 bg-white/70 text-navy-600 hover:border-navy-300 hover:text-navy-900'
            }`}
          >
            {ALL} <span className="ml-1 opacity-60">{posts.length}</span>
          </button>
          {categories.map((c) => {
            const active = category === c.label;
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.label)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
                  active
                    ? 'border-transparent text-white shadow-md'
                    : 'border-navy-200 bg-white/70 text-navy-600 hover:border-navy-300 hover:text-navy-900'
                }`}
                style={active ? { backgroundColor: c.color } : undefined}
              >
                {c.label} <span className="ml-1 opacity-60">{c.count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts…"
            aria-label="Search posts"
            className="w-full rounded-full border border-navy-200 bg-white/80 py-2.5 pl-10 pr-10 text-sm text-navy-800 placeholder:text-navy-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              <IconX size={15} />
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-navy-400" aria-live="polite">
        Showing <span className="font-semibold text-navy-700">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'post' : 'posts'}
        {category !== ALL ? ` in ${category}` : ''}
        {query ? ` matching “${query}”` : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="glass-card mt-8 rounded-3xl p-12 text-center">
          <h3 className="font-display text-xl font-bold text-navy-900">Nothing matches that yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy-500">
            Try a different theme, or clear the search to see the whole archive.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory(ALL);
              setQuery('');
            }}
            className="btn-outline-brand mt-6"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post._id ?? post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostCard({ post }: { post: PostListItem }) {
  const theme = getPostCategory(post.category);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="bento-card group flex flex-col"
      data-testid={`post-card-${post.slug}`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        {post.imageUrl ? (
          <SiteImage
            src={post.imageUrl}
            alt={post.title}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(135deg, ${theme.color}, #0F2A43)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />
        <span
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-md"
          style={{ backgroundColor: theme.color }}
        >
          {theme.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-bold leading-snug text-navy-900 transition-colors group-hover:text-blue-600">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-navy-500">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-navy-100 pt-5">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-navy-400">
            <IconClock size={14} />
            {post.minutes} min read
            {post.publishedAt && formatPostDate(post.publishedAt) && (
              <>
                <span className="text-navy-200">•</span>
                {formatPostDate(post.publishedAt)}
              </>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-600">
            Read
            <IconArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
