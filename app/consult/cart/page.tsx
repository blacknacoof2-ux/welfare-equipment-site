import type { Metadata } from 'next';
import ConsultCart from '@/components/ConsultCart';

export const metadata: Metadata = {
  title: '복지용구 신청목록·수급자 정보 제출',
  description: '선택한 복지용구를 신청목록에 담고 수급자 정보와 장기요양인정서를 함께 제출하세요.',
  alternates: { canonical: '/consult/cart' },
  robots: { index: false, follow: true },
};

export default function ConsultCartPage() {
  return <ConsultCart />;
}
