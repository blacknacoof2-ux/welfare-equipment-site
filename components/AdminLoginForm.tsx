'use client';

import { FormEvent, useState } from 'react';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || '로그인하지 못했습니다.');
      window.location.assign('/admin');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '로그인하지 못했습니다.');
    }
  }

  return (
    <form className="admin-login-card" onSubmit={submit}>
      <div>
        <p className="admin-kicker">ATOM CARE ADMIN</p>
        <h1>복지용구 접수관리</h1>
        <p>수급자 정보와 장기요양인정서를 확인하는 아톰케어 전용 관리자 화면입니다.</p>
      </div>
      <label>
        <span>관리자 아이디</span>
        <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
      </label>
      <label>
        <span>비밀번호</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? '로그인 중…' : '로그인'}</button>
      {message && <p className="admin-form-error">{message}</p>}
      <small>관리자 계정 정보는 서버 환경변수로만 관리됩니다.</small>
    </form>
  );
}
