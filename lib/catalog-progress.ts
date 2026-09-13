import { officialCatalogTargets, OFFICIAL_CATALOG_TOTAL } from './catalog-targets';
import { products } from './products';

const publicationExcludedStatuses = new Set([
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
  const excluded = categoryProducts.filter((product) => publicationExcludedStatuses.has(product.status)).length;
  const removed = categoryProducts.filter(
    (product) => product.status === 'REMOVED_FROM_BENEFIT_LIST',
  ).length;

  // ACTIVE/PENDING/유통제외 상태는 현행 공식 목록에 속하는 제품으로 계산합니다.
  // REMOVED_FROM_BENEFIT_LIST는 과거 기록이므로 현행 724개 커버리지에서는 제외합니다.
  const accounted = active + pending + excluded;

  return {
    category,
    target,
    active,
    pending,
    excluded,
    removed,
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
    summary.removed += item.removed;
    summary.accounted += item.accounted;
    summary.missing += item.missing;
    return summary;
  },
  {
    target: OFFICIAL_CATALOG_TOTAL,
    active: 0,
    pending: 0,
    excluded: 0,
    removed: 0,
    accounted: 0,
    missing: 0,
  },
);
