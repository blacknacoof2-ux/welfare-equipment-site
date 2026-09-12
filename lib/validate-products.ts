import type { Product } from './products';

export function validateProductCatalog(products: Product[]) {
  const slugs = new Set<string>();
  const benefitCodes = new Set<string>();

  for (const product of products) {
    if (slugs.has(product.slug)) {
      throw new Error(`Duplicate product slug: ${product.slug}`);
    }
    slugs.add(product.slug);

    if (benefitCodes.has(product.benefitCode)) {
      throw new Error(`Duplicate benefit code: ${product.benefitCode}`);
    }
    benefitCodes.add(product.benefitCode);

    if (!Number.isFinite(product.benefitPrice) || product.benefitPrice <= 0) {
      throw new Error(`Invalid benefit price: ${product.slug}`);
    }

    if (product.rentalMonthlyPrice !== undefined && (!Number.isFinite(product.rentalMonthlyPrice) || product.rentalMonthlyPrice <= 0)) {
      throw new Error(`Invalid rental monthly price: ${product.slug}`);
    }

    if (product.benefitMode === 'PURCHASE_OR_RENTAL' && product.rentalMonthlyPrice === undefined) {
      throw new Error(`PURCHASE_OR_RENTAL product requires rentalMonthlyPrice: ${product.slug}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(product.sourceCheckedAt)) {
      throw new Error(`Invalid sourceCheckedAt: ${product.slug}`);
    }

    if (product.status === 'ACTIVE' && product.verificationSources.length < 2) {
      throw new Error(`ACTIVE product requires at least two verification sources: ${product.slug}`);
    }

    if (product.imageRightsConfirmed && !product.imageUrl) {
      throw new Error(`Image rights confirmed but imageUrl missing: ${product.slug}`);
    }
  }
}
