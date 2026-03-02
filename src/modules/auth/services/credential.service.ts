import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PASSWORD_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
} from '../../../common/constants';
import type { IPasswordService } from '../interfaces/password-service.interface';
import type { IIdentityService } from '../interfaces/identity-service.interface';
import type { ICredentialService } from '../interfaces/credential-service.interface';
import type { AccountEntity } from '../entities';

@Injectable()
export class CredentialService implements ICredentialService {
  private readonly logger = new Logger(CredentialService.name);

  constructor(
    @Inject(PASSWORD_SERVICE_TOKEN)
    private readonly passwordService: IPasswordService,
    @Inject(IDENTITY_SERVICE_TOKEN)
    private readonly identityService: IIdentityService,
  ) {}

  async verifyCredentials(
    loginType: string,
    value: string,
    password: string,
  ): Promise<AccountEntity> {
    const account = await this.identityService.findOneByLogin(loginType, value);
    if (!account) {
      this.logger.warn(`Login failed: no account for ${loginType}:${value}`);
      throw new UnauthorizedException('Invalid login credentials');
    }

    if (!account.passwordHash) {
      this.logger.warn(`Login failed: account ${account.id} has no password`);
      throw new UnauthorizedException('Invalid login credentials');
    }

    if (!account.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordValid = await this.passwordService.compare(
      password,
      account.passwordHash,
    );
    if (!passwordValid) {
      this.logger.warn(
        `Login failed: wrong password for ${loginType}:${value}`,
      );
      throw new UnauthorizedException('Invalid login credentials');
    }

    return account;
  }
}
