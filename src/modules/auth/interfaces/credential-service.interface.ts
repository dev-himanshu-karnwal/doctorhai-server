import type { AccountEntity } from '../entities';

export interface ICredentialService {
  verifyCredentials(
    loginType: string,
    value: string,
    password: string,
  ): Promise<AccountEntity>;
}
