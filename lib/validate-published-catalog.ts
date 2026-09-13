import { categories } from './all-categories';
import { getProductMedia } from './product-images';
import { getBenefitMode, publishedProducts } from './products';

export function validatePublishedCatalog() {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  const seenCodes = new Set<string>();
  const categoryNames = new Set(categories.map((category) => category.name));

  if (publishedProducts.length < 300) {
    errors.push(`published product count unexpectedly low: ${publishedProducts.length}`);
  }

  for (const product of publishedProducts) {
    if (product.status !== 'ACTIVE') errors.push(`${product.slug}: published status is ${product.status}`);
    if (!product.slug || seenSlugs.has(product.slug)) errors.push(`${product.slug || '(empty slug)'}: duplicate/empty slug`);
    if (!product.benefitCode || seenCodes.has(product.benefitCode)) errors.push(`${product.slug}: duplicate/empty benefit code ${product.benefitCode}`);
    seenSlugs.add(product.slug);
    seenCodes.add(product.benefitCode);

    if (!product.name.trim()) errors.push(`${product.slug}: missing product name`);
    if (!product.model.trim()) errors.push(`${product.slug}: missing model`);
    if (!product.manufacturer.trim()) errors.push(`${product.slug}: missing manufacturer/supplier`);
    if (!categoryNames.has(product.category)) errors.push(`${product.slug}: missing category definition for ${product.category}`);
    if (!Number.isFinite(product.benefitPrice) || product.benefitPrice <= 0) errors.push(`${product.slug}: invalid benefit price`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(product.sourceCheckedAt)) errors.push(`${product.slug}: invalid sourceCheckedAt ${product.sourceCheckedAt}`);
    if (!product.verificationSources?.length) errors.push(`${product.slug}: missing verification source`);

    const mode = getBenefitMode(product);
    if (mode === 'PURCHASE_OR_RENTAL' && (!product.rentalMonthlyPrice || product.rentalMonthlyPrice <= 0)) {
      errors.push(`${product.slug}: purchase-or-rental product is missing monthly rental price`);
    }

    const media = getProductMedia(product);
    if (!media?.heroUrl) {
      errors.push(`${product.slug}: missing HERO product image`);
    } else {
      const gallery = new Set(media.galleryUrls);
      const detail = new Set(media.detailUrls);
      if (gallery.has(media.heroUrl)) errors.push(`${product.slug}: HERO duplicated in GALLERY`);
      if (detail.has(media.heroUrl)) errors.push(`${product.slug}: HERO duplicated in DETAIL`);
      for (const url of gallery) {
        if (detail.has(url)) errors.push(`${product.slug}: same image used in GALLERY and DETAIL`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Published catalog validation failed (${errors.length})\n${errors.slice(0, 50).join('\n')}`);
  }
}
