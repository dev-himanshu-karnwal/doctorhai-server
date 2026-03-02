import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccountEntity } from '../entities';
import type { AuthResponseDto } from '../dto';
import type { ITokenService } from '../interfaces/token-service.interface';

@Injectable()
export class TokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAuthPayload(account: AccountEntity): AuthResponseDto {
    const payload = {
      sub: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      accountId: account.id,
      loginType: account.loginType,
      email: account.email,
      username: account.username,
    };
  }
}
