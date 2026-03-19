import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GlobalFilterQueryDto } from './dto/global-filter-query.dto';
import { GlobalFilterResponseDto } from './dto/global-filter-response.dto';
import type { IGlobalSearchService } from './interfaces/global-service.interface';
import { GLOBAL_SERVICE_TOKEN } from '../../common/constants';
import { Public } from '../../common/decorators';

@ApiTags('Global')
@Controller('global-search')
export class GlobalSearchController {
  constructor(
    @Inject(GLOBAL_SERVICE_TOKEN)
    private readonly globalService: IGlobalSearchService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Global search for doctors and hospitals',
    description:
      'Fetch doctors and hospitals matching the search criteria. If doctors match the filters, their associated hospitals are also included.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully fetched global results',
    type: GlobalFilterResponseDto,
  })
  async filter(
    @Query() query: GlobalFilterQueryDto,
  ): Promise<GlobalFilterResponseDto> {
    return this.globalService.filter(query);
  }
}
