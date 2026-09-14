import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const livePath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const greymallPath = path.join(repoRoot, 'lib', 'generated-greymall-detail-images.ts');
const carestorePath = path.join(repoRoot, 'lib', 'generated-carestore-detail-images.ts');
const gagaonPath = path.join(repoRoot, 'lib', 'generated-gagaon-detail-images.ts');
const cafe24Path = path.join(repoRoot, 'lib', 'generated-cafe24-detail-images.ts');
const curatedPath = path.join(repoRoot, 'lib', 'product-detail-images.ts');

function extractJsonAfter(source, token, endToken) {
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`Token not found: ${token}`);
  const jsonStart = source.indexOf(token.includes('Product[]') ? '[' : '{', start + token.length);
  const searchEnd = endToken ? source.indexOf(endToken, jsonStart) : source.length;
  const stop = searchEnd >= 0 ? searchEnd : source.length;
  const closer = token.includes('Product[]') ? '];' : '};';
  const jsonEnd = source.lastIndexOf(closer, stop);
  if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error(`JSON payload not found: ${token}`);
  return JSON.parse(source.slice(jsonStart, jsonEnd + 1));
}

function extractGeneratedProducts(source) {
  return extractJsonAfter(
    source,
    'export const generatedLiveProducts: Product[] = ',
    '\nexport const generatedEroumExclusions',
  );
}

function extractRegistry(source, exportName) {
  const token = `export const ${exportName}`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`Registry not found: ${exportName}`);
  const jsonStart = source.indexOf('{', source.indexOf('=', start));
  const jsonEnd = source.lastIndexOf('};');
  return JSON.parse(source.slice(jsonStart, jsonEnd + 1));
}

function extractCuratedRegistry(source) {
  const start = source.indexOf('export const supplementalDetailImageSets');
  const end = source.indexOf('\n};', start);
  const block = start >= 0 && end > start ? source.slice(start, end) : '';
  const entries = {};
  const entryPattern = /^\s*'([^']+)':\s*\{([\s\S]*?)^\s*\},?$/gm;
  let match;
  while ((match = entryPattern.exec(block))) {
    const [, slug, body] = match;
    const sourceLabel = body.match(/sourceLabel:\s*'([^']*)'/)?.[1] ?? '수동 검증 상세페이지 이미지';
    const sourceUrl = body.match(/sourceUrl:\s*'([^']*)'/)?.[1] ?? '';
    const urlsBlock = body.match(/urls:\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    const urls = Array.from(urlsBlock.matchAll(/['"](https?:\/\/[^'"]+)['"]/g), (item) => item[1]);
    if (urls.length) entries[slug] = { sourceLabel, sourceUrl, urls };
  }
  return entries;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function selectDetailSet(product, sources) {
  const curated = sources.curated[product.slug] ?? null;
  const greymall = sources.greymall[product.model] ?? null;
  const carestore = sources.carestore[product.model] ?? null;
  const gagaon = sources.gagaon[product.model] ?? null;
  const cafe24 = sources.cafe24[product.model] ?? null;

  if (curated || greymall) {
    return {
      source: curated && greymall ? 'CURATED+GREYMALL' : curated ? 'CURATED' : 'GREYMALL',
      urls: unique([...(curated?.urls ?? []), ...(greymall?.urls ?? [])]),
    };
  }
  if (carestore) return { source: 'CARESTORE', urls: unique(carestore.urls ?? []) };
  if (gagaon) return { source: 'GAGAON', urls: unique(gagaon.urls ?? []) };
  if (cafe24) return { source: 'CAFE24', urls: unique(cafe24.urls ?? []) };
  return null;
}

async function probe(url) {
  const headers = {
    'user-agent': 'Mozilla/5.0 (compatible; WelfareEquipmentDetailAudit/1.0)',
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  };

  const request = async (method, extraHeaders = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(url, {
        method,
        headers: { ...headers, ...extraHeaders },
        redirect: 'follow',
        signal: controller.signal,
      });
      const result = {
        status: response.status,
        contentType: response.headers.get('content-type') ?? '',
        finalUrl: response.url,
      };
      if (response.body) await response.body.cancel().catch(() => {});
      return result;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let result = await request('HEAD');
    if ([400, 401, 403, 405, 406, 429].includes(result.status)) {
      result = await request('GET', { range: 'bytes=0-0' });
    }

    if (result.status === 404 || result.status === 410) return { state: 'BROKEN', ...result };
    if (result.status >= 200 && result.status < 400) {
      const type = result.contentType.toLowerCase();
      if (type.includes('text/html')) return { state: 'BROKEN_CONTENT', ...result };
      return { state: 'OK', ...result };
    }
    if ([401, 403, 429].includes(result.status)) return { state: 'RESTRICTED', ...result };
    if (result.status >= 500) return { state: 'UNSTABLE', ...result };
    return { state: 'OTHER', ...result };
  } catch (error) {
    return {
      state: 'UNREACHABLE',
      status: null,
      contentType: '',
      finalUrl: url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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

const [liveSource, greymallSource, carestoreSource, gagaonSource, cafe24Source, curatedSource] = await Promise.all([
  readFile(livePath, 'utf8'),
  readFile(greymallPath, 'utf8'),
  readFile(carestorePath, 'utf8'),
  readFile(gagaonPath, 'utf8'),
  readFile(cafe24Path, 'utf8'),
  readFile(curatedPath, 'utf8'),
]);

const products = extractGeneratedProducts(liveSource);
const sources = {
  greymall: extractRegistry(greymallSource, 'generatedGreymallDetailImageSetsByModel: Record<string, GeneratedGreymallDetailImageSet>'),
  carestore: extractRegistry(carestoreSource, 'generatedCarestoreDetailImageSetsByModel: Record<string, GeneratedCarestoreDetailImageSet>'),
  gagaon: extractRegistry(gagaonSource, 'generatedGagaonDetailImageSetsByModel: Record<string, GeneratedGagaonDetailImageSet>'),
  cafe24: extractRegistry(cafe24Source, 'generatedCafe24DetailImageSetsByModel: Record<string, GeneratedCafe24DetailImageSet>'),
  curated: extractCuratedRegistry(curatedSource),
};

const missing = [];
const invalidUrls = [];
const productRows = [];
const urlUsage = new Map();

for (const product of products) {
  const selected = selectDetailSet(product, sources);
  if (!selected?.urls?.length) {
    missing.push({ slug: product.slug, model: product.model, benefitCode: product.benefitCode });
    continue;
  }

  for (const url of selected.urls) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`unsupported protocol ${parsed.protocol}`);
    } catch (error) {
      invalidUrls.push({ slug: product.slug, model: product.model, url, error: String(error) });
      continue;
    }
    const owners = urlUsage.get(url) ?? [];
    owners.push({ slug: product.slug, model: product.model, benefitCode: product.benefitCode, source: selected.source });
    urlUsage.set(url, owners);
  }

  productRows.push({
    slug: product.slug,
    model: product.model,
    benefitCode: product.benefitCode,
    source: selected.source,
    imageCount: selected.urls.length,
  });
}

const uniqueUrls = Array.from(urlUsage.keys());
const duplicateAcrossProducts = Array.from(urlUsage.entries())
  .map(([url, owners]) => ({ url, owners, distinctModels: unique(owners.map((item) => item.model)) }))
  .filter((item) => item.distinctModels.length > 1);

const remoteResults = await mapLimit(uniqueUrls, 24, async (url) => ({ url, ...(await probe(url)) }));
const counts = remoteResults.reduce((acc, item) => {
  acc[item.state] = (acc[item.state] ?? 0) + 1;
  return acc;
}, {});
const broken = remoteResults.filter((item) => ['BROKEN', 'BROKEN_CONTENT'].includes(item.state));
const inconclusive = remoteResults.filter((item) => ['RESTRICTED', 'UNSTABLE', 'UNREACHABLE', 'OTHER'].includes(item.state));

const summary = {
  totalProducts: products.length,
  productsWithSelectedDetailImages: productRows.length,
  missingProducts: missing.length,
  invalidUrlCount: invalidUrls.length,
  uniqueSelectedImageUrls: uniqueUrls.length,
  remoteStateCounts: counts,
  brokenRemoteUrls: broken.length,
  inconclusiveRemoteUrls: inconclusive.length,
  crossProductDuplicateUrls: duplicateAcrossProducts.length,
};

console.log(JSON.stringify({
  summary,
  missing,
  invalidUrls,
  broken,
  inconclusive,
  duplicateAcrossProducts,
}, null, 2));

if (missing.length || invalidUrls.length) process.exitCode = 1;
if (process.env.REQUIRE_REMOTE_DETAIL === '1' && broken.length) process.exitCode = 1;
