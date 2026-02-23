import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PERMISSION_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  ACCOUNT_REPOSITORY_TOKEN,
  PERMISSION_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
} from '../../common/constants';
import { AccountSchema, PermissionSchema, RoleSchema } from './schemas';
import {
  AccountsRepository,
  PermissionsRepository,
  RolesRepository,
} from './repositories';
import { AccountsService, PermissionsService, RolesService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Permission', schema: PermissionSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Account', schema: AccountSchema },
    ]),
  ],
  controllers: [],
  providers: [
    { provide: PERMISSION_REPOSITORY_TOKEN, useClass: PermissionsRepository },
    { provide: ROLE_REPOSITORY_TOKEN, useClass: RolesRepository },
    { provide: ACCOUNT_REPOSITORY_TOKEN, useClass: AccountsRepository },
    { provide: PERMISSION_SERVICE_TOKEN, useClass: PermissionsService },
    { provide: ROLE_SERVICE_TOKEN, useClass: RolesService },
    { provide: ACCOUNT_SERVICE_TOKEN, useClass: AccountsService },
  ],
  exports: [
    PERMISSION_SERVICE_TOKEN,
    ROLE_SERVICE_TOKEN,
    ACCOUNT_SERVICE_TOKEN,
  ],
})
export class AuthModule {}
