const cases = [
  ['B03180217501', 'HANGANG10000'],
  ['B03180081506', 'PN-L41522D'],
  ['M06091283601', 'ActiveFree OP3'],
  ['M06060006503', 'AID CARBON ROLLATOR'],
  ['H12060031101', 'YH-0302TPU'],
];

const UA = 'Mozilla/5.0 (compatible; AtomCareCatalogBot/1.0)';
function plain(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
}
function resultInfo(text) {
  const count = Number(text.match(/전체분류\s*\((\d+)\)/)?.[1] ?? -1);
  const s=text.indexOf('최근등록순'); const e=text.indexOf('회사소개',Math.max(0,s));
  const result=(s>=0?(e>s?text.slice(s+5,e):text.slice(s+5)):text).trim();
  return {count,result:result.slice(0,1200)};
}
for (const [code,name] of cases) {
  for (const mode of ['name','all']) {
    const p=new URLSearchParams({ca_id:'',itmaker:'',itmodel:'',pttag:'',q:name,qbasic:mode==='all'?'1':'',qexplan:mode==='all'?'1':'',qid:mode==='all'?'1':'',qname:'1',qorder:'',qsort:'',qtag:mode==='all'?'1':''});
    const url=`https://eroumcare.com/shop/search.php?${p}`;
    const r=await fetch(url,{headers:{'user-agent':UA,'accept-language':'ko-KR,ko;q=0.9'}});
    const t=plain(await r.text());
    console.log(JSON.stringify({code,name,mode,status:r.status,...resultInfo(t)},null,2));
  }
}
