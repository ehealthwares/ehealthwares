import type {
  Article,
  Career,
  ContactPayload,
  HeroSlide,
  InvestorData,
  Partner,
  Product,
  ProductCategory,
  Service,
  SiteSection,
  SiteSettings,
  TeamMember,
  Testimonial,
} from './types';

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS)|| 3600
const isServer = typeof window === 'undefined';
// Server-side fetches need an absolute base (runtime env).
// Client-side calls are SAME-ORIGIN: the browser hits /api/... on whatever host
// served the page (nginx / the Next.js route handler proxy it to the backend).
// NEXT_PUBLIC_API_URL is an optional build-time override — left unset so the
// fallback (same-origin) applies.
const API_BASE = isServer
  ? (process.env.API_URL || 'https://api.ehealthwares.com/ehealthwares')
  : (process.env.NEXT_PUBLIC_API_URL || '');

export async function apiGet<T>(path: string): Promise<T | null> {
    const url = `${API_BASE}${path}`;

  try {

    const res = await fetch(`${API_BASE}${path}`, {
      next: {
        revalidate: CACHE_TTL_SECONDS,
        tags: ['ehealthwares']
      }
     });

    if (!res.ok) return null;
    return res.json();
  } catch(error) {
    return null;
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const ehealthwaresApi = {
  getSections: () => apiGet<SiteSection[]>(`/sections`),
  getProducts: () => apiGet<Product[]>(`/products`),
  getProductBySlug: (slug: string) => apiGet<Product>(`/products/${slug}`),
  getServices: () => apiGet<Service[]>(`/services`),
  getServiceBySlug: (slug: string) => apiGet<Service>(`/services/${slug}`),
  getTestimonials: () => apiGet<Testimonial[]>(`/testimonials`),
  getPartners: () => apiGet<Partner[]>(`/partners`),
  getTeam: () => apiGet<TeamMember[]>(`/team`),
  submitContact: (data: ContactPayload) =>
    apiPost<ContactPayload>(`/api/ehealthwares/contact`, data),
  getSettings: () => apiGet<SiteSettings>(`/settings`),
  getHeroSlides: () => apiGet<HeroSlide[]>(`/hero-slides`),
  getCategories: () => apiGet<ProductCategory[]>(`/categories`),
  getArticles: () => apiGet<Article[]>(`/articles`),
  getInvestorData: () => apiGet<InvestorData[]>('/investors'),
  getCareers: () => apiGet<Career[]>('/careers'),
};
