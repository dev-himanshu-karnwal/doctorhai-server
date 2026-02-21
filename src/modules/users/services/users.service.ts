import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../common/constants/injection-tokens';
import { ResourceNotFoundException } from '../../../common/exceptions/resource-not-found.exception';
import type { IUserRepository } from '../interfaces/user-repository.interface';
import { IUserService } from '../interfaces/user-service.interface';
import { UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UsersService implements IUserService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepo: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    this.logger.debug(`Finding user by id: ${id}`);
    const entity = await this.userRepo.findById(id);
    if (!entity) {
      throw new ResourceNotFoundException('User', id);
    }
    return UserMapper.toResponse(entity);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const entity = await this.userRepo.create(dto.email, dto.name);
    return UserMapper.toResponse(entity);
  }
}
