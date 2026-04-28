import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { SupplierCategory } from '../entities/supplier.entity';

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Supplier name must be at least 2 characters' })
  @MaxLength(100)
  name?: string;

  @IsEnum(SupplierCategory, { message: 'Please select a category' })
  @IsOptional()
  category?: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @Matches(/^[0-9+\s]{10,}$/, {
    message: 'Please enter a valid phone number (min 10 digits)',
  })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Address must be at least 5 characters' })
  @MaxLength(255)
  address?: string;

  @IsString()
  @Matches(/^[0-9]{14}$/, {
    message: 'SIRET must be exactly 14 digits (numbers only)',
  })
  @IsOptional()
  siret?: string;
}
