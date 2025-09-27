import { IsString, IsOptional, IsObject, IsBoolean, IsEmail, IsPhoneNumber } from 'class-validator';

export class UpdateHospitalProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsObject()
  @IsOptional()
  aiSettings?: {
    summarizationEnabled?: boolean;
    predictionEnabled?: boolean;
    anonymizationLevel?: string;
  };
}
