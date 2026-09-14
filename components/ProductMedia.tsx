import type { Product } from '@/lib/products';
import { getProductMedia } from '@/lib/product-images';
import { getProductDisplayTitle } from '@/lib/product-display';
import { getApprovedDetailImageUrls } from '@/lib/detail-image-policy';

type ProductImageProps = {
  product: Product;
  variant?: 'card' | 'detail';
};

// 2026-09-14 대표이미지 전수검수 중 표준 400/600 정사각형 썸네일 규칙에서 벗어난 3건만
// 동일 모델·급여코드를 다시 확인하고 수동으로 고정합니다.
const MANUALLY_AUDITED_HERO_OVERRIDES: Record<string, string> = {
  // MIRAGE22D-P: 이로움의 급여코드 자체 파일명으로 연결된 해당 제품 원본.
  'catalog-m18030043103-manual-wheelchair': 'https://eroumcare.com/data/item/new/M18030043103.jpg',
  // YH-CR02: 이로움의 해당 상품 ID 폴더에 연결된 동일제품 원본.
  'catalog-h12030031004-pressure-cushion': 'https://eroumcare.com/data/item/PRO2021022500577/YHCR02.png',
  // LS-20F: 이로움 GIF 대신 동일 급여코드의 판매업체 연락처/상호가 없는 제품 구조 이미지 사용.
  'catalog-m03031003103-cane': 'https://carestore.co.kr/welfare/details/images/M03031003103/09.jpg',
};

// 과거 수동 보정은 검증 원장 썸네일이 없을 때만 fallback으로 사용합니다.
const PRODUCT_ONLY_HERO_FALLBACKS: Record<string, string> = {
  'slt-10-silver-walker': 'https://bestlifeplus.com/web/product/big/202407/7a3d9516f76ebe0374234c7947c88529.png',
  'catalog-s03090178005-electric-bed': 'https://gagaon.com/data/item/S03090178005/thumb-7LKc64WEBEDST30_600x600.jpg',
  'catalog-s03090183002-electric-bed': 'https://gagaon.com/data/item/S03090183002/thumb-SE7030_1_600x600.jpg',
};

function isVerifiedCatalogThumbnail(url?: string) {
  if (!url) return false;
  const normalized = url.toLowerCase();
  const isSquareThumb = normalized.includes('thumb-')
    && (normalized.includes('400x400') || normalized.includes('600x600'));
  if (!isSquareThumb) return false;

  return normalized.startsWith('https://eroumcare.com/data/item/')
    || normalized.startsWith('https://www.eroumcare.com/data/item/')
    || normalized.startsWith('https://gagaon.com/data/item/')
    || normalized.startsWith('https://www.gagaon.com/data/item/');
}

function getVerifiedCatalogHero(product: Product) {
  const directCandidates = [product.imageUrl, ...(product.imageUrls ?? [])];
  return directCandidates.find((url) => isVerifiedCatalogThumbnail(url));
}

function getDisplayHeroUrl(product: Product, fallback?: string) {
  // 수동 검수 3건 > 현재 유통·급여코드 검증 원장의 표준 대표 썸네일 > 과거 수동 fallback 순서입니다.
  return MANUALLY_AUDITED_HERO_OVERRIDES[product.slug]
    ?? getVerifiedCatalogHero(product)
    ?? PRODUCT_ONLY_HERO_FALLBACKS[product.slug]
    ?? fallback;
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

  // 대표 영역에는 검수된 제품사진 한 장만 노출합니다.
  // 판매몰 추가 썸네일은 상세 검수 없이 자동 노출하지 않습니다.
  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img id={`product-hero-${product.slug}`} src={heroUrl} alt={`${title} 대표 제품사진`} />
      </div>
    </div>
  );
}

// Backward compatibility for older imports.
export function ProductGallery({ product }: { product: Product }) {
  return <ProductHeroGallery product={product} />;
}

export function ProductDetailMedia({ product }: { product: Product }) {
  const media = getProductMedia(product);
  const detailUrls = getApprovedDetailImageUrls(product, media);
  if (!detailUrls.length) return null;

  const title = getProductDisplayTitle(product);
  return (
    <section className="content-card" style={{ marginTop: 28 }} aria-label={`${title} 제품 상세 이미지`}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>PRODUCT DETAIL</p>
      <h2 style={{ marginTop: 0 }}>제품 상세 이미지</h2>
      <p className="muted">
        동일 모델로 확인된 기능·규격·사용 설명 이미지만 표시합니다. 판매업체 상호·전화번호·서비스지역·주문 안내가 포함될 가능성이 있는 판매용 상세시트는 제외합니다.
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
    </section>
  );
}
