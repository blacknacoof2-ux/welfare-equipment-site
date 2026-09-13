import { ProductImage } from '@/components/ProductMedia';
import { getBenefitModeEmoji, getBenefitModeLabel, getCategoryEmoji } from '@/lib/category-ui';
import { isSameProductNameAndModel } from '@/lib/product-display';
import { getBenefitMode, getCopays, getPriceSuffix, type Product } from '@/lib/products';

const formatter = new Intl.NumberFormat('ko-KR');

export default function ProductCard({ product, showCode = false }: { product: Product; showCode?: boolean }) {
  const mode = getBenefitMode(product);
  const copays = getCopays(product.benefitPrice);
  const suffix = getPriceSuffix(product);
  const showModel = !isSameProductNameAndModel(product);
  const priceLabel = mode === 'RENTAL' ? '월 일반 본인부담금 15%' : '일반 본인부담금 15%';

  return (
    <a className="content-card product-card" href={`/products/${product.slug}`}>
      <ProductImage product={product} />
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="category-chip"><span aria-hidden="true">{getCategoryEmoji(product.category)}</span>{product.category}</span>
          <span className={`benefit-mode-badge mode-${mode.toLowerCase()}`}>
            <span aria-hidden="true">{getBenefitModeEmoji(mode)}</span>{getBenefitModeLabel(mode)}
          </span>
        </div>
        <h2>{product.name}</h2>
        <p className="product-maker">{product.manufacturer}{showModel ? ` · ${product.model}` : ''}</p>
        {showCode && <p className="muted product-code">급여코드 {product.benefitCode}</p>}
        <div className="card-price-block">
          <span>{priceLabel}</span>
          <strong>{formatter.format(copays.copay15)}원{suffix}</strong>
          <small>감경 9% {formatter.format(copays.copay9)}원{suffix} · 감경 6% {formatter.format(copays.copay6)}원{suffix}</small>
        </div>
      </div>
    </a>
  );
}
