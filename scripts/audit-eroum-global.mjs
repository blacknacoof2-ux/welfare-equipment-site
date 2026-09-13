import fs from 'node:fs/promises';
import path from 'node:path';

const INPUT = path.resolve(process.argv[2] || 'artifacts/carestore-catalog.json');
const OUTPUT = path.resolve(process.argv[3] || 'artifacts/eroum-global-audit.json');
const USER_AGENT = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0; +https://github.com/blacknacoof2-ux/welfare-equipment-site)';
const MAX_PAGES = 100;

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

function normalize(value = '') {
  return decodeEntities(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/상품이미지/g, '')
    .replace(/\b(?:hit|new|best)\b/g, '')
    .replace(/[^0-9a-z가-힣]+/g, '');
}

function canonicalName(value = '') {
  return normalize(
    decodeEntities(value)
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/\((?:[^)]*(?:설치|패키지|보장구)[^)]*)\)/gi, ' ')
      .replace(/\b보장구\b/gi, ' '),
  );
}

function buildPageUrl(page) {
  const params = new URLSearchParams({
    ca_id: '', itmaker: '', itmodel: '', page: String(page), pttag: '', q: '',
    qbasic: '', qexplan: '', qid: '', qname: '1', qorder: '', qsort: '', qtag: '',
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

function parseMoney(text = '') {
  const match = text.match(/([0-9][0-9,]*)\s*원\s*급여가/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

function parseCards(html, page) {
  const cards = [];
  const pattern = /<li\s+class=["'](PRO[^"']+)["']\s+data-ca=["']([^"']*)["']>([\s\S]*?)<\/a>\s*<\/li>/gi;
  for (const match of html.matchAll(pattern)) {
    const itemId = match[1];
    const dataCa = match[2];
    const block = match[3];
    const nameHtml = block.match(/<p\s+class=["']name["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
    const name = stripTags(nameHtml);
    const href = block.match(/href=["']([^"']*item\.php\?it_id=[^"']+)["']/i)?.[1]
      || match[0].match(/href=["']([^"']*item\.php\?it_id=[^"']+)["']/i)?.[1]
      || `./item.php?it_id=${itemId}`;
    const image = block.match(/<img\b[^>]*(?:data-src|src)=["']([^"']+)["'][^>]*>/i)?.[1] || null;
    const text = stripTags(block);
    const benefitPrice = parseMoney(text);
    const isNonDistributed = /비유통\s*상품/.test(text);
    const isDiscontinued = /단종/.test(text);
    const isTemporaryOut = /일시품절/.test(text);
    const isOut = !isTemporaryOut && /품절/.test(text);
    const isAssistiveDevice = /(?:^|\s|\[)보장구(?:\]|\s|$)|#보장구|#비급여|(?:^|\s)비급여(?:\s|$)/i.test(text);
    const hasPositiveBenefitPrice = benefitPrice !== null && benefitPrice > 0;
    const liveBenefit = hasPositiveBenefitPrice
      && !isNonDistributed
      && !isDiscontinued
      && !isTemporaryOut
      && !isOut
      && !isAssistiveDevice;

    cards.push({
      page,
      itemId,
      dataCa,
      name,
      normalizedName: normalize(name),
      canonicalName: canonicalName(name),
      benefitPrice,
      liveBenefit,
      isNonDistributed,
      isDiscontinued,
      isTemporaryOut,
      isOut,
      isAssistiveDevice,
      itemUrl: new URL(href, 'https://eroumcare.com/shop/').toString(),
      imageUrl: image ? new URL(image, 'https://eroumcare.com').toString() : null,
      text: text.slice(0, 1400),
    });
  }
  return cards;
}

function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length > b.length ? a : b;
  return short.length >= 5 && long.includes(short);
}

const source = JSON.parse(await fs.readFile(INPUT, 'utf8'));
const candidates = source.products || [];
const normalizedCandidates = candidates.map((row) => ({
  benefitCode: row.benefitCode,
  name: row.name,
  model: row.model,
  category: row.category,
  normalizedName: normalize(row.name),
  normalizedModel: normalize(row.model || row.name),
  canonicalName: canonicalName(row.name),
  canonicalModel: canonicalName(row.model || row.name),
}));

const pages = [];
const allCards = [];
const seenFingerprints = new Set();
let consecutiveEmpty = 0;

for (let page = 1; page <= MAX_PAGES; page += 1) {
  const url = buildPageUrl(page);
  const html = await fetchText(url);
  const cards = parseCards(html, page);
  const fingerprint = cards.map((card) => card.itemId).join('|');

  if (cards.length === 0) {
    consecutiveEmpty += 1;
    pages.push({ page, cards: 0, liveBenefit: 0, stopped: consecutiveEmpty >= 2 ? 'EMPTY' : undefined });
    if (consecutiveEmpty >= 2) break;
    continue;
  }
  consecutiveEmpty = 0;
  if (seenFingerprints.has(fingerprint)) {
    pages.push({ page, cards: cards.length, liveBenefit: cards.filter((card) => card.liveBenefit).length, stopped: 'REPEATED_PAGE' });
    break;
  }
  seenFingerprints.add(fingerprint);
  pages.push({ page, cards: cards.length, liveBenefit: cards.filter((card) => card.liveBenefit).length });
  allCards.push(...cards);
  if (page % 10 === 0) console.log(`[eroum-global-audit] scanned page=${page} cards=${allCards.length}`);
  await sleep(80);
}

const uniqueCards = [...new Map(allCards.map((card) => [card.itemId, card])).values()];
const liveCards = uniqueCards.filter((card) => card.liveBenefit);
const matched = [];
const unmatched = [];

for (const card of liveCards) {
  const matches = normalizedCandidates.filter((candidate) =>
    namesMatch(card.normalizedName, candidate.normalizedName)
      || namesMatch(card.normalizedName, candidate.normalizedModel)
      || namesMatch(card.canonicalName, candidate.canonicalName)
      || namesMatch(card.canonicalName, candidate.canonicalModel),
  );
  if (matches.length > 0) {
    matched.push({
      ...card,
      matches: matches.slice(0, 5).map(({ benefitCode, name, category }) => ({ benefitCode, name, category })),
    });
  } else {
    unmatched.push(card);
  }
}

const byPage = Object.fromEntries(pages.map((row) => [row.page, row]));
const output = {
  generatedAt: new Date().toISOString(),
  sourceCandidateCount: candidates.length,
  pagesScanned: pages.length,
  lastPage: pages.at(-1)?.page ?? 0,
  stopReason: pages.at(-1)?.stopped ?? 'MAX_PAGES',
  cardsSeen: allCards.length,
  uniqueCards: uniqueCards.length,
  longTermCareLiveBenefitCards: liveCards.length,
  matchedLiveCards: matched.length,
  unmatchedLiveCards: unmatched.length,
  excludedAssistiveDeviceCards: uniqueCards.filter((card) => card.isAssistiveDevice).length,
  pages: byPage,
  unmatched: unmatched.map((card) => ({
    page: card.page,
    itemId: card.itemId,
    name: card.name,
    benefitPrice: card.benefitPrice,
    dataCa: card.dataCa,
    itemUrl: card.itemUrl,
    imageUrl: card.imageUrl,
    text: card.text,
  })),
};

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log('[eroum-global-audit] summary');
console.log(JSON.stringify({
  sourceCandidateCount: output.sourceCandidateCount,
  pagesScanned: output.pagesScanned,
  lastPage: output.lastPage,
  stopReason: output.stopReason,
  uniqueCards: output.uniqueCards,
  longTermCareLiveBenefitCards: output.longTermCareLiveBenefitCards,
  matchedLiveCards: output.matchedLiveCards,
  unmatchedLiveCards: output.unmatchedLiveCards,
  excludedAssistiveDeviceCards: output.excludedAssistiveDeviceCards,
  unmatchedSample: output.unmatched.slice(0, 50),
}, null, 2));
console.log(`[eroum-global-audit] wrote ${OUTPUT}`);

if (output.unmatchedLiveCards > 0) {
  throw new Error(`Global Eroum audit found ${output.unmatchedLiveCards} unmatched live long-term-care benefit product card(s).`);
}
