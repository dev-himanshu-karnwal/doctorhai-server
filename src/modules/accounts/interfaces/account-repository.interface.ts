import { AccountEntity } from '../../auth/entities';
import { AccountsQueryDto } from '../dto/accounts-query.dto';
import { PaginatedResult } from '../../../common/interfaces';

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
  findAccounts(
    query: AccountsQueryDto,
  ): Promise<PaginatedResult<AccountEntity>>;
}
