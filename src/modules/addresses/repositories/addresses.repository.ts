import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddressDocument } from '../schemas';
import { AddressEntity } from '../entities';
import { AddressMapper } from '../mappers';
import type { IAddressRepository, CreateAddressInput } from '../interfaces';

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

  async create(data: CreateAddressInput): Promise<AddressEntity> {
    const [doc] = await this.addressModel.create([
      {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 ?? null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
    ]);
    return AddressMapper.toDomain(doc);
  }
}
