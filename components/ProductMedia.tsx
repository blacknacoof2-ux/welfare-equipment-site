import type { Product } from '@/lib/products';
import { getAuthorizedProductImages } from '@/lib/product-images';

type ProductImageProps = {
  product: Product;
  variant?: 'card' | 'detail';
};

function getDisplayImages(product: Product) {
  const authorized = getAuthorizedProductImages(product);
  if (authorized?.urls.length) {
    return {
      urls: authorized.urls,
      sourceLabel: authorized.sourceLabel,
      sourceUrl: authorized.sourceUrl,
      usageBasis: authorized.usageBasis,
    };
  }

  return {
    urls: [] as string[],
    sourceLabel: '',
    sourceUrl: '',
    usageBasis: null,
  };
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
  const { urls } = getDisplayImages(product);
  const first = urls[0];

  if (!first) return <Placeholder product={product} variant={variant} />;

  return (
    <div className={`product-image-wrap ${variant === 'detail' ? 'detail' : ''}`}>
      <img
        src={first}
        alt={`${product.name} ${product.model} ${product.category}`}
        loading={variant === 'card' ? 'lazy' : 'eager'}
      />
    </div>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const { urls, sourceLabel, sourceUrl } = getDisplayImages(product);

  if (urls.length === 0) {
    return (
      <div>
        <Placeholder product={product} variant="detail" />
        <p className="image-note">대표 제품 이미지를 등록 중입니다.</p>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={urls[0]} alt={`${product.name} 대표 이미지`} />
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
      {sourceUrl && (
        <p className="image-note">
          {sourceLabel} · <a href={sourceUrl} target="_blank" rel="noreferrer">제품 출처 확인</a>
        </p>
      )}
    </div>
  );
}
