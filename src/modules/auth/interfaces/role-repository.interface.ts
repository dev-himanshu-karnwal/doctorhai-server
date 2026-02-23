import { RoleEntity } from '../entities';

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  isSystem?: boolean;
  permissionIds?: string[];
}

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  create(data: CreateRoleInput): Promise<RoleEntity>;
  update(id: string, data: UpdateRoleInput): Promise<RoleEntity>;
}
