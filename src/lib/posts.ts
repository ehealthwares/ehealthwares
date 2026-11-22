import type { Article } from './types';

/**
 * Editorial themes for the Posts section. The `label` values are the exact
 * strings stored in MongoDB (`ehealthwares_articles.category`), so the seed
 * data, the list filters and the article detail page all agree on one source
 * of truth.
 */
export interface PostCategory {
  label: string;
  slug: string;
  color: string;
  tint: string;
  blurb: string;
}

export const POST_CATEGORIES: PostCategory[] = [
  {
    label: 'Access & Exchange',
    slug: 'access-exchange',
    color: '#2563EB',
    tint: 'rgba(37, 99, 235, 0.10)',
    blurb: 'Why access to competent professionals and useful information matters more than proximity to a building.',
  },
  {
    label: 'Hospital, Pharmacy & Lab',
    slug: 'management-systems',
    color: '#0D9488',
    tint: 'rgba(13, 148, 136, 0.10)',
    blurb: 'Integrated systems for the people who run hospitals, pharmacies and laboratories.',
  },
  {
    label: 'Patient Experience',
    slug: 'patient-experience',
    color: '#F59E0B',
    tint: 'rgba(245, 158, 11, 0.12)',
    blurb: 'Choice, time, continuity and communication — from the patient’s side of the consultation.',
  },
  {
    label: 'AI & Conversational Care',
    slug: 'ai-conversational-care',
    color: '#7C3AED',
    tint: 'rgba(124, 58, 237, 0.10)',
    blurb: 'MyAIha, PharmAssiSt and the discipline of keeping healthcare AI useful, supervised and connected.',
  },
  {
    label: 'Digital Health & Industry',
    slug: 'digital-health',
    color: '#F43F5E',
    tint: 'rgba(244, 63, 94, 0.10)',
    blurb: 'Interoperability, security, African engineering realities and connected care ecosystems.',
  },
];

const FALLBACK: PostCategory = {
  label: 'Insights',
  slug: 'insights',
  color: '#2563EB',
  tint: 'rgba(37, 99, 235, 0.10)',
  blurb: 'Thinking on connected healthcare technology.',
};

export function getPostCategory(category: string | null | undefined): PostCategory {
  if (!category) return FALLBACK;
  return (
    POST_CATEGORIES.find((c) => c.label.toLowerCase() === category.toLowerCase()) ?? {
      ...FALLBACK,
      label: category,
      slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    }
  );
}

/** Strip HTML tags and collapse whitespace — used for word counts and previews. */
export function plainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Estimated reading time in minutes, based on the body word count. */
export function readingTime(article: Pick<Article, 'body' | 'excerpt'>): number {
  const words = plainText(article.body || article.excerpt).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * A list/card-friendly projection of an article. The full HTML body is heavy
 * (several KB per post) and is only needed on the detail page, so we drop it
 * before sending posts to client components (filter/search grids).
 */
export type PostListItem = Omit<Article, 'body'> & { minutes: number };

export function toPostListItem(article: Article): PostListItem {
  const { body: _body, ...rest } = article;
  return { ...rest, minutes: readingTime(article) };
}

export function formatPostDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function sortPosts(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function slugifyHeading(text: string): string {
  return plainText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Adds stable ids to the `<h2>`/`<h3>` elements in a post body and returns the
 * rewritten HTML plus the heading list used to build the table of contents.
 */
export function withHeadingAnchors(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();

  const nextHtml = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level, attrs = '', inner) => {
    if (/\sid=/.test(attrs)) return match;
    const text = plainText(inner);
    if (!text) return match;

    let id = slugifyHeading(text) || `section-${headings.length + 1}`;
    let suffix = 2;
    while (used.has(id)) id = `${slugifyHeading(text)}-${suffix++}`;
    used.add(id);

    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: nextHtml, headings };
}

/** Posts that share a category, newest first, excluding the current one. */
export function relatedPosts(articles: Article[], article: Article, limit = 3): Article[] {
  const sameCategory = articles.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  );
  const others = articles.filter(
    (a) => a.slug !== article.slug && a.category !== article.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** Neighbouring posts in the published order (newest first). */
export function adjacentPosts(
  articles: Article[],
  article: Article,
): { previous: Article | null; next: Article | null } {
  const index = articles.findIndex((a) => a.slug === article.slug);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: articles[index + 1] ?? null,
    next: articles[index - 1] ?? null,
  };
}
