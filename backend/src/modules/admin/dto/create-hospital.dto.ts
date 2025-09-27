import { IsString, IsEmail, IsObject, IsOptional, IsArray } from 'class-validator';

export class CreateHospitalDto {
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
  zip: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  registrationNumber: string;

  @IsObject()
  adminDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title?: string;
  };

  @IsArray()
  @IsOptional()
  departments?: string[];

  @IsArray()
  @IsOptional()
  facilities?: string[];
}
