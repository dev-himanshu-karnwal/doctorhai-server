import { PermissionEntity } from '../entities';

export interface CreatePermissionInput {
  key: string;
  description?: string | null;
}

export interface UpdatePermissionInput {
  key?: string;
  description?: string | null;
}

export interface IPermissionRepository {
  findById(id: string): Promise<PermissionEntity | null>;
  findByKey(key: string): Promise<PermissionEntity | null>;
  findAll(): Promise<PermissionEntity[]>;
  create(data: CreatePermissionInput): Promise<PermissionEntity>;
  update(id: string, data: UpdatePermissionInput): Promise<PermissionEntity>;
}
