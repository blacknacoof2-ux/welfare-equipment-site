import type { Metadata } from 'next';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import './admin.css';

export const metadata: Metadata = {
  title: '아톰케어 관리자',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="atomcare-admin">
      <header className="admin-topbar">
        <a className="admin-brand" href="/admin">
          <strong>ATOM CARE</strong>
          <span>복지용구 접수관리</span>
        </a>
        <div className="admin-topbar-actions">
          <a href="/" target="_blank" rel="noreferrer">고객 사이트</a>
          <AdminLogoutButton />
        </div>
      </header>
      <div className="admin-page">{children}</div>
    </div>
  );
}
