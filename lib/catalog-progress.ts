import { officialCatalogTargets, OFFICIAL_CATALOG_TOTAL } from './catalog-targets';
import { products } from './products';

const excludedStatuses = new Set([
  'DISCONTINUED',
  'NOT_DISTRIBUTED',
  'OUT_OF_STOCK',
  'TEMP_OUT_OF_STOCK',
]);

export const catalogProgress = Object.entries(officialCatalogTargets).map(([category, target]) => {
  const categoryProducts = products.filter((product) => product.category === category);
  const active = categoryProducts.filter((product) => product.status === 'ACTIVE').length;
  const pending = categoryProducts.filter(
    (product) => product.status === 'PENDING_EROUM_VERIFICATION',
  ).length;
  const excluded = categoryProducts.filter((product) => excludedStatuses.has(product.status)).length;
  const accounted = active + pending + excluded;

  return {
    category,
    target,
    active,
    pending,
    excluded,
    accounted,
    missing: Math.max(target - accounted, 0),
    coverage: target === 0 ? 100 : Math.min(100, Math.round((accounted / target) * 1000) / 10),
  };
});

export const catalogProgressSummary = catalogProgress.reduce(
  (summary, item) => {
    summary.active += item.active;
    summary.pending += item.pending;
    summary.excluded += item.excluded;
    summary.accounted += item.accounted;
    summary.missing += item.missing;
    return summary;
  },
  {
    target: OFFICIAL_CATALOG_TOTAL,
    active: 0,
    pending: 0,
    excluded: 0,
    accounted: 0,
    missing: 0,
  },
);
