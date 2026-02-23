import { Injectable, Logger, Inject } from '@nestjs/common';
import { ROLE_REPOSITORY_TOKEN } from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { IRoleRepository, IRoleService } from '../interfaces';
import type { CreateRoleDto, UpdateRoleDto } from '../dto';

@Injectable()
export class RolesService implements IRoleService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN)
    private readonly roleRepo: IRoleRepository,
  ) {}

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IRoleService['findById']>>> {
    this.logger.debug(`Finding role by id: ${id}`);
    const entity = await this.roleRepo.findById(id);
    if (!entity) throw new ResourceNotFoundException('Role', id);
    return entity;
  }

  async findByName(
    name: string,
  ): Promise<Awaited<ReturnType<IRoleService['findByName']>>> {
    this.logger.debug(`Finding role by name: ${name}`);
    return this.roleRepo.findByName(name);
  }

  async findAll(): Promise<Awaited<ReturnType<IRoleService['findAll']>>> {
    this.logger.debug('Finding all roles');
    return this.roleRepo.findAll();
  }

  async create(
    data: CreateRoleDto,
  ): Promise<Awaited<ReturnType<IRoleService['create']>>> {
    this.logger.debug(`Creating role with name: ${data.name}`);
    const existing = await this.roleRepo.findByName(data.name);
    if (existing) {
      throw new BusinessRuleViolationException(
        `Role with name '${data.name}' already exists`,
      );
    }
    return this.roleRepo.create(data);
  }

  async update(
    id: string,
    data: UpdateRoleDto,
  ): Promise<Awaited<ReturnType<IRoleService['update']>>> {
    this.logger.debug(`Updating role: ${id}`);
    if (data.name != null) {
      const existing = await this.roleRepo.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new BusinessRuleViolationException(
          `Role with name '${data.name}' already exists`,
        );
      }
    }
    return this.roleRepo.update(id, data);
  }
}
