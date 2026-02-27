import { Schema, Document } from 'mongoose';

export interface AddressDocument extends Document {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const AddressSchema = new Schema<AddressDocument>(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { timestamps: true, collection: 'addresses' },
);

AddressSchema.index({ city: 1, state: 1 });
AddressSchema.index({ pincode: 1 });
