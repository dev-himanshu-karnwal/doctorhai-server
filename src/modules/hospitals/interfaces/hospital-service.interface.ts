import type { ClientSession } from 'mongoose';
import { HospitalEntity } from '../entities';

export interface IHospitalService {
  findByAccountId(accountId: string): Promise<HospitalEntity | null>;
  create(
    data: {
      accountId: string;
      addressId: string;
      name: string;
      slug: string;
      phone: string;
      email: string;
      coverPhotoUrl?: string | null;
    },
    session?: ClientSession,
  ): Promise<HospitalEntity>;
}
