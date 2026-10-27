export interface SiteSection {
  _id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  features: string[];
  iconName: string | null;
  imageUrl: string | null;
  displayOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface Service {
  _id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  iconName: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface Testimonial {
  _id: string;
  name: string;
  role: string | null;
  company: string | null;
  text: string;
  avatarUrl: string | null;
  displayOrder: number;
}

export interface Partner {
  _id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  displayOrder: number;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface SiteSettings {
  [key: string]: unknown;
}

export interface HeroSlide {
  _id: string;
  title: string | null;
  subtitle: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  ctaText: string | null;
  ctaLink: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  imageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
  isActive: boolean;
}

export interface InvestorData {
  _id: string;
  label: string;
  value: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface Career {
  _id: string;
  title: string;
  slug: string;
  location: string | null;
  type: 'full-time' | 'contract' | 'remote';
  department: string | null;
  description: string | null;
  detailHtml?: string;
  imageUrl: string | null;
  isActive: boolean;
}
