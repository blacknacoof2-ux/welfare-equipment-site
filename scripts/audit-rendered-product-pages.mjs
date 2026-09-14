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

// 판매업체 연락처/서비스지역이 섞일 수 있는 장문 판매시트는 기본 차단합니다.
// 아래 4개 제품은 동일 모델의 기능·규격 상세자료로 별도 검수하여 복구한 예외입니다.
const manuallyReviewedDetailUrlsBySlug = {
  'wag02-adult-walker': new Set([
    'https://godomall.speedycdn.net/e9c45f52a146ba8cbf23a3fd8738b016/goods/1000008875/image/detail/1000008875_detail_053.jpg',
  ]),
  'nice-walker-4s': new Set([
    'https://m.escaremall.com/web/upload/NNEditor/20200128/%EC%83%81%EC%84%B83_shop1_005905.jpg',
  ]),
  'asc-502-bath-chair': new Set([
    'https://m.k-medi.co.kr/web/upload/NNEditor/20220809/mobile/01e2a0e4fa860eb6c47a1b2a9ce4ea20_1660021630.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/uQ3XZ_102745_7.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/ZQcxi_102745_8.jpg',
    'https://shopby-images.cdn-nhncommerce.com/PARTNER/20260306/PARTNER_10016343/2026030614411927476813d63a4fa1987ab1be76564dc4/lxwMn_102745_9.jpg',
  ]),
  'iu-bath-chair': new Set([
    'https://m.swmedi.co.kr/web/product/big/202503/5bc611c8fb398093becd27a5bd7fa69c.jpg',
  ]),
};

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

function isApprovedRenderedDetail(slug, url) {
  if (!url) return false;
  if (manuallyReviewedDetailUrlsBySlug[slug]?.has(url)) return true;

  const normalized = url.toLowerCase();
  return normalized.startsWith('https://www.carestore.co.kr/sscp/dt/')
    && /\.(?:webp|png|jpe?g)(?:\?.*)?$/.test(normalized);
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
    const hasHero = Boolean(heroUrl);
    const approvedHero = isApprovedCatalogHero(heroUrl);
    const manualHero = Boolean(heroUrl && manuallyAuditedHeroUrls.has(heroUrl));
    const hasDetailHeading = html.includes('제품 상세 이미지');
    const detailPolicyFailures = detailUrls.filter((detailUrl) => !isApprovedRenderedDetail(slug, detailUrl));
    const detailHeadingConsistent = detailUrls.length > 0 ? hasDetailHeading : !hasDetailHeading;
    const hasGalleryThumbs = html.includes('product-gallery-thumbs');
    return {
      slug,
      status: response.status,
      heroUrl,
      detailUrls,
      hasHero,
      approvedHero,
      manualHero,
      hasDetailHeading,
      detailHeadingConsistent,
      detailPolicyFailures,
      hasGalleryThumbs,
      ok: response.status === 200
        && hasHero
        && approvedHero
        && detailPolicyFailures.length === 0
        && detailHeadingConsistent
        && !hasGalleryThumbs,
    };
  } catch (error) {
    return {
      slug,
      status: null,
      heroUrl: null,
      detailUrls: [],
      hasHero: false,
      approvedHero: false,
      manualHero: false,
      hasDetailHeading: false,
      detailHeadingConsistent: false,
      detailPolicyFailures: [],
      hasGalleryThumbs: false,
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
    vettedPageAuditPassed: results.length - failures.length,
    vettedPageAuditFailed: failures.length,
    approvedHeroSourceCounts: sourceCounts,
    manuallyAuditedHeroCount: manualHeroes.length,
    detailPagesWithImages,
    renderedDetailImageCount,
    requiredDetailProducts: requiredDetailSlugs.size,
    missingRequiredDetailCount: missingRequiredDetail.length,
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
