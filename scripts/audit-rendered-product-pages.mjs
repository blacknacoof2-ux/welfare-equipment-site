const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';
const expectedProductCount = Number(process.env.EXPECTED_PRODUCT_COUNT ?? 352);

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
    const hasDetailImage = html.includes(`id=\"detail-image-${slug}-1\"`) || html.includes(`id='detail-image-${slug}-1'`);
    const hasDetailHeading = html.includes('제품 상세 이미지');
    return {
      slug,
      status: response.status,
      hasDetailImage,
      hasDetailHeading,
      ok: response.status === 200 && hasDetailImage && hasDetailHeading,
    };
  } catch (error) {
    return {
      slug,
      status: null,
      hasDetailImage: false,
      hasDetailHeading: false,
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
    passed: results.length - failures.length,
    failed: failures.length,
  },
  failures,
}, null, 2));

if (countMismatch || failures.length) process.exitCode = 1;
