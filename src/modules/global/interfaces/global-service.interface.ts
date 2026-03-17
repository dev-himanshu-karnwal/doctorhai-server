import { GlobalFilterQueryDto } from '../dto/global-filter-query.dto';
import { GlobalFilterResponseDto } from '../dto/global-filter-response.dto';

export interface IGlobalSearchService {
  filter(query: GlobalFilterQueryDto): Promise<GlobalFilterResponseDto>;
}
