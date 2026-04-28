import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { SupplierCategory } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'Supplier name is required (min 2 characters)' })
  @MinLength(2, { message: 'Supplier name is required (min 2 characters)' })
  @MaxLength(100)
  name: string;

  @IsEnum(SupplierCategory, { message: 'Please select a category' })
  category: string;

  @IsEmail({}, { message: 'Please enter a valid email address (e.g., name@domain.com)' })
  email: string;

  @IsString()
  @Matches(/^[0-9+\s]{10,}$/, {
    message: 'Please enter a valid phone number (min 10 digits)',
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required (min 5 characters)' })
  @MinLength(5, { message: 'Address is required (min 5 characters)' })
  @MaxLength(255)
  address: string;

  @IsString()
  @Matches(/^[0-9]{14}$/, {
    message: 'SIRET must be exactly 14 digits (numbers only)',
  })
  siret: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  createdByName: string;
}
