import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthAccountRegisteredEvent } from '../../../common/events';
import {
  ADDRESS_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
} from '../../../common/constants';
import type { IAddressService } from '../../addresses/interfaces';
import type { IDoctorProfileService } from '../interfaces/doctor-profile-service.interface';

@Injectable()
export class DoctorRegistrationListener {
  constructor(
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @OnEvent('auth.account.registered')
  async handleAccountRegistered(
    event: AuthAccountRegisteredEvent,
  ): Promise<void> {
    if (event.registrationType !== 'doctor') return;
    if (!event.doctorPayload || !event.username) return;

    const address = await this.addressService.create({
      addressLine1: event.address.addressLine1,
      addressLine2: event.address.addressLine2 ?? null,
      city: event.address.city,
      state: event.address.state,
      pincode: event.address.pincode,
      latitude: event.address.latitude ?? null,
      longitude: event.address.longitude ?? null,
    });

    await this.doctorProfileService.create({
      fullName: event.doctorPayload.fullName,
      designation: event.doctorPayload.designation,
      specialization: event.doctorPayload.specialization,
      phone: event.phone,
      email: event.email,
      addressId: address.id,
      accountId: event.accountId,
      slug: event.doctorPayload.slug,
      bio: event.doctorPayload.bio ?? null,
      profilePhotoUrl: event.doctorPayload.profilePhotoUrl ?? null,
      createdBy: null,
      hospitalId: null,
    });
  }
}
