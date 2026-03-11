import { Injectable, Inject } from '@nestjs/common';
import {
  ACCOUNT_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  PASSWORD_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
} from '../../../common/constants';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAccountService } from '../interfaces/account-service.interface';
import type { IRoleService } from '../interfaces/role-service.interface';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type { IIdentityService } from '../interfaces/identity-service.interface';
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
    @Inject(PASSWORD_SERVICE_TOKEN)
    private readonly passwordService: IPasswordService,
    @Inject(IDENTITY_SERVICE_TOKEN)
    private readonly identityService: IIdentityService,
  ) {}

  async ensureUsernameAvailable(username: string): Promise<void> {
    await this.identityService.ensureUsernameAvailable(username);
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

    const passwordHash = await this.passwordService.hash(plainPassword);

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
