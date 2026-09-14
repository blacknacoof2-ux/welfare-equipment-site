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

const [liveSource, greymallSource, carestoreSource, gagaonSource, cafe24Source, curatedSource] = await Promise.all([
  readFile(livePath, 'utf8'),
  readFile(greymallPath, 'utf8'),
  readFile(carestorePath, 'utf8'),
  readFile(gagaonPath, 'utf8'),
  readFile(cafe24Path, 'utf8'),
  readFile(curatedPath, 'utf8'),
]);

const products = extractGeneratedProducts(liveSource);
const greymall = extractRegistry(greymallSource, 'generatedGreymallDetailImageSetsByModel: Record<string, GeneratedGreymallDetailImageSet>');
const carestore = extractRegistry(carestoreSource, 'generatedCarestoreDetailImageSetsByModel: Record<string, GeneratedCarestoreDetailImageSet>');
const gagaon = extractRegistry(gagaonSource, 'generatedGagaonDetailImageSetsByModel: Record<string, GeneratedGagaonDetailImageSet>');
const cafe24 = extractRegistry(cafe24Source, 'generatedCafe24DetailImageSetsByModel: Record<string, GeneratedCafe24DetailImageSet>');
const curatedSlugs = extractCuratedSlugs(curatedSource);

const covered = [];
const uncovered = [];
const sourceCounts = { CURATED: 0, GREYMALL: 0, CARESTORE: 0, GAGAON: 0, CAFE24: 0 };

for (const product of products) {
  let source = null;
  if (curatedSlugs.has(product.slug)) source = 'CURATED';
  else if (greymall[product.model]?.urls?.length) source = 'GREYMALL';
  else if (carestore[product.model]?.urls?.length) source = 'CARESTORE';
  else if (gagaon[product.model]?.urls?.length) source = 'GAGAON';
  else if (cafe24[product.model]?.urls?.length) source = 'CAFE24';

  if (source) {
    sourceCounts[source] += 1;
    covered.push({ slug: product.slug, model: product.model, category: product.category, source });
  } else {
    uncovered.push({
      slug: product.slug,
      name: product.name,
      model: product.model,
      benefitCode: product.benefitCode,
      category: product.category,
    });
  }
}

const summary = {
  total: products.length,
  covered: covered.length,
  uncovered: uncovered.length,
  coveragePercent: Number(((covered.length / products.length) * 100).toFixed(1)),
  sourceCounts,
};

console.log(JSON.stringify({ summary, uncovered }, null, 2));

if (process.env.REQUIRE_FULL_DETAIL === '1' && uncovered.length > 0) {
  process.exitCode = 1;
}
