import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const liveProductsPath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const greymallAuditPath = path.join(repoRoot, 'artifacts', 'greymall-detail-images-audit.json');
const supplementalPath = path.join(repoRoot, 'lib', 'product-detail-images.ts');
const outputPath = path.join(repoRoot, 'lib', 'generated-carestore-detail-images.ts');
const auditPath = path.join(repoRoot, 'artifacts', 'carestore-detail-images-audit.json');

const BASE_URL = 'https://www.carestore.co.kr';
const REQUEST_DELAY_MS = 140;
const EXCLUDED_WORDS = [
  'logo', 'icon', 'favicon', 'banner', 'spinner', 'loading', 'placeholder', 'review', 'profile',
  'kakao', 'naver', 'facebook', 'instagram', 'youtube', 'arrow', 'button', 'btn_', 'sprite',
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
    .replaceAll('\\u002F', '/')
    .replaceAll('\\u003A', ':')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
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

function extractCuratedSlugs(source) {
  const start = source.indexOf('export const supplementalDetailImageSets');
  const end = source.indexOf('\n};', start);
  const block = start >= 0 && end > start ? source.slice(start, end) : '';
  const slugs = new Set();
  const pattern = /^\s*'([^']+)':\s*\{/gm;
  let match;
  while ((match = pattern.exec(block))) slugs.add(match[1]);
  return slugs;
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
  if (response.ok) return response.text();
  if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
    await sleep(900 * attempt);
    return fetchText(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText}`);
}

function normalizeImageUrl(raw, sourceUrl) {
  if (!raw) return null;
  let decoded = decodeHtml(raw.trim()).replace(/^['"]|['"]$/g, '');
  if (!decoded || decoded.startsWith('data:') || decoded.startsWith('blob:')) return null;
  try {
    const absolute = new URL(decoded, sourceUrl);
    if (absolute.pathname === '/_next/image') {
      const nested = absolute.searchParams.get('url');
      if (nested) return new URL(decodeURIComponent(nested), sourceUrl).toString();
    }
    return absolute.toString();
  } catch {
    return null;
  }
}

function looksLikeImage(url) {
  const lower = url.toLowerCase();
  if (EXCLUDED_WORDS.some((word) => lower.includes(word))) return false;
  return /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(lower)
    || lower.includes('shopby-images.cdn-nhncommerce.com')
    || lower.includes('cdn.imweb.me')
    || lower.includes('cdn-optimized.imweb.me');
}

function extractUrls(text, sourceUrl) {
  const decoded = decodeHtml(text);
  const candidates = [];
  const attrPattern = /(?:src|data-src|data-original|data-lazy-src)\s*=\s*["']([^"']+)["']/gi;
  const absolutePattern = /https?:\/\/[^\s"'<>\\]+/gi;
  let match;
  while ((match = attrPattern.exec(decoded))) candidates.push(match[1]);
  while ((match = absolutePattern.exec(decoded))) candidates.push(match[0]);
  return candidates
    .map((candidate) => normalizeImageUrl(candidate, sourceUrl))
    .filter((url) => url && looksLikeImage(url));
}

function extractDetailImages(html, sourceUrl, product) {
  const decoded = decodeHtml(html);
  const urls = [];
  const seen = new Set();
  const push = (candidate) => {
    const url = normalizeImageUrl(candidate, sourceUrl);
    if (!url || !looksLikeImage(url) || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  // 1) Carestore SSR 결과에는 보통 alt="급여코드 상세 이미지 N" 형태가 노출됩니다.
  const imgPattern = /<img\b[^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgPattern.exec(decoded))) {
    const tag = imgMatch[0];
    const alt = tag.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    if (!/상세\s*이미지/i.test(alt)) continue;
    const src = tag.match(/(?:src|data-src|data-original|data-lazy-src)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (src) push(src);
  }

  // 2) Next/JSON 직렬화 데이터에서 "상세 이미지" 라벨 주변의 CDN URL을 수집합니다.
  const detailNeedles = ['상세 이미지', '상세이미지', 'detail image', 'detailImage', 'detailImages'];
  for (const needle of detailNeedles) {
    let from = 0;
    while (true) {
      const index = decoded.toLowerCase().indexOf(needle.toLowerCase(), from);
      if (index < 0) break;
      const segment = decoded.slice(Math.max(0, index - 1800), Math.min(decoded.length, index + 2600));
      for (const url of extractUrls(segment, sourceUrl)) push(url);
      from = index + needle.length;
    }
  }

  // 3) 급여코드가 파일명/경로에 포함된 이미지는 동일상품 페이지에서 강한 증거입니다.
  const allUrls = extractUrls(decoded, sourceUrl);
  const benefitToken = product.benefitCode.toLowerCase();
  const modelToken = normalizeCompact(product.model).toLowerCase();
  for (const url of allUrls) {
    const lower = decodeURIComponent(url).toLowerCase();
    if (lower.includes(benefitToken) || (modelToken.length >= 5 && normalizeCompact(lower).toLowerCase().includes(modelToken))) push(url);
  }

  return urls;
}

function pageMatchesProduct(html, product) {
  const decoded = decodeHtml(html);
  if (!decoded.includes(product.benefitCode)) return false;
  const model = normalizeCompact(product.model);
  const page = normalizeCompact(decoded);
  return model.length < 3 || page.includes(model);
}

async function inspectProduct(product) {
  const sourceUrl = `${BASE_URL}/welfare/${encodeURIComponent(product.benefitCode)}`;
  let html;
  try {
    html = await fetchText(sourceUrl);
  } catch (error) {
    return { status: 'FETCH_ERROR', sourceUrl, error: String(error) };
  }
  if (!pageMatchesProduct(html, product)) {
    return { status: 'PAGE_MISMATCH', sourceUrl };
  }
  const urls = extractDetailImages(html, sourceUrl, product);
  if (!urls.length) return { status: 'NO_DETAIL_IMAGES', sourceUrl };
  return { status: 'COMPLETE', sourceUrl, urls };
}

function buildGeneratedTs(entries, checkedAt) {
  const payload = Object.fromEntries(entries
    .filter((entry) => entry.result.status === 'COMPLETE')
    .map((entry) => [entry.model, {
      sourceLabel: '케어스토어 급여코드 동일상품 상세페이지 이미지',
      sourceUrl: entry.result.sourceUrl,
      urls: entry.result.urls,
      checkedAt,
    }]));
  return `// AUTO-GENERATED by scripts/sync-carestore-detail-images.mjs\n// Carestore is used only as an exact-benefit-code fallback source for long-form DETAIL images.\n// Product names, prices, benefit codes, hero images, and distribution data are not overwritten.\n\nexport type GeneratedCarestoreDetailImageSet = {\n  sourceLabel: string;\n  sourceUrl: string;\n  urls: string[];\n  checkedAt: string;\n};\n\nexport const CARESTORE_DETAIL_SYNC_CHECKED_AT = ${JSON.stringify(checkedAt)};\n\nexport const generatedCarestoreDetailImageSetsByModel: Record<string, GeneratedCarestoreDetailImageSet> = ${JSON.stringify(payload, null, 2)};\n`;
}

async function main() {
  const [liveSource, greymallAuditRaw, supplementalSource] = await Promise.all([
    readFile(liveProductsPath, 'utf8'),
    readFile(greymallAuditPath, 'utf8'),
    readFile(supplementalPath, 'utf8'),
  ]);
  const products = extractGeneratedProducts(liveSource);
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const greymallAudit = JSON.parse(greymallAuditRaw);
  const curatedSlugs = extractCuratedSlugs(supplementalSource);

  const candidates = greymallAudit.entries
    .filter((entry) => entry.result.status !== 'COMPLETE' && !curatedSlugs.has(entry.slug))
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
    source: BASE_URL,
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
