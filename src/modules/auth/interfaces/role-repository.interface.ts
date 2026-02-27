import { RoleEntity } from '../entities';
import type { CreateRoleDto } from '../dto';
import type { UpdateRoleDto } from '../dto';

export interface IRoleRepository {
  findById(id: string): Promise<RoleEntity | null>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  create(data: CreateRoleDto): Promise<RoleEntity>;
  update(id: string, data: UpdateRoleDto): Promise<RoleEntity>;
}
