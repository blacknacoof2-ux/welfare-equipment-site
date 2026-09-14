import type { Product } from '@/lib/products';
import { getProductMedia } from '@/lib/product-images';
import { getProductDisplayTitle } from '@/lib/product-display';

type ProductImageProps = {
  product: Product;
  variant?: 'card' | 'detail';
};

// 판매몰 상세페이지 캡처·서비스지역·전화번호·판매업체 상호가 포함된 이미지는
// 사용자 화면에 노출하지 않습니다. 대표사진은 급여코드가 검증된 상품 원장의
// 정사각형 썸네일을 최우선으로 사용하고, 없는 경우에만 수동 검증 이미지를 사용합니다.
const PRODUCT_ONLY_HERO_OVERRIDES: Record<string, string> = {
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
  // 현재 유통·급여코드 검증 원장에 연결된 정사각형 대표 썸네일을 가장 먼저 사용합니다.
  // 이 규칙으로 외부 판매몰의 editor/detail/NNEditor 판매용 시트가 대표사진으로 승격되는 것을 막습니다.
  return getVerifiedCatalogHero(product)
    ?? PRODUCT_ONLY_HERO_OVERRIDES[product.slug]
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

  // 판매업체 상호·연락처가 포함될 수 있는 추가 썸네일/상세 시트는 전부 숨기고
  // 제품 상세페이지에는 대표 제품사진 한 장만 노출합니다.
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

export function ProductDetailMedia({ product: _product }: { product: Product }) {
  // 정책: 외부 판매몰에서 가져온 긴 상세이미지는 판매업체명·전화번호·서비스지역 등
  // 제3자 판매정보가 포함될 수 있으므로 사용자 화면에서는 렌더링하지 않습니다.
  // 제조사/규격/기능 정보는 구조화된 텍스트 상세정보로만 제공합니다.
  return null;
}
