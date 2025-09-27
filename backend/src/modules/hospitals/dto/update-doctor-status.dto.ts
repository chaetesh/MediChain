import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum DoctorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class UpdateDoctorStatusDto {
  @IsEnum(DoctorStatus)
  status: DoctorStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
