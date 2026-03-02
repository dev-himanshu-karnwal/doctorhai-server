import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

export interface IDoctorStatusService {
  updateStatus(data: UpdateDoctorStatusDto): Promise<void>;
}
