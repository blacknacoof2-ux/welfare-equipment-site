# welfare-equipment-site

아톰케어 복지용구 전문 검색·비교·본인부담금 플랫폼입니다.

## 핵심 운영 기준

- 이로움 기준 **정상 유통 중인 제품만 게시**
- **단종 / 비유통 / 품절 / 일시품절 제외**
- 제품명, 모델명, 제조사, 급여코드, 급여가격을 교차검증 후 등록
- 가격은 **15% / 9% / 6% 본인부담금** 중심으로 표시
- 0% 가격 표기는 사용하지 않음
- 10원 미만 끝수는 계산하지 않는 방식으로 화면 표시
- 검증되지 않은 샘플 상품은 공개 데이터에 넣지 않음
- 이미지와 상세자료는 사용 권한과 제품 일치 여부를 확인한 자료만 사용

## SEO 구조

- Next.js App Router 기반 SSR/정적 렌더링
- 제품별 고유 title/description/canonical
- Product JSON-LD
- 자동 sitemap.xml / robots.txt
- 카테고리 → 제품 → 급여안내 내부링크 구조
- 본인부담금 계산기 및 정보형 랜딩페이지

## 상품 데이터

검증 완료 상품은 `lib/products.ts`에 추가합니다. `status: 'ACTIVE'` 상품만 웹사이트에 노출됩니다.

## 실행

```bash
npm install
npm run dev
```

배포 시 `NEXT_PUBLIC_SITE_URL`을 실제 서비스 도메인으로 설정해야 canonical, sitemap, robots URL이 정확히 생성됩니다.
