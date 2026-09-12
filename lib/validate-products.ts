import type { Product } from './products';
import { officialCatalogTargets } from './catalog-targets';

function isEroumSource(url: string) {
  return /(^|\.)eroumcare\.com\//i.test(new URL(url).hostname + '/');
}

function isBenefitVerificationSource(url: string) {
  const hostname = new URL(url).hostname;
  return (
    hostname.endsWith('nhis.or.kr') ||
    hostname.endsWith('longtermcare.or.kr') ||
    hostname.endsWith('carestore.co.kr')
  );
}

export function validateProductCatalog(products: Product[]) {
  const slugs = new Set<string>();
  const benefitCodes = new Set<string>();
  const categoryCounts = new Map<string, number>();

  for (const product of products) {
    if (!(product.category in officialCatalogTargets)) {
      throw new Error(`Unknown official welfare category: ${product.category} (${product.slug})`);
    }

    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);

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

    if (
      product.rentalMonthlyPrice !== undefined &&
      (!Number.isFinite(product.rentalMonthlyPrice) || product.rentalMonthlyPrice <= 0)
    ) {
      throw new Error(`Invalid rental monthly price: ${product.slug}`);
    }

    if (product.benefitMode === 'PURCHASE_OR_RENTAL' && product.rentalMonthlyPrice === undefined) {
      throw new Error(`PURCHASE_OR_RENTAL product requires rentalMonthlyPrice: ${product.slug}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(product.sourceCheckedAt)) {
      throw new Error(`Invalid sourceCheckedAt: ${product.slug}`);
    }

    if (product.status === 'ACTIVE') {
      if (product.verificationSources.length < 2) {
        throw new Error(`ACTIVE product requires at least two verification sources: ${product.slug}`);
      }

      const urls = product.verificationSources.map((source) => source.url);
      if (!urls.some(isEroumSource)) {
        throw new Error(`ACTIVE product requires current Eroum verification: ${product.slug}`);
      }
      if (!urls.some(isBenefitVerificationSource)) {
        throw new Error(`ACTIVE product requires benefit-code/price verification: ${product.slug}`);
      }
    }

    if (product.imageRightsConfirmed && !product.imageUrl) {
      throw new Error(`Image rights confirmed but imageUrl missing: ${product.slug}`);
    }
  }

  for (const [category, count] of categoryCounts) {
    const officialTarget = officialCatalogTargets[category as keyof typeof officialCatalogTargets];
    if (count > officialTarget) {
      throw new Error(
        `Catalog exceeds official target: ${category} has ${count}, official target ${officialTarget}`,
      );
    }
  }
}
