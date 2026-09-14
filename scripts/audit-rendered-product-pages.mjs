const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';
const expectedProductCount = Number(process.env.EXPECTED_PRODUCT_COUNT ?? 352);
const searchOnlyModels = ['HM-606', 'HM-608'];
const representativeImageOverrides = {
  'catalog-s03090178005-electric-bed': 'thumb-7LKc64WEBEDST30_600x600.jpg',
  'catalog-s03090183002-electric-bed': 'thumb-SE7030_1_600x600.jpg',
};

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
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
    const hasHero = html.includes(`id=\"product-hero-${slug}\"`) || html.includes(`id='product-hero-${slug}'`);
    const hasSellerDetailImage = html.includes(`id=\"detail-image-${slug}-1\"`) || html.includes(`id='detail-image-${slug}-1'`);
    const hasSellerDetailHeading = html.includes('제품 상세 이미지');
    const hasGalleryThumbs = html.includes('product-gallery-thumbs');
    const expectedOverride = representativeImageOverrides[slug];
    const overrideOk = !expectedOverride || html.includes(expectedOverride);
    return {
      slug,
      status: response.status,
      hasHero,
      hasSellerDetailImage,
      hasSellerDetailHeading,
      hasGalleryThumbs,
      overrideOk,
      ok: response.status === 200 && hasHero && !hasSellerDetailImage && !hasSellerDetailHeading && !hasGalleryThumbs && overrideOk,
    };
  } catch (error) {
    return {
      slug,
      status: null,
      hasHero: false,
      hasSellerDetailImage: false,
      hasSellerDetailHeading: false,
      hasGalleryThumbs: false,
      overrideOk: false,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const failures = results.filter((item) => !item.ok);
const countMismatch = productUrls.length !== expectedProductCount;
console.log(JSON.stringify({
  summary: {
    sitemapProductUrls: productUrls.length,
    expectedProductCount,
    countMismatch,
    representativeOnlyPassed: results.length - failures.length,
    representativeOnlyFailed: failures.length,
    searchOnlyVisibilityChecks: browseSurfaces.length * searchOnlyModels.length + searchOnlyModels.length,
    searchOnlyVisibilityFailures: visibilityFailures.length,
  },
  visibilityFailures,
  failures,
}, null, 2));

if (countMismatch || failures.length || visibilityFailures.length) process.exitCode = 1;
