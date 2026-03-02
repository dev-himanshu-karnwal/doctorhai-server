import { Injectable, Logger, Inject } from '@nestjs/common';
import { PERMISSION_REPOSITORY_TOKEN } from '../../../common/constants';
import {
  BusinessRuleViolationException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { IPermissionRepository, IPermissionService } from '../interfaces';
import type { CreatePermissionDto, UpdatePermissionDto } from '../dto';

@Injectable()
export class PermissionsService implements IPermissionService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @Inject(PERMISSION_REPOSITORY_TOKEN)
    private readonly permissionRepo: IPermissionRepository,
  ) {}

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IPermissionService['findById']>>> {
    this.logger.debug(`Finding permission by id: ${id}`);
    const entity = await this.permissionRepo.findById(id);
    if (!entity) throw new ResourceNotFoundException('Permission', id);
    return entity;
  }

  async findByIds(
    ids: string[],
  ): Promise<Awaited<ReturnType<IPermissionService['findByIds']>>> {
    if (ids.length === 0) return [];
    this.logger.debug(`Finding permissions by ids (${ids.length})`);
    return this.permissionRepo.findByIds(ids);
  }

  async findByKey(
    key: string,
  ): Promise<Awaited<ReturnType<IPermissionService['findByKey']>>> {
    this.logger.debug(`Finding permission by key: ${key}`);
    return this.permissionRepo.findByKey(key);
  }

  async findAll(): Promise<Awaited<ReturnType<IPermissionService['findAll']>>> {
    this.logger.debug('Finding all permissions');
    return this.permissionRepo.findAll();
  }

  async create(
    data: CreatePermissionDto,
  ): Promise<Awaited<ReturnType<IPermissionService['create']>>> {
    this.logger.debug(`Creating permission with key: ${data.key}`);
    const existing = await this.permissionRepo.findByKey(data.key);
    if (existing) {
      throw new BusinessRuleViolationException(
        `Permission with key '${data.key}' already exists`,
      );
    }
    return this.permissionRepo.create(data);
  }

  async update(
    id: string,
    data: UpdatePermissionDto,
  ): Promise<Awaited<ReturnType<IPermissionService['update']>>> {
    this.logger.debug(`Updating permission: ${id}`);
    if (data.key != null) {
      const existing = await this.permissionRepo.findByKey(data.key);
      if (existing && existing.id !== id) {
        throw new BusinessRuleViolationException(
          `Permission with key '${data.key}' already exists`,
        );
      }
    }
    return this.permissionRepo.update(id, data);
  }
}
