import nodemailer from 'nodemailer';

const ADDRESS = 'atomcare@naver.com';

export async function sendAdminSmtpTestMail() {
  // This switch is independent from customer intake notifications.
  if (process.env.ADMIN_SMTP_TEST_ENABLED !== 'true') {
    throw new Error('SMTP_TEST_DISABLED');
  }
  const user = process.env.SMTP_USER?.trim().toLowerCase();
  const recipient = process.env.INQUIRY_TO_EMAIL?.trim().toLowerCase();
  const host = process.env.SMTP_HOST?.trim().toLowerCase();
  const port = process.env.SMTP_PORT;
  const password = process.env.SMTP_PASS?.trim() ?? '';
  if (user !== ADDRESS || recipient !== ADDRESS || host !== 'smtp.naver.com' ||
      port !== '587' || password.length < 8) {
    throw new Error('SMTP_TEST_CONFIG_INVALID');
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.naver.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: ADDRESS, pass: password },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 7_000,
  });
  try {
    const result = await transport.sendMail({
      from: { name: '아톰케어 복지용구', address: ADDRESS },
      to: ADDRESS,
      subject: '[아톰케어 복지용구] 관리자 SMTP 시험 메일',
      text: [
        '네이버 SMTP 연결 시험 메시지입니다.',
        '실제 고객 접수와 관계없는 관리자 시험 메일입니다.',
        '고객 개인정보 및 접수 DB 기록은 포함되지 않습니다.',
      ].join('\n'),
    });
    if (!result.accepted?.some((address) => address.toLowerCase() === ADDRESS)) {
      throw new Error('SMTP_TEST_RECIPIENT_REJECTED');
    }
    return 'accepted' as const;
  } finally {
    transport.close();
  }
}
