import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const livePath = path.join(repoRoot, 'lib', 'generated-live-products.ts');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';

function extractGeneratedProducts(source) {
  const token = 'export const generatedLiveProducts: Product[] = ';
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`Token not found: ${token}`);
  const jsonStart = source.indexOf('[', start + token.length);
  const endToken = '\nexport const generatedEroumExclusions';
  const searchEnd = source.indexOf(endToken, jsonStart);
  const stop = searchEnd >= 0 ? searchEnd : source.length;
  const jsonEnd = source.lastIndexOf('];', stop);
  if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error('generatedLiveProducts payload not found');
  return JSON.parse(source.slice(jsonStart, jsonEnd + 1));
}

async function waitForServer() {
  let lastError = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      if (response.status < 500) return;
      lastError = new Error(`home returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError ?? new Error(`Server did not become ready: ${baseUrl}`);
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

const source = await readFile(livePath, 'utf8');
const products = extractGeneratedProducts(source);
await waitForServer();

const results = await mapLimit(products, 20, async (product) => {
  const url = `${baseUrl}/products/${encodeURIComponent(product.slug)}`;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const html = await response.text();
    const expectedId = `detail-image-${product.slug}-1`;
    const hasDetailImage = html.includes(`id=\"${expectedId}\"`) || html.includes(`id='${expectedId}'`);
    const hasDetailHeading = html.includes('제품 상세 이미지');
    return {
      slug: product.slug,
      model: product.model,
      benefitCode: product.benefitCode,
      status: response.status,
      hasDetailImage,
      hasDetailHeading,
      ok: response.status === 200 && hasDetailImage && hasDetailHeading,
    };
  } catch (error) {
    return {
      slug: product.slug,
      model: product.model,
      benefitCode: product.benefitCode,
      status: null,
      hasDetailImage: false,
      hasDetailHeading: false,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

const failures = results.filter((item) => !item.ok);
console.log(JSON.stringify({
  summary: {
    total: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
  },
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
