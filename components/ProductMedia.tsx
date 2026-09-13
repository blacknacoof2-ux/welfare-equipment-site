import type { Product } from '@/lib/products';
import { getProductMedia } from '@/lib/product-images';
import { getProductDisplayTitle } from '@/lib/product-display';

type ProductImageProps = {
  product: Product;
  variant?: 'card' | 'detail';
};

// Some supplier HERO assets are long-form sales sheets rather than a clean product cut.
// Keep product-only overrides here so cards and detail HERO areas always lead with the product itself.
const PRODUCT_ONLY_HERO_OVERRIDES: Record<string, string> = {
  'slt-10-silver-walker': 'https://bestlifeplus.com/web/product/big/202407/7a3d9516f76ebe0374234c7947c88529.png',
};

function getDisplayHeroUrl(product: Product, fallback?: string) {
  return PRODUCT_ONLY_HERO_OVERRIDES[product.slug] ?? fallback;
}

function Placeholder({ product, variant }: ProductImageProps) {
  return (
    <div className={`product-image-placeholder ${variant === 'detail' ? 'detail' : ''}`}>
      <span>{product.category}</span>
      <strong>{product.name}</strong>
      <small>제품 이미지 준비중</small>
    </div>
  );
}

export function ProductImage({ product, variant = 'card' }: ProductImageProps) {
  const media = getProductMedia(product);
  const heroUrl = getDisplayHeroUrl(product, media?.heroUrl);
  if (!heroUrl) return <Placeholder product={product} variant={variant} />;

  const title = getProductDisplayTitle(product);
  return (
    <div className={`product-image-wrap ${variant === 'detail' ? 'detail' : ''}`}>
      <img
        src={heroUrl}
        alt={`${title} ${product.category} 제품사진`}
        loading={variant === 'card' ? 'lazy' : 'eager'}
      />
    </div>
  );
}

export function ProductHeroGallery({ product }: { product: Product }) {
  const media = getProductMedia(product);
  const heroUrl = getDisplayHeroUrl(product, media?.heroUrl);
  if (!heroUrl) {
    return (
      <div>
        <Placeholder product={product} variant="detail" />
        <p className="image-note">대표 제품 이미지를 등록 중입니다.</p>
      </div>
    );
  }

  const title = getProductDisplayTitle(product);
  const galleryUrls = (media?.galleryUrls ?? []).filter((url) => url !== heroUrl);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={heroUrl} alt={`${title} 대표 제품사진`} />
      </div>

      {galleryUrls.length > 0 && (
        <div className="product-gallery-thumbs" aria-label={`${title} 추가 제품사진`}>
          {galleryUrls.slice(0, 8).map((url, index) => (
            <div className="product-gallery-thumb" key={`${url}-${index}`}>
              <img src={url} alt={`${title} 제품사진 ${index + 2}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Backward compatibility for older imports.
export function ProductGallery({ product }: { product: Product }) {
  return <ProductHeroGallery product={product} />;
}

export function ProductDetailMedia({ product }: { product: Product }) {
  const media = getProductMedia(product);
  const heroUrl = getDisplayHeroUrl(product, media?.heroUrl);
  const detailUrls = (media?.detailUrls ?? []).filter(
    (url) => url !== heroUrl && !(media?.galleryUrls ?? []).includes(url),
  );
  if (!detailUrls.length) return null;

  const title = getProductDisplayTitle(product);
  return (
    <section className="content-card" style={{ marginTop: 28 }} aria-label={`${title} 제품 상세 이미지`}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>DETAIL IMAGES</p>
      <h2 style={{ marginTop: 0 }}>제품 상세 이미지</h2>
      <p className="muted">
        규격·기능·설치·사용 설명 이미지는 대표 제품사진과 분리해 아래에 원본 비율로 표시합니다.
      </p>

      <div style={{ display: 'grid', gap: 22, marginTop: 20 }}>
        {detailUrls.map((url, index) => (
          <figure
            id={`detail-image-${product.slug}-${index + 1}`}
            key={`${url}-detail-${index}`}
            style={{ margin: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff' }}
          >
            <img
              src={url}
              alt={`${title} 상세 설명 이미지 ${index + 1}`}
              loading="lazy"
              style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          </figure>
        ))}
      </div>

      {media?.detailSourceUrl && (
        <p className="image-note" style={{ marginTop: 14 }}>
          {media.detailSourceLabel} · <a href={media.detailSourceUrl} target="_blank" rel="noreferrer">상세 이미지 출처</a>
        </p>
      )}
    </section>
  );
}
