import {
  AccountEntity,
  AccountRoleAssignmentEntity,
} from '../../auth/entities';
import { AccountsQueryDto } from '../dto';

export interface PaginatedAccountsResponse {
  paginatedmetadata: {
    total: number;
    page: number;
    limit: number;
  };
  account: AccountEntity[];
}

export interface DetailedAccountResponse {
  id: string;
  loginType: string;
  email: string;
  username: string | null;
  isActive: boolean;
  isVerified: boolean;
  roles: AccountRoleAssignmentEntity[];
  createdAt: Date;
  updatedAt: Date;
  doctor?: {
    id: string;
    fullName: string;
    designation: string | null;
    specialization: string | null;
    phone: string;
    email: string;
    slug: string;
    profilePhotoUrl: string | null;
  } | null;
  hospital?: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    email: string;
    coverPhotoUrl: string | null;
    isActive: boolean;
    type?: string | null;
  } | null;
  address?: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface IAccountService {
  getAccounts(query: AccountsQueryDto): Promise<PaginatedAccountsResponse>;
  getAccountById(id: string): Promise<DetailedAccountResponse>;
  updateVerificationStatus(
    id: string,
    isVerified: boolean,
  ): Promise<AccountEntity>;
  deleteAccount(id: string): Promise<void>;
}
