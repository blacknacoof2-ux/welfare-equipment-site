import type { MetadataRoute } from 'next';
import { categories } from '@/lib/all-categories';
import { publishedProducts } from '@/lib/products';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/consult`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/guide/welfare-equipment`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/guide/copay`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/compare/wag02-vs-sporty`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((category) => publishedProducts.some((product) => product.category === category.name))
    .map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: category.slug === 'adult-walker' ? 0.9 : 0.8,
    }));

  const productPages: MetadataRoute.Sitemap = publishedProducts.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.sourceCheckedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
