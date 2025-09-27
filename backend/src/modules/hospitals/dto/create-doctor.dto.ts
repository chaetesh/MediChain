import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateDoctorDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  specialization: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  licenseNumber: string;

  @IsNumber()
  @IsOptional()
  experience?: number;

  @IsBoolean()
  @IsOptional()
  temporaryPassword?: boolean;
}
