import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../../common/constants';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IUserRepository } from '../interfaces';
import { IUserService } from '../interfaces';
import { CreateUserDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mappers';

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
