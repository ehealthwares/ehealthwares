import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ehealthwaresApi } from '@/lib/api';
import { clearCaches } from '@/lib/cache';
import { Hero } from '@/components/sections/Hero';
import { Categories } from '@/components/sections/Categories';
import { ProductsGrid } from '@/components/sections/ProductsGrid';
import { ServicesGrid } from '@/components/sections/ServicesGrid';
import { LatestTopics } from '@/components/sections/LatestTopics';
import { Testimonials } from '@/components/sections/Testimonials';
import { Partners } from '@/components/sections/Partners';
import { Investors } from '@/components/sections/Investors';
import { Careers } from '@/components/sections/Careers';
import { StatsBar } from '@/components/sections/StatsBar';
import { Box } from '@mantine/core';
import { CTABanner } from '@/components/sections/CTABanner';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ehealthwares.com';

export const metadata: Metadata = {
  title: 'eHealthwares — Building Connected Healthcare Technology Ecosystems',
  description:
    'eHealthwares designs and delivers enterprise healthcare technology solutions — EMR, pharmacy management, laboratory, radiology, interoperability (HL7/FHIR), and digital health platforms for hospitals, clinics, and healthcare organizations.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'eHealthwares',
    title: 'eHealthwares — Building Connected Healthcare Technology Ecosystems',
    description:
      'Enterprise healthcare technology solutions — EMR, pharmacy, laboratory, radiology, interoperability, and digital health platforms.',
    images: [{ url: '/logo-rect.png', width: 512, height: 512, alt: 'eHealthwares' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eHealthwares — Building Connected Healthcare Technology Ecosystems',
    description:
      'Enterprise healthcare technology solutions — EMR, pharmacy, laboratory, radiology, interoperability, and digital health platforms.',
    images: ['/logo-rect.png'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'eHealthwares',
  url: SITE_URL,
  description:
    'Enterprise healthcare technology solutions — EMR, pharmacy, laboratory, radiology, interoperability, and digital health platforms.',
  publisher: {
    '@type': 'Organization',
    name: 'eHealthwares',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-rect.png` },
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { 'clear-cache'?: string };
}) {
  const clearScope = searchParams?.['clear-cache'];
  if (clearScope === 'client' || clearScope === 'server' || clearScope === 'all') {
    await clearCaches(clearScope);
    redirect('/');
  }

  let sections = null, products = null, services = null, testimonials = null,
      partners = null, heroSlides = null, categories = null, articles = null,
      investorData = null, careers = null;
  try {
    [sections, products, services, testimonials, partners, heroSlides, categories, articles, investorData, careers] =
      await Promise.all([
        ehealthwaresApi.getSections(),
        ehealthwaresApi.getProducts(),
        ehealthwaresApi.getServices(),
        ehealthwaresApi.getTestimonials(),
        ehealthwaresApi.getPartners(),
        ehealthwaresApi.getHeroSlides(),
        ehealthwaresApi.getCategories(),
        ehealthwaresApi.getArticles(),
        ehealthwaresApi.getInvestorData(),
        ehealthwaresApi.getCareers(),
      ]);
  } catch (e) {
    console.error('HomePage data fetch failed:', e);
  }

  const sectionList = sections ?? [];
  const productList = products ?? [];
  const serviceList = services ?? [];
  const testimonialList = testimonials ?? [];
  const partnerList = partners ?? [];
  const slideList = heroSlides ?? [];
  const categoryList = categories ?? [];
  const articleList = articles ?? [];
  const investorList = investorData ?? [];
  const careerList = careers ?? [];

  const ctaSection =
    sectionList.find((s) => s.key === 'cta') ?? {
      _id: '', key: 'cta',
      title: 'Ready to transform your healthcare technology?',
      subtitle: 'Talk to our solutions team about RxSoft and our interoperability services.',
      content: null, imageUrl: null, displayOrder: 0, isActive: true,
    };

  return (
    <>
      <Hero slides={slideList} />
      <Box id="categories"><Categories categories={categoryList} /></Box>
      <ProductsGrid products={productList} />
      <ServicesGrid services={serviceList} />
      <LatestTopics articles={articleList} />
      <Testimonials testimonials={testimonialList} />
      <Partners partners={partnerList} />
      <Investors data={investorList} />
      <Careers careers={careerList} />
      <StatsBar />
      <CTABanner section={ctaSection} />
      <ChatbotWidget />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
    </>
  );
}
