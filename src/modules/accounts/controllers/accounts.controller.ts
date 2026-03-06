import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import type { IAccountService } from '../interfaces/account-service.interface';
import { AccountsQueryDto } from '../dto/accounts-query.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { ApiResponse } from '../../../common/classes/api-response.class';
import { ACCOUNT_SERVICE_TOKEN } from '../../../common/constants';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@RequirePermissions({ permissions: ['super_admin.manage'] })
@Controller('accounts')
export class AccountsController {
  constructor(
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all accounts with pagination, search, and sort',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    type: AccountResponseDto,
    isArray: true,
  })
  async getAccounts(@Query() query: AccountsQueryDto) {
    const data = await this.accountService.getAccounts(query);
    // User requested format: data { paginatedmetadata: {}, account: [{}] }
    // ApiResponse.success wraps in { status, message, data: { [dataKey]: value } }
    return ApiResponse.success(data, 'Accounts retrieved successfully', 'data');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @SwaggerResponse({ status: HttpStatus.OK, type: AccountResponseDto })
  async getAccountById(@Param('id') id: string) {
    const account = await this.accountService.getAccountById(id);
    return ApiResponse.success(
      account,
      'Account retrieved successfully',
      'account',
    );
  }
}
