import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { AddressDocument } from '../schemas';
import { AddressEntity } from '../entities';
import { AddressMapper, type AddressDocLike } from '../mappers';
import type {
  IAddressRepository,
  CreateAddressInput,
  UpdateAddressInput,
} from '../interfaces';

@Injectable()
export class AddressesRepository implements IAddressRepository {
  constructor(
    @InjectModel('Address')
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  async findById(id: string): Promise<AddressEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.addressModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    return doc ? AddressMapper.toDomain(doc) : null;
  }

  async create(
    data: CreateAddressInput,
    session?: ClientSession,
  ): Promise<AddressEntity> {
    const options = session ? { session } : {};
    const [doc] = await this.addressModel.create(
      [
        {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 ?? null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        },
      ],
      options,
    );
    return AddressMapper.toDomain(doc);
  }

  async update(
    id: string,
    data: UpdateAddressInput,
    session?: ClientSession,
  ): Promise<AddressEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const options = session ? { session, new: true } : { new: true };
    const doc = await this.addressModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        options,
      )
      .lean()
      .exec();
    return doc ? AddressMapper.toDomain(doc as AddressDocLike) : null;
  }

  async delete(id: string, session?: ClientSession): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    const options = session ? { session } : {};
    await this.addressModel.findByIdAndDelete(id, options).exec();
  }
}
