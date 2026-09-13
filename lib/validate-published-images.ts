import { getProductMedia } from './product-images';
import { publishedProducts } from './products';

export function validatePublishedProductImages() {
  const missingHero: string[] = [];
  const roleConflicts: string[] = [];

  for (const product of publishedProducts) {
    const media = getProductMedia(product);
    if (!media?.heroUrl) {
      missingHero.push(`${product.slug} (${product.name})`);
      continue;
    }

    const gallery = new Set(media.galleryUrls);
    const detail = new Set(media.detailUrls);

    if (gallery.has(media.heroUrl) || detail.has(media.heroUrl)) {
      roleConflicts.push(`${product.slug}: HERO URL duplicated in another role`);
    }

    for (const url of gallery) {
      if (detail.has(url)) {
        roleConflicts.push(`${product.slug}: GALLERY/DETAIL overlap ${url}`);
      }
    }
  }

  if (missingHero.length > 0) {
    throw new Error(`Published products missing HERO image: ${missingHero.join(', ')}`);
  }

  if (roleConflicts.length > 0) {
    throw new Error(`Published product media role conflicts: ${roleConflicts.join(' | ')}`);
  }

  return {
    publishedCount: publishedProducts.length,
    heroMappedCount: publishedProducts.length - missingHero.length,
    detailMappedCount: publishedProducts.filter((product) => (getProductMedia(product)?.detailUrls.length ?? 0) > 0).length,
    roleConflictCount: roleConflicts.length,
  };
}
