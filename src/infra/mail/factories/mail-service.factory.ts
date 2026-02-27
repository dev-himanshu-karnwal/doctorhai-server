import { Injectable } from '@nestjs/common';
import type { IMailService } from '../interfaces/mail-service.interface';
import { MailProvider } from '../enums/mail-provider.enum';
import { NodemailerMailService } from '../strategies/nodemailer-mail.service';
import { AppConfigService } from '../../../config';

@Injectable()
export class MailServiceFactory {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly nodemailerMailService: NodemailerMailService,
  ) {}

  create(): IMailService {
    const provider = this.appConfig.mailProvider;

    switch (provider) {
      case MailProvider.NODEMAILER:
      default:
        return this.nodemailerMailService;
    }
  }
}
