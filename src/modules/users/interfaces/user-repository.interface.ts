import { UserEntity } from '../entities';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  create(email: string, name?: string): Promise<UserEntity>;
}
