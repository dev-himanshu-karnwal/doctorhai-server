import {
  Controller,
  Patch,
  Param,
  Body,
  Inject,
  UseGuards,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ADDRESS_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
  ACCOUNT_SERVICE_TOKEN,
  ROLE_SERVICE_TOKEN,
} from '../../../common/constants';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { ApiResponse } from '../../../common/classes/api-response.class';
import { UpdateAddressDto } from '../dto/update-address.dto';
import type { IAddressService } from '../interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IAccountService } from '../../auth/interfaces/account-service.interface';
import type { IRoleService } from '../../auth/interfaces/role-service.interface';
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
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(ACCOUNT_SERVICE_TOKEN)
    private readonly accountService: IAccountService,
    @Inject(ROLE_SERVICE_TOKEN)
    private readonly roleService: IRoleService,
  ) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update address with role-based access control' })
  @SwaggerResponse({ status: HttpStatus.OK, description: 'Address updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug(`Address update request for ${id} by user ${user.sub}`);

    // 1. Fetch the account and roles
    const account = await this.accountService.findById(user.sub);
    const roleNames: string[] = [];
    for (const assignment of account.roles) {
      const role = await this.roleService.findById(assignment.roleId);
      roleNames.push(role.name);
    }

    const isSuperAdmin = roleNames.includes('super_admin');
    const isHospital = roleNames.includes('hospital');
    const isDoctor = roleNames.includes('doctor');

    // 2. Authorization Logic
    if (isSuperAdmin) {
      // Super Admin: Full access
    } else if (isHospital) {
      const requesterHospital = await this.hospitalService.findByAccountId(
        user.sub,
      );
      if (!requesterHospital) {
        throw new ForbiddenException('Hospital profile not found');
      }

      // Check if address belongs to the hospital
      const hospitalWithAddress =
        await this.hospitalService.findByAddressId(id);

      const isOwnAddress = hospitalWithAddress?.id === requesterHospital.id;

      if (!isOwnAddress) {
        // Check if address belongs to a doctor affiliated with this hospital
        const doctorWithAddress =
          await this.doctorProfileService.findByAddressId(id);
        const isAffiliatedDoctor =
          doctorWithAddress?.hospitalId === requesterHospital.id;

        if (!isAffiliatedDoctor) {
          throw new ForbiddenException(
            'You are not authorized to update this address',
          );
        }
      }
    } else if (isDoctor) {
      const requesterDoctor = await this.doctorProfileService.findByAccountId(
        user.sub,
      );
      if (!requesterDoctor) {
        throw new ForbiddenException('Doctor profile not found');
      }

      // Check if address belongs to the doctor
      const doctorWithAddress =
        await this.doctorProfileService.findByAddressId(id);
      const isOwnAddress = doctorWithAddress?.id === requesterDoctor.id;

      if (!isOwnAddress) {
        throw new ForbiddenException(
          'You are not authorized to update this address',
        );
      }
    } else {
      throw new ForbiddenException('Forbidden');
    }

    const updated = await this.addressService.update(id, dto);
    return ApiResponse.success(
      updated,
      'Address updated successfully',
      'address',
    );
  }
}
