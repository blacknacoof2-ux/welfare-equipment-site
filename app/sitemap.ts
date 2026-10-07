import type { MetadataRoute } from 'next';
import { categories } from '@/lib/all-categories';
import { filterBrowseProducts } from '@/lib/product-visibility';
import { publishedProducts } from '@/lib/products';

function latestCheckedAt(products: typeof publishedProducts) {
  const timestamps = products
    .map((product) => Date.parse(product.sourceCheckedAt))
    .filter((value) => Number.isFinite(value));
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000';
  const indexableProducts = filterBrowseProducts(publishedProducts);
  const catalogLastModified = latestCheckedAt(indexableProducts);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, ...(catalogLastModified ? { lastModified: catalogLastModified } : {}) },
    { url: `${baseUrl}/products`, ...(catalogLastModified ? { lastModified: catalogLastModified } : {}) },
    { url: `${baseUrl}/consult` },
    { url: `${baseUrl}/guide/welfare-equipment` },
    { url: `${baseUrl}/guide/copay` },
    { url: `${baseUrl}/compare/wag02-vs-sporty` },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category) => {
    const categoryProducts = indexableProducts.filter((product) => product.category === category.name);
    if (categoryProducts.length === 0) return [];
    const lastModified = latestCheckedAt(categoryProducts);
    return [{
      url: `${baseUrl}/categories/${category.slug}`,
      ...(lastModified ? { lastModified } : {}),
    }];
  });

  const productPages: MetadataRoute.Sitemap = indexableProducts.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.sourceCheckedAt),
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
