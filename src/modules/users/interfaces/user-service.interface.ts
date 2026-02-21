import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';

export interface IUserService {
  findById(id: string): Promise<UserResponseDto>;
  create(dto: CreateUserDto): Promise<UserResponseDto>;
}
