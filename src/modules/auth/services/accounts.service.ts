import { Injectable, Logger, Inject } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_TOKEN } from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { IAccountRepository, IAccountService } from '../interfaces';
import type {
  CreateAccountDto,
  UpdateAccountDto,
  AddRoleToAccountDto,
} from '../dto';
import type { ClientSession } from 'mongoose';

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

  async findOneByLogin(
    loginType: string,
    loginValue: string,
  ): Promise<Awaited<ReturnType<IAccountService['findOneByLogin']>>> {
    this.logger.debug(`Finding account by login: ${loginType}:${loginValue}`);
    return this.accountRepo.findOneByLogin(loginType, loginValue);
  }

  async findAllByEmail(
    email: string,
    select?: readonly string[],
  ): Promise<Awaited<ReturnType<IAccountService['findAllByEmail']>>> {
    this.logger.debug(`Finding accounts by email: ${email}`);
    return this.accountRepo.findAllByEmail(email, select);
  }

  async create(
    data: CreateAccountDto,
    session?: ClientSession,
  ): Promise<Awaited<ReturnType<IAccountService['create']>>> {
    const identifier =
      data.loginType === 'email' ? data.email : (data.username ?? '');
    this.logger.debug(`Creating account: ${data.loginType}:${identifier}`);
    const existing = await this.accountRepo.findOneByLogin(
      data.loginType,
      identifier,
    );
    if (existing) {
      throw new BusinessRuleViolationException(
        `Account with login ${data.loginType}:${identifier} already exists`,
      );
    }
    return this.accountRepo.create(data, session);
  }

  async update(
    id: string,
    data: UpdateAccountDto,
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
    dto: AddRoleToAccountDto,
  ): Promise<Awaited<ReturnType<IAccountService['addRole']>>> {
    this.logger.debug(`Adding role ${dto.roleId} to account: ${accountId}`);
    return this.accountRepo.addRole(accountId, dto);
  }

  async removeRole(
    accountId: string,
    roleId: string,
  ): Promise<Awaited<ReturnType<IAccountService['removeRole']>>> {
    this.logger.debug(`Removing role ${roleId} from account: ${accountId}`);
    return this.accountRepo.removeRole(accountId, roleId);
  }
}
