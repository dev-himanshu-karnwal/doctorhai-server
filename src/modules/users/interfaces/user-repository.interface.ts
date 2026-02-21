import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  create(email: string, name?: string): Promise<UserEntity>;
}
