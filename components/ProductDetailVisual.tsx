import AddToConsultCart from '@/components/AddToConsultCart';
import { getBenefitModeEmoji, getBenefitModeLabel } from '@/lib/category-ui';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getProductMedia } from '@/lib/product-images';
import {
  getBenefitMode,
  getCopays,
  getPriceSuffix,
  getPrimaryPriceLabel,
  type Product,
} from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-visual-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function ProductDetailVisual({ product }: { product: Product }) {
  const media = getProductMedia(product);
  if (!media?.heroUrl) return null;

  const title = getProductDisplayTitle(product);
  const mode = getBenefitMode(product);
  const copays = getCopays(product.benefitPrice);
  const suffix = getPriceSuffix(product);
  const primaryPriceLabel = getPrimaryPriceLabel(product);

  return (
    <section className="content-card product-detail-visual" aria-label={`${title} 상세 제품 안내`}>
      <div className="detail-visual-heading">
        <div>
          <p className="eyebrow">VERIFIED PRODUCT DETAIL</p>
          <h2>{title} 상세 제품 안내</h2>
          <p className="muted">
            대표 제품사진과 검증된 급여·규격 정보를 한 화면에 정리했습니다.
          </p>
        </div>
        <span className={`benefit-mode-badge mode-${mode.toLowerCase()}`}>
          <span aria-hidden="true">{getBenefitModeEmoji(mode)}</span>{getBenefitModeLabel(mode)}
        </span>
      </div>

      <div className="detail-visual-grid">
        <div className="detail-visual-photo">
          <img src={media.heroUrl} alt={`${title} 제품 상세 안내용 대표사진`} loading="lazy" />
        </div>

        <div className="detail-visual-info">
          <div className="detail-visual-stats">
            <DetailStat label="급여코드" value={product.benefitCode} />
            <DetailStat label="제조·공급사" value={product.manufacturer} />
            <DetailStat label={primaryPriceLabel} value={`${formatter.format(product.benefitPrice)}원${suffix}`} />
            <DetailStat label="급여방식" value={getBenefitModeLabel(mode)} />
            {product.dimensions && <DetailStat label="규격" value={product.dimensions} />}
            {product.weightKg !== undefined && <DetailStat label="중량" value={`${product.weightKg}kg`} />}
            {product.material && <DetailStat label="재질" value={product.material} />}
            {product.purchaseCycleYears && <DetailStat label="사용 가능 햇수" value={`${product.purchaseCycleYears}년`} />}
          </div>

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
            imageUrl: media.heroUrl,
          }} />
        </div>
      </div>
    </section>
  );
}
