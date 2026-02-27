import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '../../../config';
import {
  ACCOUNT_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
} from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { IAccountService } from '../interfaces/account-service.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IAccountCreationService } from '../interfaces/account-creation-service.interface';
import type { AccountEntity } from '../entities';
import type { CreateAccountDto } from '../dto';
import type { ClientSession } from 'mongoose';

@Injectable()
export class AccountCreationService implements IAccountCreationService {
  constructor(
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
    private readonly appConfig: AppConfigService,
  ) {}

  async ensureUsernameAvailable(username: string): Promise<void> {
    const existing = await this.accountService.findOneByLogin(
      'username',
      username.trim(),
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        `Username '${username}' is already taken`,
      );
    }
  }

  async createUsernameAccount(
    username: string,
    email: string,
    plainPassword: string,
    roleName: string,
    session?: ClientSession,
  ): Promise<AccountEntity> {
    const role = await this.roleService.findByName(roleName);
    if (!role) {
      throw new ResourceNotFoundException('Role', roleName);
    }

    const bcryptRounds = this.appConfig.bcryptRounds;
    const passwordHash = (await bcrypt.hash(
      plainPassword,
      bcryptRounds,
    )) as string;

    const createAccountDto: CreateAccountDto = {
      loginType: 'username',
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      isActive: true,
      roles: [{ roleId: role.id }],
    };

    return this.accountService.create(createAccountDto, session);
  }
}
