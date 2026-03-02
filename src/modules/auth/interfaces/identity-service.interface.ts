import type { AccountEntity } from '../entities';

export interface IIdentityService {
  findOneByLogin(
    loginType: string,
    value: string,
  ): Promise<AccountEntity | null>;
  checkUsernameAvailable(username: string): Promise<boolean>;
  ensureUsernameAvailable(username: string): Promise<void>;
}
