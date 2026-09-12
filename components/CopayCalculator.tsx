'use client';

import { useMemo, useState } from 'react';
import { getCopays } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export default function CopayCalculator() {
  const [value, setValue] = useState('200000');
  const price = Math.max(0, Number(value.replace(/[^0-9]/g, '')) || 0);
  const copays = useMemo(() => getCopays(price), [price]);

  return (
    <section className="calculator" aria-labelledby="copay-title">
      <div>
        <p className="eyebrow">장기요양 복지용구</p>
        <h2 id="copay-title">본인부담금 계산기</h2>
        <p className="muted">급여가격을 입력하면 15% · 9% · 6% 기준 본인부담금을 계산합니다.</p>
      </div>
      <label className="price-input">
        <span>급여가격</span>
        <div><input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} aria-label="급여가격" /><strong>원</strong></div>
      </label>
      <div className="copay-grid">
        <div><span>일반 15%</span><strong>{formatter.format(copays.copay15)}원</strong></div>
        <div><span>감경 9%</span><strong>{formatter.format(copays.copay9)}원</strong></div>
        <div><span>감경 6%</span><strong>{formatter.format(copays.copay6)}원</strong></div>
      </div>
      <p className="calculator-note">※ 10원 미만 끝수는 계산하지 않는 방식으로 표시합니다. 실제 적용 대상과 금액은 장기요양 인정내용 및 공단 기준을 확인하세요.</p>
    </section>
  );
}
