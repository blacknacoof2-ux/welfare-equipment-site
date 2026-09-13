const USER_AGENT = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0)';

function plainText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const page of [1, 2, 10, 50]) {
  const params = new URLSearchParams({
    ca_id: '',
    itmaker: '',
    itmodel: '',
    page: String(page),
    pttag: '',
    q: '',
    qbasic: '',
    qexplan: '',
    qid: '',
    qname: '1',
    qorder: '',
    qsort: '',
    qtag: '',
  });
  const url = `https://eroumcare.com/shop/search.php?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'ko-KR,ko;q=0.9' },
  });
  const html = await response.text();
  const text = plainText(html);
  const start = text.indexOf('최근등록순');
  const end = text.indexOf('회사소개', Math.max(0, start));
  const result = start >= 0 ? text.slice(start, end > start ? end : start + 7000) : text.slice(0, 7000);
  const counts = [...text.matchAll(/전체분류\s*\((\d+)\)/g)].map((m) => Number(m[1]));
  const imageUrls = [...html.matchAll(/(?:src|data-src)=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((src) => /(?:data\/item|mall\.eroumcare\.com\/data\/item)/i.test(src));
  console.log(JSON.stringify({
    page,
    status: response.status,
    htmlLength: html.length,
    counts,
    imageCount: new Set(imageUrls).size,
    imageSample: [...new Set(imageUrls)].slice(0, 10),
    result: result.slice(0, 6500),
  }, null, 2));
}
