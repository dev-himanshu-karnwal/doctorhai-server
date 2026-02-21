import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { IUserRepository } from './interfaces/user-repository.interface';

@Injectable()
export class UsersRepository implements IUserRepository {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .lean()
      .exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async create(email: string, name?: string): Promise<UserEntity> {
    const [doc] = await this.userModel.create([
      { email, name: name ?? null, deletedAt: null },
    ]);
    return UserMapper.toDomain(doc);
  }
}
