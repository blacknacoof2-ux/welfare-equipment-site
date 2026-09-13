const codes = [
  ['M06090217502', 'WAG02'],
  ['F18030060113', 'ASH-120'],
  ['S03090088004', 'Rapport-II'],
];

const USER_AGENT = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0)';

function text(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function imageCandidates(html, name) {
  const lower = html.toLowerCase();
  const idx = lower.indexOf(name.toLowerCase());
  const segment = idx >= 0 ? html.slice(Math.max(0, idx - 9000), idx + 9000) : html;
  const urls = [];
  for (const match of segment.matchAll(/<img\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(match[1], 'https://eroumcare.com').toString();
      if (!/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(url)) continue;
      if (/logo|icon|spinner|loading|blank|no[_-]?image|common\/img/i.test(url)) continue;
      urls.push(url);
    } catch {}
  }
  return [...new Set(urls)].slice(0, 12);
}

for (const [code, name] of codes) {
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
  const url = `https://eroumcare.com/shop/search.php?${params.toString()}`;
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT, 'accept-language': 'ko-KR,ko;q=0.9' } });
  const html = await response.text();
  const plain = text(html);
  const itemLinks = [...html.matchAll(/href=["']([^"']*\/shop\/item\.php\?it_id=[^"'&]+[^"']*)["']/gi)].map((m) => m[1]);
  const idx = plain.toLowerCase().indexOf(name.toLowerCase());
  const around = idx >= 0 ? plain.slice(Math.max(0, idx - 120), idx + 420) : plain.slice(0, 500);
  console.log(JSON.stringify({
    code,
    name,
    status: response.status,
    htmlLength: html.length,
    containsCode: plain.includes(code),
    containsName: plain.toLowerCase().includes(name.toLowerCase()),
    containsNonDistributed: plain.includes('비유통 상품'),
    containsOutOfStock: plain.includes('품절'),
    containsTemporaryOutOfStock: plain.includes('일시품절'),
    itemLinks: [...new Set(itemLinks)].slice(0, 5),
    imageCandidates: imageCandidates(html, name),
    around,
  }, null, 2));
}
