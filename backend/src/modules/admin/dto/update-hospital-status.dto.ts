import { IsString, IsEnum } from 'class-validator';

export enum HospitalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export class UpdateHospitalStatusDto {
  @IsEnum(HospitalStatus)
  status: HospitalStatus;

  @IsString()
  notes: string;
}
