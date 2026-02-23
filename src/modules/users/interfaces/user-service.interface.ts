import { CreateUserDto, UserResponseDto } from '../dto';

export interface IUserService {
  findById(id: string): Promise<UserResponseDto>;
  create(dto: CreateUserDto): Promise<UserResponseDto>;
}
