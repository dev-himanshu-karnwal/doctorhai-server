import { BaseFilterDto } from '../../../common/dto/base-filter.dto';

export type AccountSortField = 'email' | 'username' | 'createdAt';

export class AccountsQueryDto extends BaseFilterDto<AccountSortField> {}
