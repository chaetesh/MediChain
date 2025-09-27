import { IsString, IsEmail, IsObject, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AdminDetailsDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  password: string;
}

export class RegisterHospitalDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  zipCode: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  registrationNumber: string;

  @ValidateNested()
  @Type(() => AdminDetailsDto)
  adminDetails: AdminDetailsDto;

  @IsArray()
  @IsOptional()
  departments?: string[];

  @IsArray()
  @IsOptional()
  facilities?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}