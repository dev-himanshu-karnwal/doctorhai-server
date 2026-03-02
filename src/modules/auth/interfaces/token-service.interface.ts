import type { AccountEntity } from '../entities';
import type { AuthResponseDto } from '../dto';

export interface ITokenService {
  signAuthPayload(account: AccountEntity): AuthResponseDto;
}
