import type { RegisterDto } from '../dto/register.dto';
import type { LoginDto } from '../dto/login.dto';
import type { AuthResponseDto } from '../dto/auth-response.dto';
import type { CheckUsernameResponseDto } from '../dto/check-username-response.dto';
import type { MeResponseDto } from '../dto/me-response.dto';

export interface IAuthFlowService {
  register(dto: RegisterDto): Promise<AuthResponseDto>;
  login(dto: LoginDto): Promise<AuthResponseDto>;
  checkUsernameAvailable(username: string): Promise<CheckUsernameResponseDto>;
  getMe(accountId: string): Promise<MeResponseDto>;
  getPermissionKeysForAccount(accountId: string): Promise<string[]>;
  updateEmail(
    requestedByAccountId: string,
    targetAccountId: string,
    newEmail: string,
  ): Promise<void>;
  setAccountVerified(accountId: string, verified: boolean): Promise<void>;
}
