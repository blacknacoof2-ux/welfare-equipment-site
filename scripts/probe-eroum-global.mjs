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

function productImages(html) {
  const rows = [];
  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = match[1];
    const src = attrs.match(/(?:data-src|src)=["']([^"']+)["']/i)?.[1] || '';
    if (!/(?:data\/item|mall\.eroumcare\.com\/data\/item)/i.test(src)) continue;
    const alt = attrs.match(/alt=["']([^"']*)["']/i)?.[1] || '';
    rows.push({ index: match.index, src, alt, attrs });
  }
  return rows;
}

for (const page of [1]) {
  const params = new URLSearchParams({
    ca_id: '', itmaker: '', itmodel: '', page: String(page), pttag: '', q: '',
    qbasic: '', qexplan: '', qid: '', qname: '1', qorder: '', qsort: '', qtag: '',
  });
  const url = `https://eroumcare.com/shop/search.php?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'ko-KR,ko;q=0.9' },
  });
  const html = await response.text();
  const images = productImages(html);
  console.log(JSON.stringify({ page, status: response.status, imageCount: images.length }, null, 2));
  for (const image of images.slice(0, 4)) {
    const raw = html.slice(Math.max(0, image.index - 1800), Math.min(html.length, image.index + 3500));
    console.log(JSON.stringify({
      src: image.src,
      alt: image.alt,
      attrs: image.attrs,
      raw,
      text: plainText(raw),
    }, null, 2));
  }
}
