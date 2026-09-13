import AddToConsultCart from '@/components/AddToConsultCart';
import { getBenefitModeEmoji, getBenefitModeLabel } from '@/lib/category-ui';
import { getProductDisplayTitle } from '@/lib/product-display';
import {
  getBenefitMode,
  getCopays,
  getPriceSuffix,
  getPrimaryPriceLabel,
  type Product,
} from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

function DetailStat({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className={`detail-visual-stat ${featured ? 'featured' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getUseEnvironment(product: Product) {
  if (product.category.includes('실내용')) return '실내';
  if (product.category.includes('실외용')) return '실외';

  const environments: Record<string, string> = {
    '성인용보행기': '실내·실외',
    '지팡이': '실내·실외',
    '수동휠체어': '실내·실외',
    '목욕의자': '욕실·실내',
    '안전손잡이': '실내 생활공간',
    '미끄럼방지용품': '욕실·실내',
    '이동변기': '실내',
    '간이변기': '실내',
    '전동침대': '실내',
    '수동침대': '실내',
    '욕창예방매트리스': '침대·실내',
    '욕창예방방석': '휠체어·의자',
    '자세변환용구': '침대·실내',
    '배회감지기': '실내·실외',
    '배회감지기(태그형)': '실내·실외',
    '이동욕조': '실내',
    '요실금팬티': '일상생활',
    '기저귀센서': '실내 생활공간',
    '구강세척기(마우스피스형)': '실내',
  };

  return environments[product.category] ?? '제품별 확인';
}

export default function ProductDetailVisual({ product }: { product: Product }) {
  const title = getProductDisplayTitle(product);
  const mode = getBenefitMode(product);
  const copays = getCopays(product.benefitPrice);
  const suffix = getPriceSuffix(product);
  const primaryPriceLabel = getPrimaryPriceLabel(product);
  const useEnvironment = getUseEnvironment(product);

  return (
    <section className="content-card product-detail-visual" aria-label={`${title} 핵심 제원`}>
      <div className="detail-visual-heading">
        <div>
          <p className="eyebrow">KEY SPECIFICATIONS</p>
          <h2>{title} 핵심 제원</h2>
          <p className="muted">
            같은 대표사진을 반복하지 않고, 제품 선택에 필요한 사용환경·규격·중량·재질과 급여정보를 먼저 정리했습니다.
          </p>
        </div>
        <span className={`benefit-mode-badge mode-${mode.toLowerCase()}`}>
          <span aria-hidden="true">{getBenefitModeEmoji(mode)}</span>{getBenefitModeLabel(mode)}
        </span>
      </div>

      <div className="detail-visual-info detail-visual-info-full">
        <div className="detail-visual-stats detail-visual-stats-wide">
          <DetailStat label="주 사용환경" value={useEnvironment} featured />
          {product.weightKg !== undefined && <DetailStat label="중량" value={`${product.weightKg}kg`} featured />}
          {product.dimensions && <DetailStat label="규격" value={product.dimensions} featured />}
          {product.material && <DetailStat label="재질" value={product.material} />}
          <DetailStat label="급여방식" value={getBenefitModeLabel(mode)} />
          {product.purchaseCycleYears && <DetailStat label="사용 가능 햇수" value={`${product.purchaseCycleYears}년`} />}
          {product.maxQuantityPerCycle !== undefined && <DetailStat label="급여한도" value={`최대 ${product.maxQuantityPerCycle}개`} />}
          <DetailStat label={primaryPriceLabel} value={`${formatter.format(product.benefitPrice)}원${suffix}`} />
          <DetailStat label="급여코드" value={product.benefitCode} />
          <DetailStat label="제조·공급사" value={product.manufacturer} />
        </div>

        <p className="detail-spec-note">
          사용환경 표시는 품목의 일반적인 용도 기준이며, 실제 사용 가능 장소와 설치 조건은 제품 규격·사용설명서와 현장 환경을 함께 확인해야 합니다.
        </p>

        <div className="detail-visual-copays" aria-label={`${title} 본인부담금`}>
          <div><span>일반 15%</span><strong>{formatter.format(copays.copay15)}원{suffix}</strong></div>
          <div><span>감경 9%</span><strong>{formatter.format(copays.copay9)}원{suffix}</strong></div>
          <div><span>감경 6%</span><strong>{formatter.format(copays.copay6)}원{suffix}</strong></div>
        </div>

        <AddToConsultCart item={{
          slug: product.slug,
          title,
          manufacturer: product.manufacturer,
          benefitCode: product.benefitCode,
          benefitPrice: product.benefitPrice,
          category: product.category,
          benefitMode: mode,
          priceSuffix: suffix,
          imageUrl: product.imageUrl,
        }} />
      </div>
    </section>
  );
}
