declare module 'nodemailer' {
  type TransportOptions = {
    host: string; port: number; secure: boolean; requireTLS?: boolean;
    auth: {user: string; pass: string};
    tls?: {minVersion?: string; rejectUnauthorized?: boolean};
    connectionTimeout?: number; greetingTimeout?: number; socketTimeout?: number;
  };
  type MailOptions = {
    from: {name: string; address: string}; to: string; subject: string; text: string;
  };
  const nodemailer: {
    createTransport(options: TransportOptions): {
      sendMail(options: MailOptions): Promise<{accepted?: string[]}>;
      close(): void;
    };
  };
  export default nodemailer;
}
