export interface MailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface IMailService {
  sendMail(message: MailMessage): Promise<void>;
}
