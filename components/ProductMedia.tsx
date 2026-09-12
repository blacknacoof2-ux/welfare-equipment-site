import type { Product } from '@/lib/products';
import { getSupplementalDetailImages } from '@/lib/product-detail-images';
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
  const primary = getDisplayImages(product);
  const supplemental = getSupplementalDetailImages(product.slug);
  const urls = Array.from(new Set([
    ...primary.urls,
    ...(supplemental?.urls ?? []),
  ]));

  if (urls.length === 0) {
    return (
      <div>
        <Placeholder product={product} variant="detail" />
        <p className="image-note">대표 제품 이미지를 등록 중입니다.</p>
      </div>
    );
  }

  const detailUrls = urls.slice(1);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={urls[0]} alt={`${product.name} 대표 이미지`} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 10,
          fontSize: 12,
          color: '#667085',
        }}
      >
        <span>등록 이미지 {urls.length}장</span>
        {detailUrls.length > 0 && <span>아래에서 상세 이미지를 크게 확인할 수 있습니다.</span>}
      </div>

      {detailUrls.length > 0 && (
        <div className="product-gallery-thumbs">
          {detailUrls.slice(0, 8).map((url, index) => (
            <a className="product-gallery-thumb" href={`#detail-image-${product.slug}-${index + 1}`} key={`${url}-${index}`}>
              <img src={url} alt={`${product.name} 상세 이미지 미리보기 ${index + 1}`} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {primary.sourceUrl && (
        <p className="image-note">
          {primary.sourceLabel} · <a href={primary.sourceUrl} target="_blank" rel="noreferrer">대표 이미지 출처</a>
        </p>
      )}
      {supplemental?.sourceUrl && (
        <p className="image-note">
          {supplemental.sourceLabel} · <a href={supplemental.sourceUrl} target="_blank" rel="noreferrer">상세 이미지 출처</a>
        </p>
      )}

      {detailUrls.length > 0 ? (
        <section
          aria-label={`${product.name} 제품 상세 이미지`}
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <strong style={{ display: 'block', fontSize: 22, letterSpacing: '-0.03em' }}>제품 상세 이미지</strong>
            <span style={{ display: 'block', marginTop: 4, fontSize: 13, color: '#667085' }}>
              제품 구조·기능·규격 이미지를 원본 비율로 크게 표시합니다.
            </span>
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            {detailUrls.map((url, index) => (
              <figure
                id={`detail-image-${product.slug}-${index + 1}`}
                key={`${url}-detail-${index}`}
                style={{
                  margin: 0,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  background: '#fff',
                }}
              >
                <img
                  src={url}
                  alt={`${product.name} ${product.model} 상세 이미지 ${index + 1}`}
                  loading="lazy"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <figcaption style={{ padding: '10px 14px', fontSize: 12, color: '#667085' }}>
                  {product.name} 상세 이미지 {index + 1}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            color: '#667085',
            fontSize: 13,
          }}
        >
          이 제품은 현재 대표 이미지 1장만 등록되어 있습니다. 모델이 정확히 일치하는 제품 공급 자료를 확인한 뒤 상세 이미지를 추가합니다.
        </div>
      )}
    </div>
  );
}
