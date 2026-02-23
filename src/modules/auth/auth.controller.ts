import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, CurrentUser } from '../../common/decorators';
import { AUTH_FLOW_SERVICE_TOKEN } from '../../common/constants';
import type { IAuthFlowService } from './interfaces/auth-flow-service.interface';
import type { JwtPayload } from './strategies/jwt.strategy';
import {
  RegisterDto,
  LoginDto,
  CheckUsernameDto,
  CreateDoctorByHospitalDto,
  AuthResponseDto,
  CheckUsernameResponseDto,
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register',
    description:
      'Register as hospital or doctor. Common: name, email, phone, address. Doctor must provide: username, designation, specialization, doctorSlug.',
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authFlowService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Hospital: loginType=email + email + password. Doctor: loginType=username + username + password.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authFlowService.login(dto);
  }

  @Post('check-username')
  @Public()
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
  ): Promise<CheckUsernameResponseDto> {
    return this.authFlowService.checkUsernameAvailable(dto.username);
  }

  @Post('hospital/doctors')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hospital creates doctor',
    description:
      'Hospital creates a doctor account. Requires auth; createdBy is set from JWT. Same profile info as doctor self-registration; hospital chooses username.',
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createDoctorByHospital(
    @Body() dto: CreateDoctorByHospitalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AuthResponseDto> {
    return this.authFlowService.createDoctorByHospital(dto, user.sub);
  }
}
