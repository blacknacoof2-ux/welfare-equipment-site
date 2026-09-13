import type { Metadata } from 'next';
import ConsultCart from '@/components/ConsultCart';

export const metadata: Metadata = {
  title: '상담 장바구니·장기요양인정서 제출',
  description: '선택한 복지용구를 모아 상담받고 장기요양인정서를 제출해 실제 급여 가능 여부와 본인부담금을 확인 요청하세요.',
  alternates: { canonical: '/consult/cart' },
  robots: { index: false, follow: true },
};

export default function ConsultCartPage() {
  return <ConsultCart />;
}
