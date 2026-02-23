import { Injectable, Logger, Inject } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_TOKEN } from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { AccountRoleAssignmentEntity } from '../entities';
import type {
  CreateAccountInput,
  IAccountRepository,
  IAccountService,
  UpdateAccountInput,
} from '../interfaces';

@Injectable()
export class AccountsService implements IAccountService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepo: IAccountRepository,
  ) {}

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IAccountService['findById']>>> {
    this.logger.debug(`Finding account by id: ${id}`);
    const entity = await this.accountRepo.findById(id);
    if (!entity) throw new ResourceNotFoundException('Account', id);
    return entity;
  }

  async findByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<Awaited<ReturnType<IAccountService['findByLogin']>>> {
    this.logger.debug(`Finding account by login: ${loginType}:${loginValue}`);
    return this.accountRepo.findByLogin(loginType, loginValue);
  }

  async create(
    data: CreateAccountInput,
  ): Promise<Awaited<ReturnType<IAccountService['create']>>> {
    this.logger.debug(`Creating account: ${data.loginType}:${data.loginValue}`);
    const existing = await this.accountRepo.findByLogin(
      data.loginType,
      data.loginValue,
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        `Account with login ${data.loginType}:${data.loginValue} already exists`,
      );
    }
    return this.accountRepo.create(data);
  }

  async update(
    id: string,
    data: UpdateAccountInput,
  ): Promise<Awaited<ReturnType<IAccountService['update']>>> {
    this.logger.debug(`Updating account: ${id}`);
    return this.accountRepo.update(id, data);
  }

  async softDelete(id: string): Promise<void> {
    this.logger.debug(`Soft-deleting account: ${id}`);
    await this.accountRepo.softDelete(id);
  }

  async addRole(
    accountId: string,
    assignment: AccountRoleAssignmentEntity,
  ): Promise<Awaited<ReturnType<IAccountService['addRole']>>> {
    this.logger.debug(
      `Adding role ${assignment.roleId} to account: ${accountId}`,
    );
    return this.accountRepo.addRole(accountId, assignment);
  }

  async removeRole(
    accountId: string,
    roleId: string,
  ): Promise<Awaited<ReturnType<IAccountService['removeRole']>>> {
    this.logger.debug(`Removing role ${roleId} from account: ${accountId}`);
    return this.accountRepo.removeRole(accountId, roleId);
  }
}
