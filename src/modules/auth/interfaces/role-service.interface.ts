import { RoleEntity } from '../entities';
import type {
  CreateRoleInput,
  UpdateRoleInput,
} from './role-repository.interface';

export interface IRoleService {
  findById(id: string): Promise<RoleEntity>;
  findByName(name: string): Promise<RoleEntity | null>;
  findAll(): Promise<RoleEntity[]>;
  create(data: CreateRoleInput): Promise<RoleEntity>;
  update(id: string, data: UpdateRoleInput): Promise<RoleEntity>;
}
