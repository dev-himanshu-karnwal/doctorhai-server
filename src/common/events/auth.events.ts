/**
 * Typed event payloads for auth-related cross-module communication.
 * Past-tense, dot-notation: auth.account.registered
 */

export interface AddressPayload {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type RegistrationType = 'hospital' | 'doctor';

export class AuthAccountRegisteredEvent {
  constructor(
    public readonly accountId: string,
    public readonly registrationType: RegistrationType,
    public readonly email: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly address: AddressPayload,
    /** Present when registrationType is 'doctor' */
    public readonly username?: string,
    /** Hospital: name, slug, coverPhotoUrl. Doctor: fullName, designation, specialization, slug, bio, profilePhotoUrl */
    public readonly hospitalPayload?: {
      name: string;
      slug: string;
      coverPhotoUrl?: string | null;
    },
    public readonly doctorPayload?: {
      fullName: string;
      designation: string;
      specialization: string;
      slug: string;
      bio?: string | null;
      profilePhotoUrl?: string | null;
    },
  ) {}
}
