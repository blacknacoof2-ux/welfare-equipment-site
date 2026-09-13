import fs from 'node:fs/promises';
import path from 'node:path';
import { officialSeedProducts } from './official-seed-products.mjs';

const BASE = 'https://www.carestore.co.kr';
const START = `${BASE}/welfare`;
const OUT = path.resolve('artifacts/carestore-catalog.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0; +https://github.com/blacknacoof2-ux/welfare-equipment-site)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(value = '') {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function htmlToLines(html) {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<\s*(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h[1-6])\b[^>]*>/gi, '\n');
  const text = decodeEntities(withoutNoise.replace(/<[^>]+>/g, ' '));
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function findValue(lines, labels) {
  for (let i = 0; i < lines.length; i += 1) {
    for (const label of labels) {
      const line = lines[i];
      if (line === label && lines[i + 1]) return lines[i + 1].trim();
      if (line.startsWith(`${label} `)) return line.slice(label.length).trim();
      if (line.startsWith(`${label}:`)) return line.slice(label.length + 1).trim();
    }
  }
  return '';
}

function parseMoney(value = '') {
  const m = value.replace(/,/g, '').match(/(\d[\d.]*)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function extractH1(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? stripTags(m[1]) : '';
}

async function fetchText(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.5',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    if (attempt < 4 && [429, 500, 502, 503, 504].includes(response.status)) {
      await sleep(750 * attempt);
      return fetchText(url, attempt + 1);
    }
    throw new Error(`HTTP ${response.status} ${url}`);
  }
  return response.text();
}

function discoverCategoryUrls(html) {
  const set = new Set();
  for (const match of html.matchAll(/href=["']([^"']*\/welfare\?item=\d+[^"']*)["']/gi)) {
    const href = decodeEntities(match[1]);
    set.add(new URL(href, BASE).toString());
  }
  return [...set];
}

function discoverProductUrls(html) {
  const set = new Set();
  for (const match of html.matchAll(/href=["']([^"']*\/welfare\/([A-Za-z0-9_-]{8,}))[^"']*["']/gi)) {
    const href = decodeEntities(match[1]).split('#')[0];
    const code = match[2];
    if (!/[A-Za-z]/.test(code) || !/\d/.test(code)) continue;
    set.add(new URL(href, BASE).toString());
  }
  return [...set];
}

function normalizeCategory(rawCategory, mode, name) {
  const category = rawCategory.replace(/\s+/g, ' ').trim();
  if (category === '경사로') return mode === 'RENTAL' ? '경사로(실외용)' : '경사로(실내용)';
  if (category.includes('배회감지기') && /태그/i.test(`${category} ${name}`)) return '배회감지기(태그형)';
  if (category === '구강세척기') return '구강세척기(마우스피스형)';
  return category;
}

function parseProduct(url, html) {
  const lines = htmlToLines(html);
  const title = extractH1(html) || findValue(lines, ['제품명']);
  const rawCategory = findValue(lines, ['품목명']);
  const modeText = findValue(lines, ['구입·대여', '구분']);
  const purchasePriceText = findValue(lines, ['구입금액', '구입가격']);
  const rentalPriceText = findValue(lines, ['대여금액', '월 대여금액']);
  const code = findValue(lines, ['제품코드', '급여코드']) || url.split('/').pop();
  const supplier = findValue(lines, ['공급업체', '제조사', '제조업체']);
  const distribution = findValue(lines, ['유통여부']);
  const origin = findValue(lines, ['원산지']);
  const durability = findValue(lines, ['내구연한']);
  const limit = findValue(lines, ['급여한도']);
  const updated = (html.match(/(?:UPDATED|UPDATE)\s*:?\s*(\d{4}[.-]\d{2}[.-]\d{2})/i)?.[1] ?? '')
    .replaceAll('.', '-');

  const hasPurchase = /구입/.test(modeText) || Boolean(purchasePriceText);
  const hasRental = /대여/.test(modeText) || Boolean(rentalPriceText);
  const benefitMode = hasPurchase && hasRental ? 'PURCHASE_OR_RENTAL' : hasRental ? 'RENTAL' : 'PURCHASE';
  const benefitPrice = benefitMode === 'RENTAL' ? parseMoney(rentalPriceText) : parseMoney(purchasePriceText);
  const rentalMonthlyPrice = hasRental ? parseMoney(rentalPriceText) : null;
  const category = normalizeCategory(rawCategory, benefitMode, title);

  const lowerDistribution = distribution.toLowerCase();
  let carestoreStatus = 'UNKNOWN';
  if (lowerDistribution.includes('유통중단') || lowerDistribution.includes('중단')) carestoreStatus = 'NOT_DISTRIBUTED';
  else if (lowerDistribution.includes('유통중')) carestoreStatus = 'DISTRIBUTED';

  return {
    name: title,
    model: title,
    manufacturer: supplier,
    benefitCode: code,
    category,
    benefitPrice,
    benefitMode,
    rentalMonthlyPrice: benefitMode === 'PURCHASE_OR_RENTAL' ? rentalMonthlyPrice : benefitMode === 'RENTAL' ? null : null,
    carestoreStatus,
    carestoreDistributionText: distribution,
    carestoreUrl: url,
    carestoreUpdatedAt: updated || null,
    origin: origin || null,
    durability: durability || null,
    benefitLimit: limit || null,
    sourceType: 'CARESTORE_DISCOVERED',
  };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let index = 0;
  async function run() {
    while (true) {
      const i = index;
      index += 1;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (error) {
        results[i] = { error: String(error?.message ?? error), url: items[i] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const mainHtml = await fetchText(START);
const linkedCategoryUrls = discoverCategoryUrls(mainHtml);
// Carestore's navigation currently exposes the classic categories, while newer or
// less-used benefit types can exist on sequential item pages without being linked.
// Probe a bounded range so oral washers, diaper sensors and future adjacent categories
// are not silently omitted. Categories that Carestore does not expose at all are added
// through officialSeedProducts and still must pass Eroum exact-code verification.
const probedCategoryUrls = Array.from({ length: 30 }, (_, index) => `${START}?item=${101 + index}`);
const categoryUrls = [...new Set([...linkedCategoryUrls, ...probedCategoryUrls])];
if (linkedCategoryUrls.length === 0) throw new Error('No Carestore welfare category URLs discovered.');
console.log(`[catalog-sync] linkedCategories=${linkedCategoryUrls.length} probedCategoryPages=${categoryUrls.length}`);

const categoryPages = await mapLimit(categoryUrls, 8, async (url) => ({ url, html: await fetchText(url) }));
const productUrlSet = new Set();
const productiveCategoryUrls = [];
for (const page of categoryPages) {
  if (!page?.html) continue;
  const found = discoverProductUrls(page.html);
  if (found.length > 0) productiveCategoryUrls.push(page.url);
  for (const url of found) productUrlSet.add(url);
}
const productUrls = [...productUrlSet].sort();
if (productUrls.length < 100) throw new Error(`Too few Carestore product URLs discovered: ${productUrls.length}`);
console.log(`[catalog-sync] productiveCategoryPages=${productiveCategoryUrls.length} productLinks=${productUrls.length}`);

let completed = 0;
const parsed = await mapLimit(productUrls, 10, async (url) => {
  const html = await fetchText(url);
  const product = parseProduct(url, html);
  completed += 1;
  if (completed % 50 === 0 || completed === productUrls.length) {
    console.log(`[catalog-sync] fetched=${completed}/${productUrls.length}`);
  }
  await sleep(35);
  return product;
});

const errors = parsed.filter((item) => item?.error);
const discoveredProducts = parsed.filter(
  (item) => item && !item.error && item.benefitCode && item.name && item.category,
);
// Prefer a live Carestore record when the same benefit code is also present in the
// official seed list. Seeds only fill categories/rows the Carestore navigation misses.
const products = [...discoveredProducts, ...officialSeedProducts]
  .filter((item, index, all) => all.findIndex((x) => x.benefitCode === item.benefitCode) === index)
  .sort((a, b) => `${a.category}:${a.name}`.localeCompare(`${b.category}:${b.name}`, 'ko'));

const byCategory = {};
const byStatus = {};
const bySourceType = {};
for (const product of products) {
  byCategory[product.category] = (byCategory[product.category] ?? 0) + 1;
  byStatus[product.carestoreStatus] = (byStatus[product.carestoreStatus] ?? 0) + 1;
  const sourceType = product.sourceType || 'UNKNOWN';
  bySourceType[sourceType] = (bySourceType[sourceType] ?? 0) + 1;
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: START,
  linkedCategoryUrls,
  productiveCategoryUrls,
  totals: {
    discoveredProductLinks: productUrls.length,
    discoveredProducts: discoveredProducts.length,
    officialSeedProducts: officialSeedProducts.length,
    catalogRecords: products.length,
    errors: errors.length,
    byCategory,
    byStatus,
    bySourceType,
  },
  errors,
  products,
};

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log('[catalog-sync] summary');
console.log(JSON.stringify(snapshot.totals, null, 2));
console.log(`[catalog-sync] wrote ${OUT}`);
