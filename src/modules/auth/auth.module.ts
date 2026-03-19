import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../../config';
import { APP_GUARD } from '@nestjs/core';
import {
  PERMISSION_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  ACCOUNT_REPOSITORY_TOKEN,
  PASSWORD_RESET_REPOSITORY_TOKEN,
  PERMISSION_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  OTP_SERVICE_TOKEN,
  PASSWORD_RESET_SERVICE_TOKEN,
  ACCOUNT_CREATION_SERVICE_TOKEN,
  AUTH_FLOW_SERVICE_TOKEN,
  PASSWORD_SERVICE_TOKEN,
  IDENTITY_SERVICE_TOKEN,
  CREDENTIAL_SERVICE_TOKEN,
  TOKEN_SERVICE_TOKEN,
} from '../../common/constants';
import {
  AccountSchema,
  PasswordResetSchema,
  PermissionSchema,
  RoleSchema,
} from './schemas';
import {
  AccountsRepository,
  PasswordResetRepository,
  PermissionsRepository,
  RolesRepository,
} from './repositories';
import {
  AccountsService,
  AuthFlowService,
  AuthMeService,
  AuthRegistrationService,
  PermissionsService,
  AccountCreationService,
  PasswordResetService,
  RolesService,
  PasswordService,
  IdentityService,
  CredentialService,
  TokenService,
} from './services';
import { OtpService } from '../../common/classes';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
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
      { name: 'PasswordReset', schema: PasswordResetSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.jwtSecret,
        signOptions: {
          expiresIn: appConfig.jwtExpiresIn,
        },
      }),
      inject: [AppConfigService],
    }),
    forwardRef(() => AddressesModule),
    forwardRef(() => DoctorProfilesModule),
    forwardRef(() => HospitalsModule),
  ],
  controllers: [AuthController],
  providers: [
    { provide: PERMISSION_REPOSITORY_TOKEN, useClass: PermissionsRepository },
    { provide: ROLE_REPOSITORY_TOKEN, useClass: RolesRepository },
    { provide: ACCOUNT_REPOSITORY_TOKEN, useClass: AccountsRepository },
    {
      provide: PASSWORD_RESET_REPOSITORY_TOKEN,
      useClass: PasswordResetRepository,
    },
    { provide: PERMISSION_SERVICE_TOKEN, useClass: PermissionsService },
    { provide: ROLE_SERVICE_TOKEN, useClass: RolesService },
    { provide: ACCOUNT_SERVICE_TOKEN, useClass: AccountsService },
    {
      provide: PASSWORD_RESET_SERVICE_TOKEN,
      useClass: PasswordResetService,
    },
    {
      provide: ACCOUNT_CREATION_SERVICE_TOKEN,
      useClass: AccountCreationService,
    },
    {
      provide: OTP_SERVICE_TOKEN,
      useClass: OtpService,
    },
    { provide: PASSWORD_SERVICE_TOKEN, useClass: PasswordService },
    { provide: IDENTITY_SERVICE_TOKEN, useClass: IdentityService },
    { provide: CREDENTIAL_SERVICE_TOKEN, useClass: CredentialService },
    { provide: TOKEN_SERVICE_TOKEN, useClass: TokenService },
    AuthMeService,
    AuthRegistrationService,
    { provide: AUTH_FLOW_SERVICE_TOKEN, useClass: AuthFlowService },
    JwtStrategy,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [
    PermissionsGuard,
    PERMISSION_SERVICE_TOKEN,
    ROLE_SERVICE_TOKEN,
    ACCOUNT_SERVICE_TOKEN,
    ACCOUNT_CREATION_SERVICE_TOKEN,
    AUTH_FLOW_SERVICE_TOKEN,
  ],
})
export class AuthModule {}
