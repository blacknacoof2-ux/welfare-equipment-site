import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const liveProductsPath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const outputPath = path.join(repoRoot, 'lib', 'generated-greymall-detail-images.ts');
const auditPath = path.join(repoRoot, 'artifacts', 'greymall-detail-images-audit.json');

const BASE_URL = 'https://www.greymall.co.kr';
const LIST_URL = `${BASE_URL}/goods/goods_search.php`;
const REQUEST_DELAY_MS = 180;
const MAX_LIST_PAGES = 90;
const UNAVAILABLE_KEYWORDS = ['일시품절', '품절', '단종', '판매중지', '판매 중지', '판매종료', '판매 종료'];
const DETAIL_IMAGE_PATHS = ['/data/editor/goods/', 'cdn.shopimg.greyscale.co.kr/uploads/'];
const EXCLUDED_IMAGE_WORDS = [
  'thumbnail', 'thumb_', '/thumb/', 'logo', 'icon', 'banner', 'review', 'common',
  'btn_', 'button', 'loading', 'spinner', 'pixel', 'recent', 'cart', 'wish', 'sns',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
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
  return value.normalize('NFKC').toUpperCase().replace(/[^0-9A-Z가-힣]/g, '');
}

function normalizeReadable(value = '') {
  return value.normalize('NFKC').toUpperCase().replace(/\s+/g, ' ').trim();
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  if (response.ok) return response.text();
  if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
    await sleep(1000 * attempt);
    return fetchText(url, attempt + 1);
  }
  throw new Error(`${response.status} ${response.statusText} for ${url}`);
}

function canonicalGoodsUrl(raw) {
  try {
    const absolute = new URL(decodeHtml(raw), BASE_URL).toString();
    const match = absolute.match(/goodsNo=(\d+)/);
    return match ? `${BASE_URL}/goods/goods_view.php?goodsNo=${match[1]}` : null;
  } catch {
    return null;
  }
}

function extractListingCards(html) {
  const cards = new Map();
  const anchorPattern = /<a\b[^>]*href=["']([^"']*goods_view\.php\?goodsNo=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const url = canonicalGoodsUrl(match[1]);
    if (!url) continue;
    const title = stripTags(match[2]);
    if (!title || title.length > 180) continue;
    if (/^(찜하기|장바구니|상세보기|상품보기)$/i.test(title)) continue;
    const existing = cards.get(url);
    if (!existing || title.length > existing.length) cards.set(url, title);
  }
  return cards;
}

async function crawlListingIndex() {
  const all = new Map();
  let emptyNewPages = 0;
  for (let page = 1; page <= MAX_LIST_PAGES; page += 1) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
    const html = await fetchText(url);
    const cards = extractListingCards(html);
    let added = 0;
    for (const [goodsUrl, title] of cards) {
      if (!all.has(goodsUrl)) {
        all.set(goodsUrl, title);
        added += 1;
      } else if (title.length > all.get(goodsUrl).length) {
        all.set(goodsUrl, title);
      }
    }
    console.log(`[LIST ${page}] cards=${cards.size} new=${added} total=${all.size}`);
    if (added === 0) emptyNewPages += 1;
    else emptyNewPages = 0;
    if (page >= 3 && emptyNewPages >= 2) break;
  }
  return all;
}

function shortModelBoundaryMatch(model, title) {
  const readableModel = normalizeReadable(model);
  const readableTitle = normalizeReadable(title);
  const escaped = escapeRegex(readableModel);
  return new RegExp(`(^|[^0-9A-Z가-힣])${escaped}([^0-9A-Z가-힣]|$)`, 'i').test(readableTitle);
}

function modelMatchesTitle(product, title) {
  const model = String(product.model ?? '').trim();
  const compactModel = normalizeCompact(model);
  const compactTitle = normalizeCompact(title);
  if (!compactModel || !compactTitle) return false;
  if (compactModel.length >= 4) return compactTitle.includes(compactModel);
  return shortModelBoundaryMatch(model, title);
}

function scoreListingMatch(product, title) {
  const model = normalizeCompact(product.model);
  const name = normalizeCompact(product.name);
  const candidate = normalizeCompact(title);
  let score = 0;
  if (candidate === model) score += 100;
  if (name && candidate === name) score += 100;
  if (candidate.startsWith(model)) score += 50;
  if (name.length >= 4 && candidate.includes(name)) score += 30;
  if (candidate.includes(model)) score += 20;
  return score;
}

function chooseListingMatch(product, listingIndex) {
  const matches = [];
  for (const [url, title] of listingIndex) {
    if (modelMatchesTitle(product, title)) matches.push({ url, title, score: scoreListingMatch(product, title) });
  }
  if (matches.length === 0) return { status: 'NO_GREYMALL_MATCH' };
  matches.sort((a, b) => b.score - a.score || a.title.length - b.title.length);
  if (matches.length > 1 && matches[0].score === matches[1].score && normalizeCompact(matches[0].title) !== normalizeCompact(matches[1].title)) {
    return { status: 'AMBIGUOUS_MATCH', candidates: matches.slice(0, 5) };
  }
  return { status: 'MATCH', match: matches[0] };
}

function extractPageTitle(html) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i);
  if (og?.[1]) return stripTags(og[1]);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return title?.[1] ? stripTags(title[1]) : '';
}

function getTopProductText(html) {
  const markers = ['상품상세정보', '상품 상세 정보', 'goods_detail_cont'];
  let end = -1;
  for (const marker of markers) {
    const index = html.indexOf(marker);
    if (index >= 0 && (end < 0 || index < end)) end = index;
  }
  return stripTags(end >= 0 ? html.slice(0, end) : html.slice(0, 70000));
}

function getUnavailableReason(html, pageTitle) {
  const topHtml = html.slice(0, Math.min(html.length, 120000));
  const topText = `${pageTitle} ${getTopProductText(topHtml)}`;
  for (const keyword of UNAVAILABLE_KEYWORDS) if (topText.includes(keyword)) return keyword;
  if (/sold[\s_-]*out/i.test(topHtml) || /class=["'][^"']*soldout/i.test(topHtml)) return 'soldout';
  return null;
}

function getDetailSegment(html) {
  const starts = [html.indexOf('상품상세정보'), html.indexOf('상품 상세 정보'), html.indexOf('goods_detail_cont')].filter((value) => value >= 0);
  if (starts.length === 0) return html;
  const start = Math.min(...starts);
  const ends = [
    html.indexOf('상품필수 정보', start + 1),
    html.indexOf('상품정보제공고시', start + 1),
    html.indexOf('상품후기', start + 1),
    html.indexOf('goods_review', start + 1),
  ].filter((value) => value > start);
  const end = ends.length > 0 ? Math.min(...ends) : Math.min(html.length, start + 500000);
  return html.slice(start, end);
}

function normalizeImageUrl(raw) {
  if (!raw) return null;
  const decoded = decodeHtml(raw.trim()).replace(/^['"]|['"]$/g, '');
  if (!decoded || decoded.startsWith('data:')) return null;
  try { return new URL(decoded, BASE_URL).toString(); } catch { return null; }
}

function isDetailImageUrl(url) {
  const lower = url.toLowerCase();
  if (!DETAIL_IMAGE_PATHS.some((needle) => lower.includes(needle.toLowerCase()))) return false;
  if (EXCLUDED_IMAGE_WORDS.some((word) => lower.includes(word))) return false;
  return /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(lower);
}

function extractDetailImages(html) {
  const segment = getDetailSegment(html);
  const candidates = [];
  const attributePattern = /(?:src|data-src|data-original|data-lazy-src)\s*=\s*["']([^"']+)["']/gi;
  const cssPattern = /url\((['"]?)([^)'"\s]+)\1\)/gi;
  const absolutePattern = /https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  let match;
  while ((match = attributePattern.exec(segment))) candidates.push(match[1]);
  while ((match = cssPattern.exec(segment))) candidates.push(match[2]);
  while ((match = absolutePattern.exec(segment))) candidates.push(match[0]);

  const editorPattern = /(?:https?:)?\/\/[^\s"'<>]+\/data\/editor\/goods\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif)(?:\?[^\s"'<>]*)?/gi;
  while ((match = editorPattern.exec(html))) candidates.push(match[0]);

  const urls = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const url = normalizeImageUrl(candidate);
    if (!url || !isDetailImageUrl(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

async function inspectProduct(product, listingIndex, pageCache) {
  const listing = chooseListingMatch(product, listingIndex);
  if (listing.status !== 'MATCH') return listing;
  const { url, title: listingTitle } = listing.match;
  let html = pageCache.get(url);
  if (!html) {
    try {
      html = await fetchText(url);
      pageCache.set(url, html);
    } catch (error) {
      return { status: 'DETAIL_FETCH_ERROR', sourceUrl: url, error: String(error) };
    }
  }
  const pageTitle = extractPageTitle(html);
  if (!modelMatchesTitle(product, pageTitle)) {
    return { status: 'MODEL_MISMATCH', sourceUrl: url, listingTitle, pageTitle };
  }
  const unavailableReason = getUnavailableReason(html, pageTitle);
  if (unavailableReason) {
    return { status: 'EXCLUDED_UNAVAILABLE', sourceUrl: url, listingTitle, pageTitle, reason: unavailableReason };
  }
  const urls = extractDetailImages(html);
  if (urls.length === 0) {
    return { status: 'NO_DETAIL_IMAGES', sourceUrl: url, listingTitle, pageTitle };
  }
  return { status: 'COMPLETE', sourceUrl: url, listingTitle, pageTitle, urls };
}

function buildGeneratedTs(entries, checkedAt) {
  const payload = Object.fromEntries(entries
    .filter((entry) => entry.result.status === 'COMPLETE')
    .map((entry) => [entry.model, {
      sourceLabel: '그레이몰 동일모델 상세페이지 이미지',
      sourceUrl: entry.result.sourceUrl,
      urls: entry.result.urls,
      checkedAt,
    }]));
  return `// AUTO-GENERATED by scripts/sync-greymall-detail-images.mjs\n// Greymall is used only as a source of exact-model long-form DETAIL images.\n// Product names, prices, benefit codes, hero images, and distribution data are not overwritten.\n\nexport type GeneratedGreymallDetailImageSet = {\n  sourceLabel: string;\n  sourceUrl: string;\n  urls: string[];\n  checkedAt: string;\n};\n\nexport const GREYMALL_DETAIL_SYNC_CHECKED_AT = ${JSON.stringify(checkedAt)};\n\nexport const generatedGreymallDetailImageSetsByModel: Record<string, GeneratedGreymallDetailImageSet> = ${JSON.stringify(payload, null, 2)};\n`;
}

async function main() {
  const liveProductsSource = await readFile(liveProductsPath, 'utf8');
  const products = extractGeneratedProducts(liveProductsSource);
  const uniqueProducts = [];
  const seenModels = new Set();
  for (const product of products) {
    const model = String(product.model ?? '').trim();
    if (!model || seenModels.has(model)) continue;
    seenModels.add(model);
    uniqueProducts.push(product);
  }

  const listingIndex = await crawlListingIndex();
  const pageCache = new Map();
  const entries = [];
  for (let index = 0; index < uniqueProducts.length; index += 1) {
    const product = uniqueProducts[index];
    const result = await inspectProduct(product, listingIndex, pageCache);
    entries.push({
      index: index + 1,
      slug: product.slug,
      name: product.name,
      model: product.model,
      benefitCode: product.benefitCode,
      category: product.category,
      result,
    });
    console.log(`[${index + 1}/${uniqueProducts.length}] ${product.model}: ${result.status}`);
  }

  const checkedAt = new Date().toISOString().slice(0, 10);
  const counts = entries.reduce((acc, entry) => {
    acc[entry.result.status] = (acc[entry.result.status] ?? 0) + 1;
    return acc;
  }, {});
  const detailImageCount = entries.reduce((sum, entry) => sum + (entry.result.status === 'COMPLETE' ? entry.result.urls.length : 0), 0);

  await mkdir(path.dirname(auditPath), { recursive: true });
  await writeFile(outputPath, buildGeneratedTs(entries, checkedAt), 'utf8');
  await writeFile(auditPath, `${JSON.stringify({
    checkedAt,
    source: BASE_URL,
    greymallIndexedProducts: listingIndex.size,
    totalUniqueModels: uniqueProducts.length,
    detailImageCount,
    counts,
    entries,
  }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ checkedAt, greymallIndexedProducts: listingIndex.size, totalUniqueModels: uniqueProducts.length, detailImageCount, counts }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
