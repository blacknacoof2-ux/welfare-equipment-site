import { hasAuthorizedProductImages } from './product-images';
import { publishedProducts } from './products';

export function validatePublishedProductImages() {
  const missing = publishedProducts
    .filter((product) => !hasAuthorizedProductImages(product))
    .map((product) => `${product.slug} (${product.name})`);

  if (missing.length > 0) {
    throw new Error(`Published products missing images: ${missing.join(', ')}`);
  }

  return {
    publishedCount: publishedProducts.length,
    imageMappedCount: publishedProducts.length - missing.length,
  };
}
