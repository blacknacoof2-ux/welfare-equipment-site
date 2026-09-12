import type { MetadataRoute } from 'next';
import { publishedProducts } from '@/lib/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/guide/copay`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  const productPages: MetadataRoute.Sitemap = publishedProducts.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.sourceCheckedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
