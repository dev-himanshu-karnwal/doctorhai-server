import { Injectable, Logger, Inject } from '@nestjs/common';
import { ADDRESS_REPOSITORY_TOKEN } from '../../../common/constants';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAddressRepository, IAddressService } from '../interfaces';
import type { CreateAddressInput } from '../interfaces';

@Injectable()
export class AddressesService implements IAddressService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    @Inject(ADDRESS_REPOSITORY_TOKEN)
    private readonly addressRepo: IAddressRepository,
  ) {}

  async findById(
    id: string,
  ): Promise<Awaited<ReturnType<IAddressService['findById']>>> {
    this.logger.debug(`Finding address by id: ${id}`);
    const entity = await this.addressRepo.findById(id);
    if (!entity) throw new ResourceNotFoundException('Address', id);
    return entity;
  }

  async create(
    data: CreateAddressInput,
  ): Promise<Awaited<ReturnType<IAddressService['create']>>> {
    this.logger.debug('Creating address');
    return this.addressRepo.create(data);
  }
}
