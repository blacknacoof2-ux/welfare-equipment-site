'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addCompareItem,
  clearCompareItems,
  COMPARE_EVENT,
  MAX_COMPARE_ITEMS,
  readCompareItems,
  removeCompareItem,
  type CompareItem,
} from '@/lib/compare';

const formatter = new Intl.NumberFormat('ko-KR');

function copay(price: number, rate: number) {
  return Math.floor((price * rate) / 10) * 10;
}

function modeLabel(mode: CompareItem['benefitMode']) {
  if (mode === 'RENTAL') return '대여';
  if (mode === 'PURCHASE_OR_RENTAL') return '구입·대여';
  return '구입';
}

export default function ProductCompare({ candidates }: { candidates: CompareItem[] }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [category, setCategory] = useState('');
  const [candidateCode, setCandidateCode] = useState('');
  const [message, setMessage] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(candidates.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'ko')),
    [candidates],
  );

  useEffect(() => {
    const sync = () => {
      const next = readCompareItems();
      setItems(next);
      if (next[0]) setCategory(next[0].category);
    };
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!category && categories[0]) setCategory(categories[0]);
  }, [categories, category]);

  const available = useMemo(
    () => candidates.filter((candidate) => candidate.category === category && !items.some((item) => item.benefitCode === candidate.benefitCode)),
    [candidates, category, items],
  );

  useEffect(() => {
    setCandidateCode(available[0]?.benefitCode ?? '');
  }, [available]);

  function addSelected() {
    const candidate = candidates.find((item) => item.benefitCode === candidateCode);
    if (!candidate) return;
    const result = addCompareItem(candidate);
    setMessage(result.message);
  }

  function reset() {
    clearCompareItems();
    setMessage('비교함을 비웠습니다.');
  }

  return (
    <section className="compare-shell">
      <div className="consult-hero compact">
        <div>
          <p className="eyebrow">복지용구 제품 비교</p>
          <h1>같은 품목끼리 한눈에 비교하세요</h1>
          <p>같은 카테고리 제품을 최대 {MAX_COMPARE_ITEMS}개까지 비교합니다. 급여가격, 일반 15%·감경 9%·감경 6%, 규격, 중량과 재질을 함께 확인할 수 있습니다.</p>
        </div>
      </div>

      <div className="consult-card compare-picker">
        <label>
          <span>비교할 품목</span>
          <select
            value={category}
            disabled={items.length > 0}
            onChange={(event) => {
              setCategory(event.target.value);
              setMessage('');
            }}
          >
            {categories.map((name) => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span>제품 추가</span>
          <select value={candidateCode} onChange={(event) => setCandidateCode(event.target.value)} disabled={!available.length || items.length >= MAX_COMPARE_ITEMS}>
            {available.length ? available.map((item) => (
              <option value={item.benefitCode} key={item.benefitCode}>{item.title} · {item.model}</option>
            )) : <option value="">추가 가능한 제품 없음</option>}
          </select>
        </label>
        <button className="button primary" type="button" onClick={addSelected} disabled={!candidateCode || items.length >= MAX_COMPARE_ITEMS}>비교 제품 추가</button>
        {items.length > 0 && <button className="button secondary" type="button" onClick={reset}>비교함 비우기</button>}
        {message && <p className="compare-picker-message">{message}</p>}
      </div>

      {items.length < 2 ? (
        <div className="consult-card compare-empty">
          <h2>제품을 2개 이상 담아주세요</h2>
          <p>상품 상세페이지나 맞춤 추천 결과의 <strong>같은 품목 비교</strong> 버튼을 눌러도 이 비교함에 추가됩니다.</p>
        </div>
      ) : (
        <div className="compare-table-wrap" role="region" aria-label={`${items[0].category} 제품 비교표`} tabIndex={0}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>비교 항목</th>
                {items.map((item) => (
                  <th key={item.benefitCode}>
                    <div className="compare-product-head">
                      {item.imageUrl && <img src={item.imageUrl} alt={`${item.title} 제품사진`} />}
                      <a href={`/products/${item.slug}`}><strong>{item.title}</strong></a>
                      <span>{item.model}</span>
                      <button type="button" className="text-button" onClick={() => removeCompareItem(item.benefitCode)}>비교에서 빼기</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>품목</th>{items.map((item) => <td key={item.benefitCode}>{item.category}</td>)}</tr>
              <tr><th>급여방식</th>{items.map((item) => <td key={item.benefitCode}>{modeLabel(item.benefitMode)}</td>)}</tr>
              <tr><th>제조·공급사</th>{items.map((item) => <td key={item.benefitCode}>{item.manufacturer}</td>)}</tr>
              <tr><th>급여코드</th>{items.map((item) => <td key={item.benefitCode}>{item.benefitCode}</td>)}</tr>
              <tr><th>급여가격</th>{items.map((item) => <td key={item.benefitCode}>{formatter.format(item.benefitPrice)}원{item.priceSuffix}</td>)}</tr>
              <tr className="compare-emphasis"><th>일반 15%</th>{items.map((item) => <td key={item.benefitCode}><strong>{formatter.format(copay(item.benefitPrice, 0.15))}원{item.priceSuffix}</strong></td>)}</tr>
              <tr><th>감경 9%</th>{items.map((item) => <td key={item.benefitCode}>{formatter.format(copay(item.benefitPrice, 0.09))}원{item.priceSuffix}</td>)}</tr>
              <tr><th>감경 6%</th>{items.map((item) => <td key={item.benefitCode}>{formatter.format(copay(item.benefitPrice, 0.06))}원{item.priceSuffix}</td>)}</tr>
              <tr><th>규격</th>{items.map((item) => <td key={item.benefitCode}>{item.dimensions || '확인 필요'}</td>)}</tr>
              <tr><th>중량</th>{items.map((item) => <td key={item.benefitCode}>{item.weightKg !== undefined ? `${item.weightKg}kg` : '확인 필요'}</td>)}</tr>
              <tr><th>재질</th>{items.map((item) => <td key={item.benefitCode}>{item.material || '확인 필요'}</td>)}</tr>
              <tr>
                <th>상세보기</th>
                {items.map((item) => <td key={item.benefitCode}><a className="button secondary compare-detail-link" href={`/products/${item.slug}`}>제품 상세</a></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="consult-card consult-disclaimer">
        <strong>비교 안내</strong>
        <p>표에 없는 규격은 임의로 추정하지 않고 ‘확인 필요’로 표시합니다. 실제 사용 적합성과 급여 가능 여부는 수급자 상태·사용환경·급여 이력을 확인한 뒤 최종 상담해야 합니다.</p>
      </div>
    </section>
  );
}
