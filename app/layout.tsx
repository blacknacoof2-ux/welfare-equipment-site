import type { Metadata } from 'next';
import SiteChrome from '@/components/SiteChrome';
import { validatePublishedCatalog } from '@/lib/validate-published-catalog';
import { validatePublishedProductImages } from '@/lib/validate-published-images';
import './globals.css';
import './product-media.css';
import './catalog-enhancements.css';
import './consult.css';
import './address-search.css';
import './recommender.css';

validatePublishedProductImages();
validatePublishedCatalog();

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '아톰케어랩 복지용구 | 장기요양 본인부담금·제품비교',
    template: '%s | 아톰케어랩 복지용구',
  },
  description: '장기요양 복지용구를 품목별로 찾고, 15%·9%·6% 본인부담금을 확인하고, 제품 규격과 특징을 비교하세요.',
  keywords: ['복지용구', '장기요양 복지용구', '복지용구 본인부담금', '성인용보행기', '목욕의자', '안전손잡이'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '아톰케어랩 복지용구',
    title: '아톰케어랩 복지용구',
    description: '복지용구 검색·비교·본인부담금 확인',
    url: '/',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '주식회사 아톰케어',
    url: siteUrl,
  };

  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
