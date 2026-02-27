import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators';
import { ApiResponse } from '../../common/classes';
import type { DataKeyWrapper } from '../../common/interfaces';
import {
  AUTH_FLOW_SERVICE_TOKEN,
  PASSWORD_RESET_SERVICE_TOKEN,
} from '../../common/constants';
import type { IAuthFlowService } from './interfaces/auth-flow-service.interface';
import type { IPasswordResetService } from './interfaces/password-reset-service.interface';
import type { JwtPayload } from './strategies/jwt.strategy';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordRequestDto,
  ForgotPasswordVerifyDto,
  ForgotPasswordResetDto,
  ForgotPasswordVerifyResponseDto,
  CheckUsernameDto,
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
    @Inject(PASSWORD_RESET_SERVICE_TOKEN)
    private readonly passwordResetService: IPasswordResetService,
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

  @Post('forgot-password/request')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      'Creates a password reset session and sends a 6-digit OTP to the email if account exists. Response is always generic to avoid leaking account existence.',
  })
  @ApiOkResponse({
    description: 'If account exists, OTP sent. If not, same response returned.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async requestForgotPassword(
    @Body() dto: ForgotPasswordRequestDto,
  ): Promise<DataKeyWrapper<'message'>> {
    await this.passwordResetService.requestReset(dto);
    return ApiResponse.withDataKey(
      'message',
      'If account exists, OTP sent to email',
    );
  }

  @Post('forgot-password/verify')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description:
      'Verifies the 6-digit OTP for the given email and returns a short-lived reset token plus linked profiles.',
  })
  @ApiOkResponse({ type: ForgotPasswordVerifyResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired OTP' })
  async verifyForgotPasswordOtp(
    @Body() dto: ForgotPasswordVerifyDto,
  ): Promise<DataKeyWrapper<'reset'>> {
    const result = await this.passwordResetService.verifyOtp(dto);
    return ApiResponse.withDataKey('reset', result);
  }

  @Post('forgot-password/reset')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using reset token',
    description:
      'Changes the password for the selected account using a short-lived reset token issued after OTP verification.',
  })
  @ApiOkResponse({
    description: 'Password updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
  async resetForgotPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ForgotPasswordResetDto,
  ): Promise<DataKeyWrapper<'message'>> {
    const token = this.extractBearerToken(authorization);
    await this.passwordResetService.resetPassword(token, dto);
    return ApiResponse.withDataKey('message', 'Password updated successfully');
  }

  private extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }
    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }
    return token;
  }
}
