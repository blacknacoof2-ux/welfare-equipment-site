'use client';

export default function AdminLogoutButton() {
  return (
    <button
      type="button"
      className="admin-logout"
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
        window.location.assign('/admin/login');
      }}
    >
      로그아웃
    </button>
  );
}
