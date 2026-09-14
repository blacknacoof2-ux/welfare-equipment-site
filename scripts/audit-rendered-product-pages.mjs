const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';
const expectedProductCount = Number(process.env.EXPECTED_PRODUCT_COUNT ?? 352);
const searchOnlyModels = ['HM-606', 'HM-608'];

const manuallyAuditedHeroUrls = new Set([
  'https://eroumcare.com/data/item/new/M18030043103.jpg',
  'https://eroumcare.com/data/item/PRO2021022500577/YHCR02.png',
  'https://carestore.co.kr/welfare/details/images/M03031003103/09.jpg',
]);

const blockedSellerDetailUrls = new Set([
  'https://gagaon.com/data/editor/2602/01b3bea2a86eeb0ba426a4e70c76e8a7_1772165443_1595.jpg',
]);

const requiredDetailSlugs = new Set([
  'wag02-adult-walker',
  'nice-walker-4s',
  'asc-502-bath-chair',
  'iu-bath-chair',
]);

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function decodeHtmlAttribute(value) {
  return decodeXml(value).replaceAll('&#x2F;', '/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractHeroSrc(html, slug) {
  const id = escapeRegExp(`product-hero-${slug}`);
  const idFirst = new RegExp(`<img[^>]*id=["']${id}["'][^>]*src=["']([^"']+)["']`, 'i');
  const srcFirst = new RegExp(`<img[^>]*src=["']([^"']+)["'][^>]*id=["']${id}["']`, 'i');
  const match = html.match(idFirst) ?? html.match(srcFirst);
  return match ? decodeHtmlAttribute(match[1]) : null;
}

function extractDetailSrcs(html, slug) {
  const escapedSlug = escapeRegExp(slug);
  const pattern = new RegExp(
    `<figure[^>]*id=["']detail-image-${escapedSlug}-\\d+["'][^>]*>[\\s\\S]*?<img[^>]*src=["']([^"']+)["']`,
    'gi',
  );
  return Array.from(html.matchAll(pattern), (match) => decodeHtmlAttribute(match[1]));
}

function isStandardCatalogHero(url) {
  if (!url) return false;
  const normalized = url.toLowerCase();
  const isSquareThumb = normalized.includes('thumb-')
    && (normalized.includes('400x400') || normalized.includes('600x600'));
  if (!isSquareThumb) return false;

  return normalized.startsWith('https://eroumcare.com/data/item/')
    || normalized.startsWith('https://www.eroumcare.com/data/item/')
    || normalized.startsWith('https://gagaon.com/data/item/')
    || normalized.startsWith('https://www.gagaon.com/data/item/');
}

function isApprovedCatalogHero(url) {
  return Boolean(url) && (isStandardCatalogHero(url) || manuallyAuditedHeroUrls.has(url));
}

function isApprovedRenderedDetail(url) {
  if (!url || blockedSellerDetailUrls.has(url)) return false;
  const normalized = url.toLowerCase();
  if (!normalized.startsWith('https://')) return false;
  if (!/\.(?:webp|png|gif|jpe?g)(?:\?.*)?$/.test(normalized)) return false;
  if (normalized.includes('/banner/') || normalized.includes('/intro/') || normalized.includes('notice_') || normalized.includes('/event/')) return false;
  return true;
}

async function waitForServer() {
  let lastError = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (response.status < 500) return;
      lastError = new Error(`home returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError ?? new Error(`Server did not become ready: ${baseUrl}`);
}

async function fetchHtml(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'follow' });
  const html = await response.text();
  if (!response.ok) throw new Error(`${pathname} returned ${response.status}`);
  return html;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

await waitForServer();

const visibilityFailures = [];
const browseSurfaces = [
  ['home', '/'],
  ['products', '/products'],
  ['adult-walker-category', '/categories/adult-walker'],
  ['consult-ranking', '/consult'],
];

for (const [surface, pathname] of browseSurfaces) {
  const html = await fetchHtml(pathname);
  for (const model of searchOnlyModels) {
    if (html.includes(model)) visibilityFailures.push({ surface, model, reason: 'VISIBLE_WITHOUT_SEARCH' });
  }
}

for (const model of searchOnlyModels) {
  const html = await fetchHtml(`/products?q=${encodeURIComponent(model)}`);
  if (!html.includes(model)) visibilityFailures.push({ surface: 'product-search', model, reason: 'MISSING_FROM_SEARCH' });
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
if (!sitemapResponse.ok) throw new Error(`sitemap returned ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const locs = Array.from(sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (match) => decodeXml(match[1].trim()));
const productUrls = Array.from(new Set(locs.filter((value) => {
  try {
    const url = new URL(value);
    return url.pathname.startsWith('/products/') && url.pathname !== '/products/';
  } catch {
    return false;
  }
})));

const results = await mapLimit(productUrls, 20, async (sitemapUrl) => {
  const parsed = new URL(sitemapUrl);
  const url = `${baseUrl}${parsed.pathname}${parsed.search}`;
  const slug = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).at(-1) ?? '');

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const html = await response.text();
    const heroUrl = extractHeroSrc(html, slug);
    const detailUrls = extractDetailSrcs(html, slug);
    const detailPolicyFailures = detailUrls.filter((detailUrl) => !isApprovedRenderedDetail(detailUrl));
    const blockedDetailRendered = detailUrls.filter((detailUrl) => blockedSellerDetailUrls.has(detailUrl));
    const hasGalleryThumbs = html.includes('product-gallery-thumbs');
    const hasLegacyVerificationPanel = html.includes('원문·검증 자료');

    return {
      slug,
      status: response.status,
      heroUrl,
      detailUrls,
      detailPolicyFailures,
      blockedDetailRendered,
      hasGalleryThumbs,
      hasLegacyVerificationPanel,
      manualHero: Boolean(heroUrl && manuallyAuditedHeroUrls.has(heroUrl)),
      ok: response.status === 200
        && Boolean(heroUrl)
        && isApprovedCatalogHero(heroUrl)
        && detailPolicyFailures.length === 0
        && blockedDetailRendered.length === 0
        && !hasGalleryThumbs
        && !hasLegacyVerificationPanel,
    };
  } catch (error) {
    return {
      slug,
      status: null,
      heroUrl: null,
      detailUrls: [],
      detailPolicyFailures: [],
      blockedDetailRendered: [],
      hasGalleryThumbs: false,
      hasLegacyVerificationPanel: false,
      manualHero: false,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const failures = results.filter((item) => !item.ok);
const manualHeroes = results.filter((item) => item.manualHero).map(({ slug, heroUrl }) => ({ slug, heroUrl }));
const missingRequiredDetail = results
  .filter((item) => requiredDetailSlugs.has(item.slug) && item.detailUrls.length === 0)
  .map((item) => item.slug);
const countMismatch = productUrls.length !== expectedProductCount;
const detailPagesWithImages = results.filter((item) => item.detailUrls.length > 0).length;
const renderedDetailImageCount = results.reduce((sum, item) => sum + item.detailUrls.length, 0);
const verificationPanelCount = results.filter((item) => item.hasLegacyVerificationPanel).length;

const sourceCounts = results.reduce((acc, item) => {
  if (!item.heroUrl) acc.MISSING += 1;
  else if (manuallyAuditedHeroUrls.has(item.heroUrl)) acc.MANUAL += 1;
  else if (item.heroUrl.includes('eroumcare.com/data/item/')) acc.EROUM_STANDARD += 1;
  else if (item.heroUrl.includes('gagaon.com/data/item/')) acc.GAGAON_STANDARD += 1;
  else acc.OTHER += 1;
  return acc;
}, { EROUM_STANDARD: 0, GAGAON_STANDARD: 0, MANUAL: 0, OTHER: 0, MISSING: 0 });

console.log(JSON.stringify({
  summary: {
    sitemapProductUrls: productUrls.length,
    expectedProductCount,
    countMismatch,
    pageAuditPassed: results.length - failures.length,
    pageAuditFailed: failures.length,
    approvedHeroSourceCounts: sourceCounts,
    manuallyAuditedHeroCount: manualHeroes.length,
    detailPagesWithImages,
    renderedDetailImageCount,
    requiredDetailProducts: requiredDetailSlugs.size,
    missingRequiredDetailCount: missingRequiredDetail.length,
    legacyVerificationPanelCount: verificationPanelCount,
    searchOnlyVisibilityChecks: browseSurfaces.length * searchOnlyModels.length + searchOnlyModels.length,
    searchOnlyVisibilityFailures: visibilityFailures.length,
  },
  manualHeroes,
  missingRequiredDetail,
  visibilityFailures,
  failures,
}, null, 2));

if (
  countMismatch
  || failures.length
  || manualHeroes.length !== 3
  || missingRequiredDetail.length
  || visibilityFailures.length
) process.exitCode = 1;
