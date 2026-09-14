import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/AdminLoginForm';
import { getCurrentAdminSession, isAdminAuthConfigured } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const session = await getCurrentAdminSession();
  if (session) redirect('/admin');

  return (
    <div className="admin-login-shell">
      <AdminLoginForm />
      {!isAdminAuthConfigured() && (
        <div className="admin-setup-warning">
          <strong>관리자 계정 설정이 필요합니다.</strong>
          <p>.env.local에 ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET를 설정하면 로그인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
