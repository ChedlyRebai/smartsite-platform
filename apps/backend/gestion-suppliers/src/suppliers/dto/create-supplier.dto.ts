import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

import { SupplierCategory } from '../entities/supplier.entity';

export class CreateSupplierDto {
  // ✅ CORE (from main)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(SupplierCategory)
  category: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[0-9+\s]{10,}$/)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  address: string;

  @IsString()
  @Matches(/^[0-9]{14}$/)
  siret: string;

  @IsString()
  createdBy: string;

  @IsString()
  createdByName: string;

  // ✅ EXTRA (from your version)
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialities?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryDelay?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  materialsSupplied?: string[];

  @IsOptional()
  coordonnees?: {
    latitude?: number;
    longitude?: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}