import type { RegisterDto } from '../dto/register.dto';
import type { LoginDto } from '../dto/login.dto';
import type { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import type { AuthResponseDto } from '../dto/auth-response.dto';
import type { CheckUsernameResponseDto } from '../dto/check-username-response.dto';
import type { MeResponseDto } from '../dto/me-response.dto';
import type { DoctorProfileEntity } from '../../doctor-profiles/entities';

export interface IAuthFlowService {
  register(dto: RegisterDto): Promise<AuthResponseDto>;
  login(dto: LoginDto): Promise<AuthResponseDto>;
  checkUsernameAvailable(username: string): Promise<CheckUsernameResponseDto>;
  createDoctorByHospital(
    dto: CreateDoctorByHospitalDto,
    createdByAccountId: string,
  ): Promise<DoctorProfileEntity>;
  getMe(accountId: string): Promise<MeResponseDto>;
  getPermissionKeysForAccount(accountId: string): Promise<string[]>;
}
