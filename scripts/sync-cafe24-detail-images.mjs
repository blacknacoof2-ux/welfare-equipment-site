import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const liveProductsPath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const gagaonAuditPath = path.join(repoRoot, 'artifacts', 'gagaon-detail-images-audit.json');
const outputPath = path.join(repoRoot, 'lib', 'generated-cafe24-detail-images.ts');
const auditPath = path.join(repoRoot, 'artifacts', 'cafe24-detail-images-audit.json');

const STORES = [
  'https://noble-one.com',
  'https://m.singymall.kr',
  'https://m.swmedi.co.kr',
  'https://m.k-medi.co.kr',
  'https://maumieum.co.kr',
  'https://nulchan.co.kr',
  'https://m.solpluscare.com',
];
const REQUEST_DELAY_MS = 130;
const EXCLUDED_WORDS = [
  'logo', 'icon', 'banner', 'btn_', 'button', 'spinner', 'loading', 'arrow', 'review',
  'grade', 'star', 'sns', 'kakao', 'naver', 'facebook', 'instagram', 'youtube', 'noimage',
  'user_guide', 'user-guide', 'common_guide', 'common-guide', 'shopping_guide', 'shopping-guide',
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
  const token = 'export const generatedLiveProducts: Product[] = ';
  const start = source.indexOf(token);
  const arrayStart = source.indexOf('[', start + token.length);
  const nextExport = source.indexOf('\nexport const generatedEroumExclusions', arrayStart);
  const end = source.lastIndexOf('];', nextExport >= 0 ? nextExport : source.length);
  if (start < 0 || arrayStart < 0 || end < arrayStart) throw new Error('generatedLiveProducts not found');
  return JSON.parse(source.slice(arrayStart, end + 1));
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
  if (response.ok) return { html: await response.text(), finalUrl: response.url };
  if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
    await sleep(800 * attempt);
    return fetchText(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText}`);
}

function normalizeImageUrl(raw, sourceUrl) {
  if (!raw) return null;
  const decoded = decodeHtml(raw.trim()).replace(/^['"]|['"]$/g, '');
  if (!decoded || decoded.startsWith('data:') || decoded.startsWith('blob:')) return null;
  try { return new URL(decoded, sourceUrl).toString(); } catch { return null; }
}

function isDetailImage(url, product) {
  const lower = url.toLowerCase();
  if (EXCLUDED_WORDS.some((word) => lower.includes(word))) return false;
  if (!/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(lower)) return false;

  const code = String(product.benefitCode ?? '').toLowerCase();
  const nobleProductDetail = lower.includes('gi.esmplus.com/noble3450/welfare_medical_device/detail_images/')
    && code
    && lower.includes(code);
  if (nobleProductDetail) return true;

  return lower.includes('/web/upload/nneditor/')
    || lower.includes('/web/product/extra/')
    || lower.includes('/web/upload/ckeditor/')
    || lower.includes('/editor/')
    || lower.includes('/detail/');
}

function extractProductLinks(html, baseUrl) {
  const decoded = decodeHtml(html);
  const links = [];
  const seen = new Set();
  const pattern = /href=["']([^"']*\/product\/[^"']+\/\d+\/?[^"']*)["']/gi;
  let match;
  while ((match = pattern.exec(decoded))) {
    try {
      const url = new URL(match[1], baseUrl).toString();
      if (!seen.has(url)) { seen.add(url); links.push(url); }
    } catch {}
  }
  return links;
}

function pageMatchesProduct(html, product) {
  const decoded = decodeHtml(html);
  if (!decoded.includes(product.benefitCode)) return false;
  const model = normalizeCompact(product.model);
  const page = normalizeCompact(stripTags(decoded));
  return model.length < 3 || page.includes(model);
}

function extractDetailImages(html, sourceUrl, product) {
  const decoded = decodeHtml(html);
  const hero = new Set([...(product.imageUrls ?? []), ...(product.imageUrl ? [product.imageUrl] : [])]);
  const urls = [];
  const seen = new Set();
  const push = (raw) => {
    const url = normalizeImageUrl(raw, sourceUrl);
    if (!url || !isDetailImage(url, product) || hero.has(url) || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  const attrPattern = /(?:src|data-src|data-original|data-lazy-src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = attrPattern.exec(decoded))) push(match[1]);

  const absolutePattern = /https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  while ((match = absolutePattern.exec(decoded))) push(match[0]);

  return urls;
}

async function inspectProduct(product) {
  const attempts = [];
  for (const store of STORES) {
    const queries = [product.benefitCode, product.model];
    const links = [];
    const seen = new Set();

    for (const query of queries) {
      const searchUrl = `${store}/product/search.html?keyword=${encodeURIComponent(query)}`;
      try {
        const { html } = await fetchText(searchUrl);
        for (const link of extractProductLinks(html, store)) {
          if (!seen.has(link)) { seen.add(link); links.push(link); }
        }
      } catch (error) {
        attempts.push({ store, searchUrl, status: 'SEARCH_FETCH_ERROR', error: String(error) });
      }
    }

    for (const sourceUrl of links.slice(0, 12)) {
      try {
        const fetched = await fetchText(sourceUrl);
        if (!pageMatchesProduct(fetched.html, product)) continue;
        const urls = extractDetailImages(fetched.html, fetched.finalUrl || sourceUrl, product);
        if (urls.length) return { status: 'COMPLETE', sourceUrl: fetched.finalUrl || sourceUrl, urls };
        attempts.push({ store, sourceUrl: fetched.finalUrl || sourceUrl, status: 'NO_DETAIL_IMAGES' });
      } catch (error) {
        attempts.push({ store, sourceUrl, status: 'DETAIL_FETCH_ERROR', error: String(error) });
      }
    }
  }

  if (attempts.some((a) => a.status === 'NO_DETAIL_IMAGES')) return { status: 'NO_DETAIL_IMAGES', attempts };
  return { status: 'NO_EXACT_MATCH', attempts };
}

function buildGeneratedTs(entries, checkedAt) {
  const payload = Object.fromEntries(entries
    .filter((entry) => entry.result.status === 'COMPLETE')
    .map((entry) => [entry.model, {
      sourceLabel: '복지용구 전문몰 급여코드·동일모델 상세페이지 이미지',
      sourceUrl: entry.result.sourceUrl,
      urls: entry.result.urls,
      checkedAt,
    }]));
  return `// AUTO-GENERATED by scripts/sync-cafe24-detail-images.mjs\n// Exact benefit code + exact model are both required before using fallback DETAIL images.\n\nexport type GeneratedCafe24DetailImageSet = {\n  sourceLabel: string;\n  sourceUrl: string;\n  urls: string[];\n  checkedAt: string;\n};\n\nexport const CAFE24_DETAIL_SYNC_CHECKED_AT = ${JSON.stringify(checkedAt)};\nexport const generatedCafe24DetailImageSetsByModel: Record<string, GeneratedCafe24DetailImageSet> = ${JSON.stringify(payload, null, 2)};\n`;
}

async function main() {
  const [liveRaw, gagaonRaw] = await Promise.all([
    readFile(liveProductsPath, 'utf8'),
    readFile(gagaonAuditPath, 'utf8'),
  ]);
  const products = extractGeneratedProducts(liveRaw);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const gagaonAudit = JSON.parse(gagaonRaw);
  const candidates = gagaonAudit.entries
    .filter((entry) => entry.result.status !== 'COMPLETE')
    .map((entry) => bySlug.get(entry.slug))
    .filter(Boolean);

  const entries = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const product = candidates[i];
    const result = await inspectProduct(product);
    entries.push({
      index: i + 1,
      slug: product.slug,
      name: product.name,
      model: product.model,
      benefitCode: product.benefitCode,
      category: product.category,
      result,
    });
    console.log(`[${i + 1}/${candidates.length}] ${product.model}: ${result.status}${result.urls ? ` (${result.urls.length})` : ''}`);
  }

  const checkedAt = new Date().toISOString().slice(0, 10);
  const counts = entries.reduce((acc, entry) => {
    acc[entry.result.status] = (acc[entry.result.status] ?? 0) + 1;
    return acc;
  }, {});
  const detailImageCount = entries.reduce((sum, entry) => sum + (entry.result.urls?.length ?? 0), 0);
  await mkdir(path.dirname(auditPath), { recursive: true });
  await writeFile(outputPath, buildGeneratedTs(entries, checkedAt), 'utf8');
  await writeFile(auditPath, `${JSON.stringify({ checkedAt, stores: STORES, candidateCount: candidates.length, detailImageCount, counts, entries }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ checkedAt, candidateCount: candidates.length, detailImageCount, counts }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
