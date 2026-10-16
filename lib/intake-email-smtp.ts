import nodemailer from 'nodemailer';

export type IntakeEmailNotification = {
  requestId: string;
  submittedAt: string;
  productCount: number;
};

const recipient = 'atomcare@naver.com';
const smtpHost = 'smtp.naver.com';

export function isIntakeEmailEnabled() {
  return process.env.CONSULTATION_SMTP_ENABLED === 'true';
}

function getSmtpConfig() {
  if (!isIntakeEmailEnabled()) return null;

  const user = process.env.SMTP_USER?.trim() ?? '';
  const password = process.env.SMTP_PASS?.trim() ?? '';
  const host = process.env.SMTP_HOST?.trim().toLowerCase() ?? '';
  const port = Number(process.env.SMTP_PORT);
  const to = process.env.INQUIRY_TO_EMAIL?.trim().toLowerCase() ?? '';

  // Fail closed. Do not fall back to a different host, user, or recipient.
  if (host !== smtpHost || port !== 587 || user.toLowerCase() !== recipient ||
      to !== recipient || !password || password.length < 8) {
    throw new Error('SMTP_CONFIGURATION_INVALID');
  }
  return { user, password };
}

export async function sendIntakeEmailNotification(
  notification: IntakeEmailNotification,
): Promise<'sent' | 'disabled'> {
  const config = getSmtpConfig();
  if (!config) return 'disabled';

  if (!/^AC-\d{8}-[A-F0-9]{8}$/.test(notification.requestId) ||
      !Number.isFinite(Date.parse(notification.submittedAt)) ||
      !Number.isSafeInteger(notification.productCount) ||
      notification.productCount < 0 || notification.productCount > 30) {
    throw new Error('SMTP_NOTIFICATION_DATA_INVALID');
  }

  const submittedAt = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul',
  }).format(new Date(notification.submittedAt));
  const subject = '[아톰케어 복지용구] 신규 주문·상담 접수';
  const lines = [
    '복지용구 사이트에 신규 접수가 등록되었습니다.',
    `접수번호: ${notification.requestId}`,
    `접수일시: ${submittedAt}`,
    `신청제품 수: ${notification.productCount}개`,
    '관리자 접수 확인: https://welfare.atomcare.co.kr/admin',
    '',
    '개인정보·장기요양인정번호·첨부서류는 이메일에 포함하지 않습니다.',
  ];
  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: config.user, pass: config.password },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 7_000,
  });

  try {
    const info = await transport.sendMail({
      from: { name: '아톰케어 복지용구', address: config.user },
      to: recipient,
      subject,
      text: lines.join('\n'),
    });
    if (!info.accepted?.some((address) => address.toLowerCase() === recipient)) {
      throw new Error('SMTP_RECIPIENT_NOT_ACCEPTED');
    }
    return 'sent';
  } finally {
    transport.close();
  }
}
