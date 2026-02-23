import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  PERMISSION_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  ACCOUNT_REPOSITORY_TOKEN,
  PERMISSION_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  AUTH_FLOW_SERVICE_TOKEN,
} from '../../common/constants';
import { AccountSchema, PermissionSchema, RoleSchema } from './schemas';
import {
  AccountsRepository,
  PermissionsRepository,
  RolesRepository,
} from './repositories';
import {
  AccountsService,
  AuthFlowService,
  PermissionsService,
  RolesService,
} from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './auth.controller';
import { AddressesModule } from '../addresses';
import { DoctorProfilesModule } from '../doctor-profiles';
import { HospitalsModule } from '../hospitals';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Permission', schema: PermissionSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Account', schema: AccountSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiresIn') ?? '15m',
        },
      }),
      inject: [ConfigService],
    }),
    AddressesModule,
    DoctorProfilesModule,
    HospitalsModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: PERMISSION_REPOSITORY_TOKEN, useClass: PermissionsRepository },
    { provide: ROLE_REPOSITORY_TOKEN, useClass: RolesRepository },
    { provide: ACCOUNT_REPOSITORY_TOKEN, useClass: AccountsRepository },
    { provide: PERMISSION_SERVICE_TOKEN, useClass: PermissionsService },
    { provide: ROLE_SERVICE_TOKEN, useClass: RolesService },
    { provide: ACCOUNT_SERVICE_TOKEN, useClass: AccountsService },
    { provide: AUTH_FLOW_SERVICE_TOKEN, useClass: AuthFlowService },
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [
    PERMISSION_SERVICE_TOKEN,
    ROLE_SERVICE_TOKEN,
    ACCOUNT_SERVICE_TOKEN,
  ],
})
export class AuthModule {}
