const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5000';
const failures = [];

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  const text = await response.text();
  return { status: response.status, text };
}

const empty = await get('/compare');
if (empty.status !== 200) failures.push(`GET /compare -> ${empty.status}`);
if (!empty.text.includes('비교할 제품을 2~3개 선택하세요')) failures.push('empty compare guide missing');

const compare = await get('/compare?items=wag02-adult-walker,sporty-adult-walker');
if (compare.status !== 200) failures.push(`GET comparison -> ${compare.status}`);
for (const marker of ['성인용보행기', '제품 비교', 'WAG02', 'SPORTY', '본인부담 15%', '본인부담 9%', '본인부담 6%', '신청목록에 담기']) {
  if (!compare.text.includes(marker)) failures.push(`comparison marker missing: ${marker}`);
}

const products = await get('/products?category=%EC%84%B1%EC%9D%B8%EC%9A%A9%EB%B3%B4%ED%96%89%EA%B8%B0');
if (products.status !== 200) failures.push(`GET walker products -> ${products.status}`);
if (!products.text.includes('비교하기')) failures.push('product compare button missing');

const detail = await get('/products/wag02-adult-walker');
if (detail.status !== 200) failures.push(`GET WAG02 detail -> ${detail.status}`);
if (!detail.text.includes('비교하기')) failures.push('detail compare button missing');

console.log(JSON.stringify({
  summary: {
    emptyCompareStatus: empty.status,
    comparisonStatus: compare.status,
    productListStatus: products.status,
    detailStatus: detail.status,
    failures: failures.length,
  },
  failures,
}, null, 2));

if (failures.length > 0) process.exit(1);
