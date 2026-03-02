import { Injectable, Inject } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_TOKEN } from '../../../common/constants';
import { BusinessRuleViolationException } from '../../../common/exceptions';
import type { IAccountRepository } from '../interfaces/account-repository.interface';
import type { IIdentityService } from '../interfaces/identity-service.interface';
import type { AccountEntity } from '../entities';

@Injectable()
export class IdentityService implements IIdentityService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async findOneByLogin(
    loginType: string,
    value: string,
  ): Promise<AccountEntity | null> {
    return this.accountRepo.findOneByLogin(loginType, value.trim());
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.findOneByLogin('username', username);
    return !existing;
  }

  async ensureUsernameAvailable(username: string): Promise<void> {
    const available = await this.checkUsernameAvailable(username);
    if (!available) {
      throw new BusinessRuleViolationException(
        `Username '${username}' is already taken`,
      );
    }
  }
}
