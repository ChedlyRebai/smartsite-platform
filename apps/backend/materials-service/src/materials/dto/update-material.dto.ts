import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialDto } from './create-material.dto';
import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damagedQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

export class UpdateStockDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  operation: 'add' | 'remove' | 'reserve' | 'damage';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
