import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '../../../config';
import type { IPasswordService } from '../interfaces/password-service.interface';

@Injectable()
export class PasswordService implements IPasswordService {
  constructor(private readonly appConfig: AppConfigService) {}

  async hash(password: string): Promise<string> {
    const bcryptRounds = this.appConfig.bcryptRounds;
    return (await bcrypt.hash(password, bcryptRounds)) as string;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return (await bcrypt.compare(password, hash)) as boolean;
  }
}
