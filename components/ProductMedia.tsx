import type { Product } from '@/lib/products';

type ProductImageProps = {
  product: Product;
  variant?: 'card' | 'detail';
};

function getVerifiedImages(product: Product) {
  const urls = [
    ...(product.imageUrls ?? []),
    ...(product.imageUrl ? [product.imageUrl] : []),
  ].filter(Boolean);

  return product.imageRightsConfirmed ? Array.from(new Set(urls)) : [];
}

function getDisplayImages(product: Product) {
  const verified = getVerifiedImages(product);
  if (verified.length > 0) return { urls: verified, isReference: false };

  // 개발 서버에서만 제품 식별용 참고 이미지를 표시합니다.
  // production build에서는 사용권 확인 전 이미지를 자동으로 숨깁니다.
  if (process.env.NODE_ENV !== 'production') {
    const refs = product.referenceImageUrls ?? [];
    if (refs.length > 0) return { urls: refs, isReference: true };
  }

  return { urls: [] as string[], isReference: false };
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
  const { urls, isReference } = getDisplayImages(product);
  const first = urls[0];

  if (!first) return <Placeholder product={product} variant={variant} />;

  return (
    <div className={`product-image-wrap ${variant === 'detail' ? 'detail' : ''}`}>
      <img src={first} alt={`${product.name} ${product.model} ${product.category}`} loading={variant === 'card' ? 'lazy' : 'eager'} />
      {isReference && <span className="reference-badge">개발용 참고 이미지</span>}
    </div>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const { urls, isReference } = getDisplayImages(product);

  if (urls.length === 0) {
    return (
      <div>
        <Placeholder product={product} variant="detail" />
        <p className="image-note">제조사·공급사 사용 허가 이미지가 확인되면 대표사진과 상세 갤러리로 자동 교체됩니다.</p>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={urls[0]} alt={`${product.name} 대표 이미지`} />
        {isReference && <span className="reference-badge">개발용 참고 이미지 · 배포판 자동 숨김</span>}
      </div>
      {urls.length > 1 && (
        <div className="product-gallery-thumbs">
          {urls.slice(1, 6).map((url, index) => (
            <div className="product-gallery-thumb" key={`${url}-${index}`}>
              <img src={url} alt={`${product.name} 상세 이미지 ${index + 2}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}
      {isReference && product.referenceImageSourceUrl && (
        <p className="image-note">
          로컬 검수용 참고 출처: <a href={product.referenceImageSourceUrl} target="_blank" rel="noreferrer">원본 페이지 확인</a>
        </p>
      )}
    </div>
  );
}
