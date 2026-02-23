import { PermissionEntity } from '../entities';
import type {
  CreatePermissionInput,
  UpdatePermissionInput,
} from './permission-repository.interface';

export interface IPermissionService {
  findById(id: string): Promise<PermissionEntity>;
  findByKey(key: string): Promise<PermissionEntity | null>;
  findAll(): Promise<PermissionEntity[]>;
  create(data: CreatePermissionInput): Promise<PermissionEntity>;
  update(id: string, data: UpdatePermissionInput): Promise<PermissionEntity>;
}
