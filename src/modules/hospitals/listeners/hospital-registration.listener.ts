import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthAccountRegisteredEvent } from '../../../common/events';
import {
  ADDRESS_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import type { IAddressService } from '../../addresses/interfaces';
import type { IHospitalService } from '../interfaces/hospital-service.interface';

@Injectable()
export class HospitalRegistrationListener {
  constructor(
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
  ) {}

  @OnEvent('auth.account.registered')
  async handleAccountRegistered(
    event: AuthAccountRegisteredEvent,
  ): Promise<void> {
    if (event.registrationType !== 'hospital') return;
    if (!event.hospitalPayload) return;

    const address = await this.addressService.create({
      addressLine1: event.address.addressLine1,
      addressLine2: event.address.addressLine2 ?? null,
      city: event.address.city,
      state: event.address.state,
      pincode: event.address.pincode,
      latitude: event.address.latitude ?? null,
      longitude: event.address.longitude ?? null,
    });

    await this.hospitalService.create({
      accountId: event.accountId,
      addressId: address.id,
      name: event.hospitalPayload.name,
      slug: event.hospitalPayload.slug,
      phone: event.phone,
      email: event.email,
      coverPhotoUrl: event.hospitalPayload.coverPhotoUrl ?? null,
    });
  }
}
