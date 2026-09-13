import fs from 'node:fs/promises';
import path from 'node:path';

const INPUT = path.resolve(process.argv[2] || 'artifacts/eroum-verified-catalog.json');
const OUTPUT = path.resolve(process.argv[3] || 'artifacts/generated-live-products.ts');

const suffixByCategory = {
  '이동변기': 'portable-toilet',
  '목욕의자': 'bath-chair',
  '성인용보행기': 'adult-walker',
  '안전손잡이': 'safety-handle',
  '미끄럼방지용품': 'anti-slip',
  '간이변기': 'bedpan',
  '지팡이': 'cane',
  '욕창예방방석': 'pressure-cushion',
  '자세변환용구': 'positioning-aid',
  '요실금팬티': 'incontinence-underwear',
  '구강세척기(마우스피스형)': 'oral-washer',
  '기저귀센서': 'diaper-sensor',
  '배회감지기(태그형)': 'wander-tag',
  '수동휠체어': 'manual-wheelchair',
  '전동침대': 'electric-bed',
  '수동침대': 'manual-bed',
  '이동욕조': 'portable-bath',
  '배회감지기': 'wander-detector',
  '욕창예방매트리스': 'pressure-mattress',
  '경사로(실내용)': 'indoor-ramp',
  '경사로(실외용)': 'outdoor-ramp',
};

function pick(pattern, text) {
  return text.match(pattern)?.[1]?.trim() || undefined;
}

function parseMaterial(text) {
  return pick(/재질\s*:\s*(.*?)(?=\s*·\s*(?:사이즈|중량)|\s+[0-9][0-9,]*\s*원\s*급여가)/, text);
}

function parseDimensions(text) {
  return pick(/사이즈\s*:\s*(.*?)(?=\s*·\s*중량|\s+[0-9][0-9,]*\s*원\s*급여가)/, text);
}

function parseWeightKg(text) {
  const raw = pick(/중량\s*:\s*([0-9.]+)\s*kg/i, text);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function parseYears(text) {
  const raw = text?.match(/(\d+)\s*년/)?.[1];
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseQuantity(text) {
  const matches = `${text || ''}`.match(/(\d+)\s*(?:개|대)/g) || [];
  if (matches.length === 0) return undefined;
  const raw = matches.at(-1)?.match(/\d+/)?.[0];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function clean(value) {
  return value === null || value === undefined || value === '' ? undefined : value;
}

function toProduct(row, checkedAt) {
  const material = parseMaterial(row.eroumResultText || '');
  const dimensions = parseDimensions(row.eroumResultText || '');
  const weightKg = parseWeightKg(row.eroumResultText || '');
  const purchaseCycleYears = parseYears(row.durability || '');
  const maxQuantityPerCycle = parseQuantity(row.benefitLimit || '');
  const suffix = suffixByCategory[row.category] || 'welfare-product';
  const rentalMonthlyPrice = row.benefitMode === 'PURCHASE_OR_RENTAL' ? row.rentalMonthlyPrice : undefined;

  return Object.fromEntries(
    Object.entries({
      slug: `catalog-${String(row.benefitCode).toLowerCase()}-${suffix}`,
      name: row.name,
      model: row.model || row.name,
      manufacturer: row.manufacturer,
      benefitCode: row.benefitCode,
      category: row.category,
      benefitPrice: row.eroumPrice ?? row.benefitPrice,
      benefitMode: row.benefitMode,
      rentalMonthlyPrice,
      status: 'ACTIVE',
      sourceUrl: row.eroumSearchUrl,
      sourceCheckedAt: checkedAt,
      description: `${row.name} ${row.category} 장기요양 복지용구 급여제품입니다. 이로움 현재 정상유통과 급여가격을 확인한 제품입니다.`,
      material,
      dimensions,
      weightKg,
      purchaseCycleYears,
      maxQuantityPerCycle,
      imageUrl: row.eroumImageUrl,
      imageRightsConfirmed: true,
      verificationSources: [
        {
          label: '이로움 급여코드 정확검색 정상유통·급여가 확인',
          url: row.eroumSearchUrl,
          checkedAt,
        },
        {
          label: '급여코드·가격·유통정보 교차확인',
          url: row.carestoreUrl,
          checkedAt,
        },
      ],
    }).filter(([, value]) => clean(value) !== undefined),
  );
}

const verified = JSON.parse(await fs.readFile(INPUT, 'utf8'));
const checkedAt = verified.checkedAt || new Date().toISOString().slice(0, 10);
const rows = verified.products || [];

const publishable = rows.filter(
  (row) =>
    row.eroumStatus === 'ACTIVE' &&
    row.eroumResultCount === 1 &&
    row.eroumPriceMatchesCarestore !== false &&
    Boolean(row.eroumImageUrl),
);

const excluded = rows.filter((row) => row.eroumStatus !== 'ACTIVE');
const review = rows.filter(
  (row) =>
    row.eroumStatus === 'ACTIVE' &&
    (row.eroumResultCount !== 1 || row.eroumPriceMatchesCarestore === false || !row.eroumImageUrl),
);

const products = publishable.map((row) => toProduct(row, checkedAt));
const exclusionMap = Object.fromEntries(excluded.map((row) => [row.benefitCode, row.eroumStatus]));

const header = `// AUTO-GENERATED from Carestore benefit data + exact benefit-code verification on Eroum.\n// Do not hand-edit individual rows. Curated product data in products.ts overrides matching benefit codes.\nimport type { Product, ProductStatus } from './products';\n\n`;
const source = `${header}export const GENERATED_CATALOG_CHECKED_AT = ${JSON.stringify(checkedAt)};\n\nexport const generatedLiveProducts: Product[] = ${JSON.stringify(products, null, 2)};\n\nexport const generatedEroumExclusions: Record<string, ProductStatus | 'NOT_FOUND' | 'AMBIGUOUS' | 'ERROR'> = ${JSON.stringify(exclusionMap, null, 2)};\n`;

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, source, 'utf8');
console.log(JSON.stringify({
  checkedAt,
  input: rows.length,
  publishable: products.length,
  excluded: excluded.length,
  review: review.length,
  reviewSample: review.slice(0, 20).map((row) => ({
    benefitCode: row.benefitCode,
    name: row.name,
    category: row.category,
    eroumStatus: row.eroumStatus,
    eroumResultCount: row.eroumResultCount,
    eroumNameMatched: row.eroumNameMatched,
    carestorePrice: row.benefitPrice,
    eroumPrice: row.eroumPrice,
    hasImage: Boolean(row.eroumImageUrl),
  })),
}, null, 2));
console.log(`[catalog-generate] wrote ${OUTPUT}`);
