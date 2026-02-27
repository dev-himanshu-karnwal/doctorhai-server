import { Global, Module } from '@nestjs/common';
import { MAIL_SERVICE_TOKEN } from '../../common/constants';
import type { IMailService } from './interfaces/mail-service.interface';
import { NodemailerMailService } from './strategies/nodemailer-mail.service';
import { MailServiceFactory } from './factories/mail-service.factory';

@Global()
@Module({
  providers: [
    NodemailerMailService,
    MailServiceFactory,
    {
      provide: MAIL_SERVICE_TOKEN,
      useFactory: (factory: MailServiceFactory): IMailService =>
        factory.create(),
      inject: [MailServiceFactory],
    },
  ],
  exports: [MAIL_SERVICE_TOKEN],
})
export class MailModule {}
