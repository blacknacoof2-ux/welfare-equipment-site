import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const liveProductsPath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const carestoreAuditPath = path.join(repoRoot, 'artifacts', 'carestore-detail-images-audit.json');
const outputPath = path.join(repoRoot, 'lib', 'generated-gagaon-detail-images.ts');
const auditPath = path.join(repoRoot, 'artifacts', 'gagaon-detail-images-audit.json');

const STORES = [
  'https://jmedi.gagaon.com',
  'https://kyg02073.gagaon.com',
  'https://mireajae.gagaon.com',
];
const REQUEST_DELAY_MS = 110;
const EXCLUDED_WORDS = [
  'logo', 'icon', 'banner', 'btn_', 'button', 'spinner', 'loading', 'close', 'arrow',
  'cart', 'wish', 'sns', 'kakao', 'naver', 'facebook', 'instagram', 'youtube', 'noimage',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('\\/', '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(value = '') {
  return decodeHtml(value)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(value = '') {
  return value
    .normalize('NFKC')
    .toUpperCase()
    .replaceAll('Ⅰ', '1')
    .replaceAll('Ⅱ', '2')
    .replaceAll('Ⅲ', '3')
    .replace(/[^0-9A-Z가-힣]/g, '');
}

function extractGeneratedProducts(source) {
  const startToken = 'export const generatedLiveProducts: Product[] = ';
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error('generatedLiveProducts start not found');
  const arrayStart = source.indexOf('[', start + startToken.length);
  const nextExport = source.indexOf('\nexport const generatedEroumExclusions', arrayStart);
  const searchEnd = nextExport >= 0 ? nextExport : source.length;
  const arrayEnd = source.lastIndexOf('];', searchEnd);
  if (arrayStart < 0 || arrayEnd < arrayStart) throw new Error('generatedLiveProducts array not found');
  return JSON.parse(source.slice(arrayStart, arrayEnd + 1));
}

async function fetchText(url, attempt = 1) {
  await sleep(REQUEST_DELAY_MS);
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; AtomCareCatalogVerifier/1.0; +https://github.com/blacknacoof2-ux/welfare-equipment-site)',
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.7',
      accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (response.ok) return { text: await response.text(), finalUrl: response.url };
  if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
    await sleep(650 * attempt);
    return fetchText(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText}`);
}

function normalizeImageUrl(raw, sourceUrl) {
  if (!raw) return null;
  const decoded = decodeHtml(raw.trim()).replace(/^['"]|['"]$/g, '');
  if (!decoded || decoded.startsWith('data:') || decoded.startsWith('blob:')) return null;
  try {
    return new URL(decoded, sourceUrl).toString();
  } catch {
    return null;
  }
}

function isDetailCandidate(url) {
  const lower = url.toLowerCase();
  if (EXCLUDED_WORDS.some((word) => lower.includes(word))) return false;
  if (!/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(lower)) return false;
  // Gagaon의 장문 상품설명 이미지는 공용 /data/editor/ 경로에 저장됩니다.
  return lower.includes('/data/editor/') || lower.includes('/editor/');
}

function extractDetailImages(html, sourceUrl, product) {
  const decoded = decodeHtml(html);
  const heroUrls = new Set(
    [...(product.imageUrls ?? []), ...(product.imageUrl ? [product.imageUrl] : [])]
      .map((url) => normalizeImageUrl(url, sourceUrl))
      .filter(Boolean),
  );
  const candidates = [];
  const seen = new Set();
  const push = (raw) => {
    const url = normalizeImageUrl(raw, sourceUrl);
    if (!url || !isDetailCandidate(url) || heroUrls.has(url) || seen.has(url)) return;
    seen.add(url);
    candidates.push(url);
  };

  // Long-form editor assets can live outside the visible Product Info DOM in serialized markup.
  const editorPattern = /(?:https?:)?\/\/[^\s"'<>]+\/data\/editor\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?|\/data\/editor\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  let match;
  while ((match = editorPattern.exec(decoded))) push(match[0]);

  // Also scan the product-information block for editor images referenced via img attributes.
  const anchors = ['Product Info', '상품 정보', '상품정보', 'Detailed & Delivery Info'];
  for (const anchor of anchors) {
    const index = decoded.indexOf(anchor);
    if (index < 0) continue;
    const segment = decoded.slice(index, Math.min(decoded.length, index + 80000));
    const attrPattern = /(?:src|data-src|data-original|data-lazy-src)\s*=\s*["']([^"']+)["']/gi;
    while ((match = attrPattern.exec(segment))) push(match[1]);
  }

  return candidates;
}

function pageMatchesProduct(html, product) {
  const decoded = decodeHtml(html);
  if (!decoded.includes(product.benefitCode)) return false;
  const pageText = normalizeCompact(stripTags(decoded));
  const model = normalizeCompact(product.model);
  return model.length < 3 || pageText.includes(model);
}

async function inspectProduct(product) {
  const attempts = [];
  for (const store of STORES) {
    const sourceUrl = `${store}/indi/item.php?it_id=${encodeURIComponent(product.benefitCode)}`;
    try {
      const fetched = await fetchText(sourceUrl);
      if (!pageMatchesProduct(fetched.text, product)) {
        attempts.push({ sourceUrl, status: 'PAGE_MISMATCH' });
        continue;
      }
      const urls = extractDetailImages(fetched.text, fetched.finalUrl || sourceUrl, product);
      if (urls.length) {
        return { status: 'COMPLETE', sourceUrl: fetched.finalUrl || sourceUrl, urls };
      }
      attempts.push({ sourceUrl: fetched.finalUrl || sourceUrl, status: 'NO_DETAIL_IMAGES' });
    } catch (error) {
      attempts.push({ sourceUrl, status: 'FETCH_ERROR', error: String(error) });
    }
  }
  const statuses = attempts.map((attempt) => attempt.status);
  if (statuses.includes('NO_DETAIL_IMAGES')) return { status: 'NO_DETAIL_IMAGES', attempts };
  if (statuses.includes('PAGE_MISMATCH')) return { status: 'PAGE_MISMATCH', attempts };
  return { status: 'FETCH_ERROR', attempts };
}

function buildGeneratedTs(entries, checkedAt) {
  const payload = Object.fromEntries(entries
    .filter((entry) => entry.result.status === 'COMPLETE')
    .map((entry) => [entry.model, {
      sourceLabel: '가가온 급여코드 동일상품 상세페이지 이미지',
      sourceUrl: entry.result.sourceUrl,
      urls: entry.result.urls,
      checkedAt,
    }]));
  return `// AUTO-GENERATED by scripts/sync-gagaon-detail-images.mjs\n// Gagaon storefronts are used only as exact-benefit-code fallback sources for long-form DETAIL images.\n\nexport type GeneratedGagaonDetailImageSet = {\n  sourceLabel: string;\n  sourceUrl: string;\n  urls: string[];\n  checkedAt: string;\n};\n\nexport const GAGAON_DETAIL_SYNC_CHECKED_AT = ${JSON.stringify(checkedAt)};\nexport const generatedGagaonDetailImageSetsByModel: Record<string, GeneratedGagaonDetailImageSet> = ${JSON.stringify(payload, null, 2)};\n`;
}

async function main() {
  const [liveSource, carestoreAuditRaw] = await Promise.all([
    readFile(liveProductsPath, 'utf8'),
    readFile(carestoreAuditPath, 'utf8'),
  ]);
  const products = extractGeneratedProducts(liveSource);
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const carestoreAudit = JSON.parse(carestoreAuditRaw);
  const candidates = carestoreAudit.entries
    .filter((entry) => entry.result.status !== 'COMPLETE')
    .map((entry) => productBySlug.get(entry.slug))
    .filter(Boolean);

  const entries = [];
  for (let index = 0; index < candidates.length; index += 1) {
    const product = candidates[index];
    const result = await inspectProduct(product);
    entries.push({
      index: index + 1,
      slug: product.slug,
      name: product.name,
      model: product.model,
      benefitCode: product.benefitCode,
      category: product.category,
      result,
    });
    console.log(`[${index + 1}/${candidates.length}] ${product.model}: ${result.status}${result.urls ? ` (${result.urls.length})` : ''}`);
  }

  const checkedAt = new Date().toISOString().slice(0, 10);
  const counts = entries.reduce((acc, entry) => {
    acc[entry.result.status] = (acc[entry.result.status] ?? 0) + 1;
    return acc;
  }, {});
  const detailImageCount = entries.reduce((sum, entry) => sum + (entry.result.urls?.length ?? 0), 0);
  await mkdir(path.dirname(auditPath), { recursive: true });
  await writeFile(outputPath, buildGeneratedTs(entries, checkedAt), 'utf8');
  await writeFile(auditPath, `${JSON.stringify({
    checkedAt,
    source: 'https://*.gagaon.com',
    candidateCount: candidates.length,
    detailImageCount,
    counts,
    entries,
  }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ checkedAt, candidateCount: candidates.length, detailImageCount, counts }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
