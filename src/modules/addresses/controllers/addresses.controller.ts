import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ADDRESS_SERVICE_TOKEN } from '../../../common/constants';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiResponse } from '../../../common/classes/api-response.class';
import { UpdateAddressDto } from '../dto/update-address.dto';
import type { IAddressService } from '../interfaces';
import { CurrentUser } from '../../../common/decorators';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

@ApiTags('Addresses')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('addresses')
export class AddressesController {
  private readonly logger = new Logger(AddressesController.name);

  constructor(
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
  ) {}

  @Patch(':accountId')
  @ApiOperation({ summary: 'Save (upsert) address for a specific account' })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Address saved' })
  async upsertByAccount(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug(
      `Address upsert request for account ${accountId} by user ${user.sub}`,
    );
    const address = await this.addressService.upsertByAccount(
      accountId,
      user.sub,
      dto,
    );
    return ApiResponse.success(
      address,
      'Address saved successfully',
      'address',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID with role-based access control' })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Address retrieved' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.logger.debug(
      `Address retrieval request for ${id} by user ${user.sub}`,
    );

    const address = await this.addressService.findByIdWithPermission(
      id,
      user.sub,
    );
    return ApiResponse.success(
      address,
      'Address retrieved successfully',
      'address',
    );
  }
}
