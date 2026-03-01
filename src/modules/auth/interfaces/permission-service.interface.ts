import { PermissionEntity } from '../entities';
import type { CreatePermissionDto } from '../dto';
import type { UpdatePermissionDto } from '../dto';

export interface IPermissionService {
  findById(id: string): Promise<PermissionEntity>;
  findByIds(ids: string[]): Promise<PermissionEntity[]>;
  findByKey(key: string): Promise<PermissionEntity | null>;
  findAll(): Promise<PermissionEntity[]>;
  create(data: CreatePermissionDto): Promise<PermissionEntity>;
  update(id: string, data: UpdatePermissionDto): Promise<PermissionEntity>;
}
