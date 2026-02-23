import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  Public,
  CurrentUser,
  RequirePermissions,
} from '../../common/decorators';
import { ApiResponse } from '../../common/classes';
import type { DataKeyWrapper } from '../../common/interfaces';
import { AUTH_FLOW_SERVICE_TOKEN } from '../../common/constants';
import type { IAuthFlowService } from './interfaces/auth-flow-service.interface';
import type { JwtPayload } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import {
  RegisterDto,
  LoginDto,
  CheckUsernameDto,
  CreateDoctorByHospitalDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
  MeResponseDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_FLOW_SERVICE_TOKEN)
    private readonly authFlowService: IAuthFlowService,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register',
    description:
      'Register as hospital or doctor. Common: name, email, phone, address. Doctor must provide: username, designation, specialization.',
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  async register(@Body() dto: RegisterDto): Promise<DataKeyWrapper<'auth'>> {
    const result = await this.authFlowService.register(dto);
    return ApiResponse.withDataKey('auth', result);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Hospital: loginType=email + email + password. Doctor: loginType=username + username + password.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<DataKeyWrapper<'auth'>> {
    const result = await this.authFlowService.login(dto);
    return ApiResponse.withDataKey('auth', result);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the currently logged-in user. Accepts access token from cookie (access_token) or Bearer header.',
  })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<DataKeyWrapper<'user'>> {
    const result = await this.authFlowService.getMe(user.sub);
    return ApiResponse.withDataKey('user', result);
  }

  @Post('check-username')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check username availability',
    description:
      'For doctor registration: returns whether the username is available.',
  })
  @ApiOkResponse({ type: CheckUsernameResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async checkUsername(
    @Body() dto: CheckUsernameDto,
  ): Promise<DataKeyWrapper<'availability'>> {
    const result = await this.authFlowService.checkUsernameAvailable(
      dto.username,
    );
    return ApiResponse.withDataKey('availability', result);
  }

  @Post('hospital/doctors')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    permissions: ['hospital.doctor.create', 'super_admin.manage'],
    requireAll: false,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hospital creates doctor',
    description:
      'Hospital creates a doctor account. Requires auth and permission hospital.doctor.create or super_admin.manage; createdBy is set from JWT. Same profile info as doctor self-registration; hospital chooses username.',
  })
  @ApiCreatedResponse({ description: 'Created doctor profile' })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async createDoctorByHospital(
    @Body() dto: CreateDoctorByHospitalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DataKeyWrapper<'doctor'>> {
    const result = await this.authFlowService.createDoctorByHospital(
      dto,
      user.sub,
    );
    return ApiResponse.withDataKey('doctor', result);
  }
}
