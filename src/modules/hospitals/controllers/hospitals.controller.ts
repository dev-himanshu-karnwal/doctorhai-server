import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {}
