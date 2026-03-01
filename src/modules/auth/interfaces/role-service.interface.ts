import { RoleEntity } from '../entities';
import type { CreateRoleDto } from '../dto';
import type { UpdateRoleDto } from '../dto';

export interface IRoleService {
  findById(id: string): Promise<RoleEntity>;
  findByIds(ids: string[]): Promise<RoleEntity[]>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  create(data: CreateRoleDto): Promise<RoleEntity>;
  update(id: string, data: UpdateRoleDto): Promise<RoleEntity>;
}
