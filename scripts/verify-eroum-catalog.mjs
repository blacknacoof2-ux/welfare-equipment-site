import fs from 'node:fs/promises';
import path from 'node:path';

const INPUT = path.resolve(process.argv[2] || 'artifacts/carestore-catalog.json');
const OUTPUT = path.resolve(process.argv[3] || 'artifacts/eroum-verified-catalog.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0; +https://github.com/blacknacoof2-ux/welfare-equipment-site)';
const CHECKED_AT = new Date().toISOString().slice(0, 10);

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

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value = '') {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, '');
}

function buildSearchUrl(code) {
  const params = new URLSearchParams({
    ca_id: '',
    itmaker: '',
    itmodel: '',
    pttag: '',
    q: code,
    qbasic: '',
    qexplan: '',
    qid: '1',
    qname: '',
    qorder: '',
    qsort: '',
    qtag: '',
  });
  return `https://eroumcare.com/shop/search.php?${params.toString()}`;
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
      await sleep(800 * attempt);
      return fetchText(url, attempt + 1);
    }
    throw new Error(`HTTP ${response.status} ${url}`);
  }
  return response.text();
}

function extractResultText(plain) {
  const startMarker = '최근등록순';
  const endMarker = '회사소개';
  const start = plain.indexOf(startMarker);
  const end = plain.indexOf(endMarker, start >= 0 ? start : 0);
  if (start >= 0 && end > start) return plain.slice(start + startMarker.length, end).trim();
  if (start >= 0) return plain.slice(start + startMarker.length).trim();
  return plain.slice(0, 2500);
}

function parseResultCount(plain) {
  const match = plain.match(/전체분류\s*\((\d+)\)/);
  return match ? Number(match[1]) : null;
}

function parsePrice(resultText) {
  const match = resultText.match(/([0-9][0-9,]*)\s*원\s*급여가/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

function imageCandidates(html, productName) {
  const lower = html.toLowerCase();
  const nameIndex = lower.indexOf(productName.toLowerCase());
  const segmentStart = nameIndex >= 0 ? Math.max(0, nameIndex - 12000) : 0;
  const segmentEnd = nameIndex >= 0 ? Math.min(html.length, nameIndex + 12000) : html.length;
  const segment = html.slice(segmentStart, segmentEnd);
  const normalizedName = normalize(productName);
  const candidates = [];

  for (const match of segment.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = match[1];
    const srcMatch = attrs.match(/(?:data-src|src)=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const alt = decodeEntities(altMatch?.[1] ?? '');
    let url;
    try {
      url = new URL(decodeEntities(srcMatch[1]), 'https://eroumcare.com').toString();
    } catch {
      continue;
    }
    if (!/^https?:/i.test(url)) continue;
    if (/logo|icon|spinner|loading|blank|no[_-]?image|common\/img|banner|sns|footer|header/i.test(url)) continue;
    if (!/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(url)) continue;

    let score = 0;
    const normalizedAlt = normalize(alt);
    if (normalizedAlt && normalizedName && (normalizedAlt.includes(normalizedName) || normalizedName.includes(normalizedAlt))) score += 50;
    if (/shopby-images\.cdn-nhncommerce\.com|cdn\.imweb\.me|speedycdn|cafe24|eroumcare\.com\/data/i.test(url)) score += 20;
    if (/goods|product|item|upload|partner/i.test(url)) score += 10;
    if (/thumb|thumbnail/i.test(url)) score += 3;
    candidates.push({ url, alt, score });
  }

  const unique = [];
  const seen = new Set();
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    if (seen.has(candidate.url)) continue;
    seen.add(candidate.url);
    unique.push(candidate);
  }
  return unique.slice(0, 12);
}

function classify(resultCount, resultText) {
  if (resultCount === 0) return 'NOT_FOUND';
  if (resultCount !== 1 && resultCount !== null) return 'AMBIGUOUS';
  if (/단종/.test(resultText)) return 'DISCONTINUED';
  if (/비유통\s*상품/.test(resultText)) return 'NOT_DISTRIBUTED';
  if (/일시품절/.test(resultText)) return 'TEMP_OUT_OF_STOCK';
  if (/품절/.test(resultText)) return 'OUT_OF_STOCK';
  return 'ACTIVE';
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
        results[i] = {
          ...items[i],
          eroumStatus: 'ERROR',
          eroumError: String(error?.message ?? error),
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const source = JSON.parse(await fs.readFile(INPUT, 'utf8'));
const inputProducts = source.products ?? [];
console.log(`[eroum-verify] inputProducts=${inputProducts.length}`);

let completed = 0;
const verified = await mapLimit(inputProducts, 8, async (product) => {
  const searchUrl = buildSearchUrl(product.benefitCode);
  const html = await fetchText(searchUrl);
  const plain = htmlToText(html);
  const resultCount = parseResultCount(plain);
  const resultText = extractResultText(plain);
  const candidates = imageCandidates(html, product.name);
  const eroumStatus = classify(resultCount, resultText);
  const eroumPrice = parsePrice(resultText);
  const normalizedResult = normalize(resultText);
  const normalizedName = normalize(product.name);
  const nameMatched = normalizedName.length >= 2 && normalizedResult.includes(normalizedName);

  completed += 1;
  if (completed % 50 === 0 || completed === inputProducts.length) {
    console.log(`[eroum-verify] checked=${completed}/${inputProducts.length}`);
  }
  await sleep(40);

  return {
    ...product,
    eroumStatus,
    eroumSearchUrl: searchUrl,
    eroumCheckedAt: CHECKED_AT,
    eroumResultCount: resultCount,
    eroumNameMatched: nameMatched,
    eroumPrice,
    eroumPriceMatchesCarestore:
      eroumPrice !== null && product.benefitPrice !== null ? eroumPrice === product.benefitPrice : null,
    eroumImageUrl: candidates[0]?.url ?? null,
    eroumImageCandidates: candidates,
    eroumResultText: resultText.slice(0, 1400),
  };
});

const byStatus = {};
const byCategory = {};
const byCategoryActive = {};
const issues = [];
for (const product of verified) {
  byStatus[product.eroumStatus] = (byStatus[product.eroumStatus] ?? 0) + 1;
  byCategory[product.category] = (byCategory[product.category] ?? 0) + 1;
  if (product.eroumStatus === 'ACTIVE') {
    byCategoryActive[product.category] = (byCategoryActive[product.category] ?? 0) + 1;
    if (product.eroumResultCount !== 1 || !product.eroumNameMatched || product.eroumPriceMatchesCarestore === false) {
      issues.push({
        benefitCode: product.benefitCode,
        name: product.name,
        category: product.category,
        eroumResultCount: product.eroumResultCount,
        eroumNameMatched: product.eroumNameMatched,
        carestorePrice: product.benefitPrice,
        eroumPrice: product.eroumPrice,
        eroumSearchUrl: product.eroumSearchUrl,
      });
    }
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  checkedAt: CHECKED_AT,
  sourceSnapshotGeneratedAt: source.generatedAt ?? null,
  totals: {
    inputProducts: inputProducts.length,
    byStatus,
    byCategory,
    byCategoryActive,
    activeVerificationIssues: issues.length,
  },
  activeVerificationIssues: issues,
  products: verified,
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log('[eroum-verify] summary');
console.log(JSON.stringify(output.totals, null, 2));
if (issues.length) {
  console.log('[eroum-verify] activeVerificationIssues sample');
  console.log(JSON.stringify(issues.slice(0, 20), null, 2));
}
console.log(`[eroum-verify] wrote ${OUTPUT}`);
