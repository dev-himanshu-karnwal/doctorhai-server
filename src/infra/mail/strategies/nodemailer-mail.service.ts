import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type {
  IMailService,
  MailMessage,
} from '../interfaces/mail-service.interface';
import { AppConfigService } from '../../../config';

interface NodemailerSentMessageInfo {
  messageId?: string;
  [key: string]: unknown;
}

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  constructor(private readonly appConfig: AppConfigService) {}

  async sendMail(message: MailMessage): Promise<void> {
    const defaultFrom = this.appConfig.mailDefaultFrom;
    const transportOptions: SMTPTransport.Options = {
      host: this.appConfig.mailSmtpHost,
      port: this.appConfig.mailSmtpPort,
      secure: this.appConfig.mailSmtpSecure,
      auth:
        this.appConfig.mailSmtpUser && this.appConfig.mailSmtpPass
          ? {
              user: this.appConfig.mailSmtpUser,
              pass: this.appConfig.mailSmtpPass,
            }
          : undefined,
    };
    // External library returns a transporter typed on a helper info object; this is safe for our usage.

    const transporter =
      nodemailer.createTransport<NodemailerSentMessageInfo>(transportOptions);
    const to = this.normalizeRecipient(message.to);

    try {
      await transporter.sendMail({
        from: message.from ?? defaultFrom,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error) {
        this.logger.error(
          `Failed to send mail to ${JSON.stringify(message.to)}`,
          caughtError.stack,
        );
        throw caughtError;
      }

      this.logger.error(`Failed to send mail to ${JSON.stringify(message.to)}`);
      throw new Error('Failed to send mail');
    }
  }

  private normalizeRecipient(to: MailMessage['to']): string | string[] {
    return to;
  }
}
