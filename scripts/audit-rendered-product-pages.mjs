const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';
const expectedProductCount = Number(process.env.EXPECTED_PRODUCT_COUNT ?? 352);
const searchOnlyModels = ['HM-606', 'HM-608'];

// 2026-09-14 전수검수에서 표준 Eroum/Gagaon 400/600 정사각형 썸네일 규칙을 벗어난
// 3개 제품만 모델·급여코드·이미지 내용을 수동 확인하여 허용합니다.
const manuallyAuditedHeroUrls = new Set([
  'https://eroumcare.com/data/item/new/M18030043103.jpg',
  'https://eroumcare.com/data/item/PRO2021022500577/YHCR02.png',
  'https://carestore.co.kr/welfare/details/images/M03031003103/09.jpg',
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
    const hasHero = Boolean(heroUrl);
    const approvedHero = isApprovedCatalogHero(heroUrl);
    const manualHero = Boolean(heroUrl && manuallyAuditedHeroUrls.has(heroUrl));
    const hasSellerDetailImage = html.includes(`id=\"detail-image-${slug}-1\"`) || html.includes(`id='detail-image-${slug}-1'`);
    const hasSellerDetailHeading = html.includes('제품 상세 이미지');
    const hasGalleryThumbs = html.includes('product-gallery-thumbs');
    return {
      slug,
      status: response.status,
      heroUrl,
      hasHero,
      approvedHero,
      manualHero,
      hasSellerDetailImage,
      hasSellerDetailHeading,
      hasGalleryThumbs,
      ok: response.status === 200
        && hasHero
        && approvedHero
        && !hasSellerDetailImage
        && !hasSellerDetailHeading
        && !hasGalleryThumbs,
    };
  } catch (error) {
    return {
      slug,
      status: null,
      heroUrl: null,
      hasHero: false,
      approvedHero: false,
      manualHero: false,
      hasSellerDetailImage: false,
      hasSellerDetailHeading: false,
      hasGalleryThumbs: false,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const failures = results.filter((item) => !item.ok);
const manualHeroes = results.filter((item) => item.manualHero).map(({ slug, heroUrl }) => ({ slug, heroUrl }));
const countMismatch = productUrls.length !== expectedProductCount;
const sourceCounts = results.reduce((acc, item) => {
  if (!item.heroUrl) {
    acc.MISSING += 1;
  } else if (manuallyAuditedHeroUrls.has(item.heroUrl)) {
    acc.MANUAL += 1;
  } else if (item.heroUrl.includes('eroumcare.com/data/item/')) {
    acc.EROUM_STANDARD += 1;
  } else if (item.heroUrl.includes('gagaon.com/data/item/')) {
    acc.GAGAON_STANDARD += 1;
  } else {
    acc.OTHER += 1;
  }
  return acc;
}, { EROUM_STANDARD: 0, GAGAON_STANDARD: 0, MANUAL: 0, OTHER: 0, MISSING: 0 });

console.log(JSON.stringify({
  summary: {
    sitemapProductUrls: productUrls.length,
    expectedProductCount,
    countMismatch,
    representativeOnlyPassed: results.length - failures.length,
    representativeOnlyFailed: failures.length,
    approvedHeroSourceCounts: sourceCounts,
    manuallyAuditedHeroCount: manualHeroes.length,
    searchOnlyVisibilityChecks: browseSurfaces.length * searchOnlyModels.length + searchOnlyModels.length,
    searchOnlyVisibilityFailures: visibilityFailures.length,
  },
  manualHeroes,
  visibilityFailures,
  failures,
}, null, 2));

if (countMismatch || failures.length || manualHeroes.length !== 3 || visibilityFailures.length) process.exitCode = 1;
